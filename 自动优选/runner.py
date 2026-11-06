"""Daily carrier-specific proxy benchmarks. Uses an isolated Mihomo, never the user's client."""
import argparse
import concurrent.futures
import contextlib
import ctypes
import datetime as dt
import http.cookiejar
import http.client
import io
import ipaddress
import json
import logging
from logging.handlers import RotatingFileHandler
import os
import pathlib
import random
import secrets
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from history import TIMEZONE, performance_score, rank_history, select_preferred, update_history

LOG = logging.getLogger("cfnext-optimizer")
PORTS = [443, 2053, 2083, 2087, 2096, 8443]


class SourceUnavailable(Exception):
    pass


def native_management_request(request, config, cookie_file=None, timeout=30):
    """Native HTTPS for NAS management traffic; credentials travel in stdin, never argv/logs."""
    if urllib.parse.urlsplit(request.full_url).scheme != "https":
        raise ValueError("Management transport requires HTTPS")
    # ASVS 1.2.5/2.2.1: parameterized invocation, escaped curl config, bounded payload and deadlines.
    options = ["url = " + json.dumps(request.full_url), "request = " + json.dumps(request.get_method()),
               "silent", "show-error", "connect-timeout = " + str(min(timeout, 10)), "max-time = " + str(timeout), 'user-agent = "Mozilla/5.0"']
    if config.get("source_address"):
        options.append("interface = " + json.dumps(config["source_address"]))
    for key, value in request.header_items():
        options.append("header = " + json.dumps(key + ": " + value))
    if request.data is not None:
        if len(request.data) > 2 * 1048576:
            raise ValueError("Management payload too large")
        options.append("data-binary = " + json.dumps(request.data.decode("utf-8"), ensure_ascii=False))
    default_curl = str(pathlib.Path(os.environ.get("SystemRoot", "C:/Windows")) / "System32/curl.exe") if os.name == "nt" else "/usr/bin/curl"
    command = [config.get("curl", default_curl), "-q", "--ipv4", "--noproxy", "*", "--config", "-", "--write-out", "\n%{http_code}"]
    if cookie_file:
        command.extend(["--cookie", str(cookie_file), "--cookie-jar", str(cookie_file)])
    process = subprocess.run(command,
                             input=("\n".join(options) + "\n").encode(), stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=timeout + 5)
    if cookie_file and pathlib.Path(cookie_file).exists():
        os.chmod(cookie_file, 0o600)
    if process.returncode:
        raise urllib.error.URLError("Native management transport unavailable")
    content, status = process.stdout.rsplit(b"\n", 1)
    if not 200 <= int(status) < 300:
        raise urllib.error.HTTPError(request.full_url, int(status), "Management request rejected", {}, io.BytesIO(content))
    return content


def direct_opener(config, *handlers, panel_entries=None):
    source = config.get("source_address")
    if not source and not panel_entries:
        return urllib.request.build_opener(urllib.request.ProxyHandler({}), *handlers)
    entries = iter(())
    if panel_entries:
        import itertools
        entries = itertools.cycle(panel_entries)

    class BoundHTTPSHandler(urllib.request.HTTPSHandler):
        def https_open(self, request):
            def connection(host, **kwargs):
                conn = http.client.HTTPSConnection(host, source_address=(source, 0) if source else None, **kwargs)
                if panel_entries:
                    entry = next(entries)
                    # ASVS 1.2.2: only the socket destination changes; TLS still verifies the panel hostname.
                    conn._create_connection = lambda address, timeout=None, source_address=None: socket.create_connection(
                        entry, timeout=min(timeout or 15, 15), source_address=source_address)
                return conn
            return self.do_open(connection, request, context=self._context, check_hostname=self._check_hostname)
    return urllib.request.build_opener(urllib.request.ProxyHandler({}), BoundHTTPSHandler(), *handlers)


def protect_secret(data, decrypt=False):
    if os.name != "nt":
        return data
    from ctypes import wintypes

    class Blob(ctypes.Structure):
        _fields_ = [("size", wintypes.DWORD), ("data", ctypes.POINTER(ctypes.c_ubyte))]
    buf = ctypes.create_string_buffer(data)
    source = Blob(len(data), ctypes.cast(buf, ctypes.POINTER(ctypes.c_ubyte)))
    result = Blob()
    crypt = ctypes.windll.crypt32
    if decrypt:
        ok = crypt.CryptUnprotectData(ctypes.byref(source), None, None, None, None, 0, ctypes.byref(result))
    else:
        ok = crypt.CryptProtectData(ctypes.byref(source), "CFNext optimizer", None, None, None, 0, ctypes.byref(result))
    if not ok:
        raise OSError("Cannot access the optimizer credential with this Windows account")
    try:
        return ctypes.string_at(result.data, result.size)
    finally:
        ctypes.windll.kernel32.LocalFree(result.data)


def json_read(path, default=None):
    try:
        return json.loads(pathlib.Path(path).read_text(encoding="utf-8-sig"))
    except FileNotFoundError:
        return default


def json_write(path, value):
    path = pathlib.Path(path)
    staged = path.with_suffix(path.suffix + ".tmp")
    staged.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
    os.chmod(staged, 0o600)
    staged.replace(path)


class Panel:
    def __init__(self, config):
        self.config = config
        self.origin = config["panel"].rstrip("/")
        if urllib.parse.urlsplit(self.origin).scheme != "https":
            raise ValueError("Panel must use HTTPS")
        jar = http.cookiejar.CookieJar()
        entries = []
        native = config.get("management_transport") == "curl"
        self.cookie_directory = tempfile.TemporaryDirectory(prefix="cfnext-control-") if native else None
        self.cookie_file = pathlib.Path(self.cookie_directory.name) / "cookies.txt" if native else None
        if not native and config.get("storage_file") and config.get("carrier"):
            storage = json.loads(protect_secret(pathlib.Path(config["storage_file"]).read_bytes(), decrypt=True))
            label = {"unicom": "联通", "telecom": "电信"}[config["carrier"]]
            for credentials in list(storage.values())[:2]:
                raw = HistoryStore(credentials, config).value("config") or {}
                for node in raw.get("preferredIPs", []):
                    if label in node.get("name", ""):
                        ip, port = str(ipaddress.IPv4Address(node["ip"])), int(node.get("port", 443))
                        if ipaddress.ip_address(ip).is_global and 1 <= port <= 65535 and (ip, port) not in entries:
                            entries.append((ip, port))
        self.opener = direct_opener(config, urllib.request.HTTPCookieProcessor(jar), panel_entries=entries)
        password = protect_secret(pathlib.Path(config["password_file"]).read_bytes(), decrypt=True).decode()
        self.call(config.get("entry", "/admin"), {"password": password})

    def call(self, path, body=None, backend=None, timeout=30, max_attempts=None):
        headers = {"User-Agent": "CFNext-Daily-Optimizer", "Accept": "application/json"}
        if backend:
            headers["x-cfnext-config-backend"] = backend
        if body is not None:
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(self.origin + path, data=None if body is None else json.dumps(body).encode(), headers=headers)
        attempts = 3 if body is None or path == self.config.get("entry", "/admin") or path.endswith("/candidates") else 1
        if max_attempts is not None:
            attempts = max_attempts
        for attempt in range(attempts):
            try:
                if self.cookie_file:
                    data = json.loads(native_management_request(req, self.config, self.cookie_file, timeout))
                else:
                    with self.opener.open(req, timeout=timeout) as response:
                        data = json.load(response)
                break
            except urllib.error.HTTPError as error:
                if 400 <= error.code < 500 or attempt == attempts - 1:
                    raise
                time.sleep(1)
            except (TimeoutError, urllib.error.URLError):
                if attempt == attempts - 1:
                    raise
                time.sleep(1)
        if data.get("ok") is False:
            raise RuntimeError("Panel API rejected request: " + str(data.get("msg", "unknown error")))
        return data

    def api(self, backend, action, body=None):
        options = {"timeout": 12, "max_attempts": 1} if action == "candidates" else {}
        return self.call(self.config.get("entry", "/admin") + "/api/" + action, body, backend, **options)


class HistoryStore:
    """Official Cloudflare KV management API; no history access on proxy request paths."""
    def __init__(self, credentials, config=None):
        self.credentials = credentials
        self.settings = config or {}
        self.opener = direct_opener(self.settings)

    def value(self, key, body=None):
        c = self.credentials
        url = "https://api.cloudflare.com/client/v4/accounts/{}/storage/kv/namespaces/{}/values/{}".format(
            c["account"], c["namespace"], urllib.parse.quote(key, safe=""))
        req = urllib.request.Request(url, headers={"Authorization": "Bearer " + c["token"], "Content-Type": "text/plain"},
                                     data=None if body is None else json.dumps(body, ensure_ascii=False).encode(),
                                     method="GET" if body is None else "PUT")
        try:
            if self.settings.get("management_transport") == "curl":
                result = json.loads(native_management_request(req, self.settings))
            else:
                with self.opener.open(req, timeout=30) as response:
                    result = json.load(response)
        except urllib.error.HTTPError as error:
            if error.code == 404 and body is None:
                return None
            raise
        except (OSError, urllib.error.URLError):
            if self.settings.get("management_transport") == "curl":
                raise
            LOG.warning("KV Python HTTPS unavailable; retrying the same request with native HTTPS")
            try:
                result = json.loads(native_management_request(req, self.settings))
            except urllib.error.HTTPError as fallback_error:
                if fallback_error.code == 404 and body is None:
                    return None
                raise
        if body is not None and not result.get("success"):
            raise RuntimeError("KV write rejected")
        return result

    def read(self, carrier):
        history = self.value("optimizer-history:" + carrier) or {"version": 1, "days": []}
        # Apply the retention window to ranking as well, even after a long offline period.
        cutoff = (dt.datetime.now(TIMEZONE) - dt.timedelta(days=29)).date().isoformat()
        history["days"] = [d for d in history["days"] if d["day"] >= cutoff]
        return history

    def submit(self, carrier, results, backend_number, expected_uuid, refresh=False, apply=True):
        history, duplicate = update_history(self.read(carrier), results, refresh=refresh)
        if not duplicate or refresh:
            self.value("optimizer-history:" + carrier, history)
        ranking = rank_history(history)
        changed = False
        if apply and any(r["eligible"] for r in ranking):
            # Read the latest persisted config before a partial edit, preserving the other carrier.
            config = self.value("config")
            if not isinstance(config, dict) or config.get("uuid", expected_uuid) != expected_uuid:
                raise RuntimeError("KV configuration does not match this backend")
            preferred = select_preferred(config, carrier, ranking, backend_number)
            if preferred != config.get("preferredIPs", []):
                config["preferredIPs"] = preferred
                self.value("config", config)
                changed = True
        return {"days": len(history["days"]), "changed": changed, "duplicate": duplicate,
                "eligible": sum(r["eligible"] for r in ranking)}


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def mihomo_node(node, ip, port):
    if node.get("type") != "vless" or node.get("transport", {}).get("type") != "ws":
        raise ValueError("Daily optimizer currently requires a VLESS/WebSocket node")
    tls, ws = node.get("tls", {}), node["transport"]
    result = {"name": "candidate", "type": "vless", "server": ip, "port": port,
              "uuid": node["uuid"], "network": "ws", "tls": tls.get("enabled", True),
              "servername": tls.get("server_name", ""), "skip-cert-verify": tls.get("insecure", False),
              "udp": True, "ws-opts": {"path": ws.get("path", "/"), "headers": ws.get("headers", {})}}
    if tls.get("utls", {}).get("enabled"):
        result["client-fingerprint"] = tls["utls"].get("fingerprint", "chrome")
    if tls.get("alpn"):
        result["alpn"] = tls["alpn"]
    if node.get("packet_encoding"):
        result["packet-encoding"] = node["packet_encoding"]
    if node.get("flow"):
        result["flow"] = node["flow"]
    if ws.get("max_early_data"):
        result["ws-opts"]["max-early-data"] = ws["max_early_data"]
        result["ws-opts"]["early-data-header-name"] = ws.get("early_data_header_name", "Sec-WebSocket-Protocol")
    return result


class Mihomo:
    def __init__(self, executable, template, config):
        self.directory = tempfile.TemporaryDirectory(prefix="cfnext-daily-")
        self.root = pathlib.Path(self.directory.name)
        self.secret, self.proxy_port, self.control_port = secrets.token_urlsafe(24), free_port(), free_port()
        while self.control_port == self.proxy_port:
            self.control_port = free_port()
        self.template, self.settings = template, config
        runtime = {"mixed-port": self.proxy_port, "bind-address": "127.0.0.1", "allow-lan": False,
                   "external-controller": "127.0.0.1:" + str(self.control_port), "secret": self.secret,
                   "mode": "rule", "log-level": "silent", "ipv6": False, "tun": {"enable": False},
                   "unified-delay": bool(config.get("unified_delay", True)),
                   "proxies": [mihomo_node(template, "192.0.2.1", 443)],
                   "proxy-groups": [{"name": "benchmark", "type": "select", "proxies": ["candidate"]}],
                   "rules": ["MATCH,benchmark"]}
        json_write(self.root / "config.json", runtime)
        self.process = subprocess.Popen([executable, "-d", str(self.root), "-f", str(self.root / "config.json")],
                                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        self.direct = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        self.proxy = urllib.request.build_opener(urllib.request.ProxyHandler({"http": "http://127.0.0.1:" + str(self.proxy_port),
                                                                               "https": "http://127.0.0.1:" + str(self.proxy_port)}))
        try:
            for _ in range(100):
                if self.process.poll() is not None:
                    raise RuntimeError("Isolated Mihomo failed to start")
                try:
                    self.control("/version")
                    break
                except (OSError, urllib.error.URLError):
                    time.sleep(.1)
            else:
                raise RuntimeError("Isolated Mihomo controller timed out")
        except BaseException:
            self.close()
            raise

    def control(self, path, body=None, method=None):
        req = urllib.request.Request("http://127.0.0.1:" + str(self.control_port) + path,
                                     headers={"Authorization": "Bearer " + self.secret, "Content-Type": "application/json"},
                                     data=None if body is None else json.dumps(body).encode(), method=method)
        with self.direct.open(req, timeout=15) as response:
            content = response.read()
            return json.loads(content) if content else None

    def candidate(self, ip, port):
        runtime = json_read(self.root / "config.json")
        runtime["proxies"] = [mihomo_node(self.template, ip, port)]
        # Controller inline reload updates only this isolated process.
        self.control("/configs?force=true", {"payload": json.dumps(runtime)}, "PUT")
        self.control("/connections", method="DELETE")

    def latency(self):
        query = urllib.parse.urlencode({"timeout": 6000, "url": self.settings.get("latency_url", "https://www.gstatic.com/generate_204")})
        try:
            delay = self.control("/proxies/candidate/delay?" + query).get("delay")
            return delay if delay and delay > 0 else None
        except (OSError, ValueError, urllib.error.URLError):
            return None

    def download(self, size):
        url = self.settings.get("download_url", "https://speed.cloudflare.com/__down?bytes={bytes}").replace("{bytes}", str(size))
        try:
            return self.download_source(size, url)
        except SourceUnavailable:
            fallback = self.settings.get("fallback_download_url", "https://github.com/microsoft/PowerToys/releases/download/v0.102.3001/PowerToysUserSetup-0.102.3001.0-x64.exe")
            if not fallback:
                raise
            LOG.info("Using official release asset range as alternate download source")
            return self.download_source(size, fallback, ranged=True)

    def download_source(self, size, url, ranged=False):
        # Exact byte count is mandatory: an early EOF is a failure, regardless of initial speed.
        start, received, valid = time.monotonic(), 0, False
        try:
            headers = {"User-Agent": "Mozilla/5.0", "Accept-Encoding": "identity", "Cache-Control": "no-cache"}
            if ranged:
                headers["Range"] = "bytes=0-" + str(size - 1)
            req = urllib.request.Request(url, headers=headers)
            with self.proxy.open(req, timeout=12) as response:
                content_type = response.headers.get("Content-Type", "").lower()
                if response.status != (206 if ranged else 200) or "text/html" in content_type or "application/json" in content_type:
                    raise SourceUnavailable("Download source returned unexpected content")
                if ranged and not response.headers.get("Content-Range", "").startswith("bytes 0-" + str(size - 1) + "/"):
                    raise SourceUnavailable("Download source ignored requested byte range")
                while received <= size:
                    chunk = response.read(min(65536, size + 1 - received))
                    if not chunk:
                        break
                    received += len(chunk)
                    if time.monotonic() - start > self.settings.get("download_timeout", 45):
                        raise TimeoutError("Download deadline")
                valid = received == size
        except urllib.error.HTTPError as error:
            LOG.warning("Download source rejected request HTTP=%d size=%d; excluded from node failure statistics", error.code, size)
            raise SourceUnavailable("Download source rejected benchmark") from None
        except (OSError, ValueError, urllib.error.URLError):
            pass
        return {"ok": valid, "bytes": received, "expectedBytes": size, "seconds": max(.001, time.monotonic() - start)}

    def close(self):
        if self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=8)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait()
        self.directory.cleanup()


def tcp_probe(pair, source_address=None):
    start = time.monotonic()
    try:
        with socket.create_connection(pair, timeout=1.5, source_address=(source_address, 0) if source_address else None):
            return pair, time.monotonic() - start
    except OSError:
        return pair, None


def shortlist(candidates, ranking, current, config):
    ports = config.get("ports", PORTS)
    valid = set()
    for row in candidates:
        try:
            ip = ipaddress.ip_address(row["ip"])
            if ip.version == 4 and ip.is_global:
                valid.add(str(ip))
        except (ValueError, KeyError):
            continue
    # Rotate starting ranges daily rather than repeatedly screening the same prefix.
    ranges = {}
    for ip in valid:
        ranges.setdefault(ip.rsplit(".", 1)[0], []).append(ip)
    buckets = list(ranges.values())
    random.shuffle(buckets)
    for bucket in buckets:
        random.shuffle(bucket)
    fresh = []
    while buckets and len(fresh) < config.get("screen_ips", 32):
        for bucket in buckets:
            if bucket:
                fresh.append(bucket.pop())
        buckets = [bucket for bucket in buckets if bucket]
    random.shuffle(fresh)
    champions = []
    for row in current:
        pair = (row["ip"], row.get("port", 443))
        if pair[0] not in [p[0] for p in champions]:
            champions.append(pair)
    pending = [r for r in ranking if r["ip"] not in [p[0] for p in champions]
               and r["successRate"] >= .8 and r.get("speedP25")]
    # Finish promising candidates' multi-day trials before rotating to another random pool.
    pending.sort(key=lambda r: (0 if r["days"] >= 2 else 1, r["score"], -r["days"]))
    for row in pending:
        if row["ip"] not in [p[0] for p in champions]:
            champions.append((row["ip"], row["port"]))
        if len(champions) >= len(current) + 2:
            break
    pairs = list(dict.fromkeys(champions + [(ip, port) for ip in fresh for port in ports]))
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        checked = list(pool.map(lambda pair: tcp_probe(pair, config.get("source_address")), pairs))
    alive = sorted([(pair, delay) for pair, delay in checked if delay is not None], key=lambda r: r[1])
    # Always recheck historical/current nodes with the real proxy, even if TCP screening failed.
    limit = max(4, min(12, int(config.get("candidates_per_backend", 6))))
    exploration = max(0, min(2, int(config.get("exploration_count", 2))))
    keep = champions[:limit - exploration]
    if len(keep) >= limit:
        return keep
    for pair, _ in alive:
        if pair not in keep and pair[0] not in [p[0] for p in keep]:
            keep.append(pair)
        if len(keep) >= limit:
            break
    return keep


def run(config, force=False, refresh=False, collect_only=False):
    state_path = pathlib.Path(config["state_file"])
    state = json_read(state_path, {})
    now = dt.datetime.now(TIMEZONE)
    today = now.date().isoformat()
    if not refresh and state.get("completed_day") == today:
        return
    hour, minute = map(int, config.get("time", "03:10").split(":"))
    if not force and (now.hour, now.minute) < (hour, minute):
        return
    LOG.info("Starting daily carrier=%s", config["carrier"])
    direct = direct_opener(config)
    asn = None
    for endpoint in ["https://api.ip.sb/geoip", "https://ipinfo.io/json"]:
        try:
            if config.get("network_probe") == "curl":
                command = [config.get("curl", "/usr/bin/curl"), "-q", "--noproxy", "*", "--fail", "--silent", "--max-time", "15", "-A", "Mozilla/5.0"]
                if config.get("source_address"):
                    command.extend(["--interface", config["source_address"]])
                response = subprocess.run(command + [endpoint], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=20, check=True)
                network = json.loads(response.stdout)
            else:
                req = urllib.request.Request(endpoint, headers={"User-Agent": "Mozilla/5.0"})
                with direct.open(req, timeout=15) as response:
                    network = json.load(response)
            asn = str(network.get("asn") or str(network.get("org", "")).split(" ")[0])
            if asn.startswith("AS"):
                asn = asn[2:]
            if asn.isdigit():
                break
        except (OSError, ValueError, urllib.error.URLError, subprocess.SubprocessError):
            continue
    if asn not in [str(n) for n in config["expected_asns"]]:
        LOG.warning("Network mismatch or unavailable: detected ASN=%s; no measurements uploaded", asn)
        raise RuntimeError("Access carrier does not match this task; no measurements uploaded")
    LOG.info("Access carrier verified ASN=%s", asn)
    panel = Panel(config)
    backends = panel.call("/preferred-backends")["backends"]
    LOG.info("Discovered %d backends", len(backends))
    storage = json.loads(protect_secret(pathlib.Path(config["storage_file"]).read_bytes(), decrypt=True))
    nodes = json.loads(panel.call(config.get("entry", "/admin") + "/api/sub?fmt=singbox")["body"])["outbounds"]
    label = {"unicom": "联通", "telecom": "电信"}[config["carrier"]]
    errors = 0
    for backend in backends:
        url, number = backend["url"], backend["index"] + 1
        if not refresh and state.get(url) == today:
            continue
        step = "config"
        try:
            if backend.get("error"):
                raise RuntimeError("Backend unavailable; existing nodes retained")
            cfg = panel.api(url, "config")["data"]
            step = "history"
            store = HistoryStore(storage[cfg["uuid"]], config)
            history = store.read(config["carrier"])
            if not refresh and any(day["day"] == today for day in history["days"]):
                store.submit(config["carrier"], [], number, cfg["uuid"], apply=not collect_only)
                state[url] = today
                json_write(state_path, state)
                continue
            template = next(n for n in nodes if n.get("type") == "vless" and n.get("uuid") == cfg["uuid"] and n.get("transport", {}).get("type") == "ws")
            step = "candidates"
            try:
                candidates = rank_history(history) if refresh else panel.api(url, "candidates", {"count": 100, "useCidr": False})["data"]
            except (OSError, ValueError, urllib.error.URLError) as error:
                LOG.warning("backend=%d candidate source unavailable HTTP=%s; reusing saved history", number, getattr(error, "code", "network"))
                candidates = rank_history(history)
            current = [n for n in cfg.get("preferredIPs", []) if label in n.get("name", "")]
            screening = {**config, "screen_ips": 0, "candidates_per_backend": max(4, min(12, len(current) + 2)), "exploration_count": 0} if refresh else config
            pairs = shortlist(candidates, rank_history(history), current, screening)
            if not pairs:
                raise RuntimeError("No candidates; existing nodes retained")
            LOG.info("backend=%d shortlisted=%d", number, len(pairs))
            results = []
            step = "benchmark"
            engine = Mihomo(config["mihomo"], template, config)
            try:
                for index, (ip, port) in enumerate(pairs):
                    engine.candidate(ip, port)
                    delays = [engine.latency() for _ in range(3)]
                    if all(d is None for d in delays):
                        downloads = [{"ok": False, "bytes": 0, "expectedBytes": 8388608, "seconds": .001}] * 2
                    else:
                        try:
                            downloads = [engine.download(8 * 1048576) for _ in range(2)]
                        except SourceUnavailable:
                            LOG.warning("backend=%d candidate=%d source unavailable; sample skipped", number, index + 1)
                            continue
                    results.append({"ip": ip, "port": port, "latencies": delays, "downloads": downloads})
                    LOG.info("backend=%d carrier=%s candidate=%d/%d latency_ok=%d/3 downloads_ok=%d/2", number, config["carrier"], index + 1, len(pairs), sum(d is not None for d in delays), sum(d["ok"] for d in downloads))
                good = [r for r in results if all(d["ok"] for d in r["downloads"]) and all(d is not None for d in r["latencies"])]
                old = {(r["ip"], r["port"]): r for r in rank_history(history)}
                good.sort(key=lambda r: (0 if old.get((r["ip"], r["port"]), {}).get("days", 0) >= 2 else 1,
                                        performance_score(max(r["latencies"]), min(d["bytes"] / d["seconds"] for d in r["downloads"]))))
                for row in good[:3]:
                    engine.candidate(row["ip"], row["port"])
                    try:
                        row["downloads"].append(engine.download(32 * 1048576))
                    except SourceUnavailable:
                        LOG.warning("backend=%d large-confirmation source unavailable; retained short samples without promotion eligibility", number)
            finally:
                engine.close()
            step = "upload"
            if not results:
                raise SourceUnavailable("No valid source measurements; existing history retained")
            outcome = store.submit(config["carrier"], results, number, cfg["uuid"], refresh=refresh, apply=not collect_only)
            state[url] = today
            json_write(state_path, state)
            LOG.info("backend=%d uploaded=%d history_days=%d eligible=%d changed=%s", number, len(results), outcome["days"], outcome["eligible"], outcome["changed"])
        except Exception as error:
            errors += 1
            # Avoid logging exception messages that could contain endpoint credentials or tokens.
            LOG.error("backend=%d step=%s failed (%s); previous nodes retained", number, step, type(error).__name__)
    if errors:
        raise RuntimeError("Some backends failed; next scheduled wake will retry pending backends")
    state["completed_day"] = today
    json_write(state_path, state)


def apply_saved_history(config):
    """Apply only today's already-validated results; useful after parallel carrier collection."""
    panel = Panel(config)
    storage = json.loads(protect_secret(pathlib.Path(config["storage_file"]).read_bytes(), decrypt=True))
    today = dt.datetime.now(TIMEZONE).date().isoformat()
    for row in panel.call("/preferred-backends")["backends"]:
        cfg = panel.api(row["url"], "config")["data"]
        store = HistoryStore(storage[cfg["uuid"]], config)
        if not any(d["day"] == today for d in store.read(config["carrier"])["days"]):
            LOG.info("backend=%d no fresh history; skipped", row["index"] + 1)
            continue
        outcome = store.submit(config["carrier"], [], row["index"] + 1, cfg["uuid"])
        LOG.info("backend=%d apply-history eligible=%d changed=%s", row["index"] + 1, outcome["eligible"], outcome["changed"])


@contextlib.contextmanager
def process_lock(path):
    handle = open(path, "a+b")
    try:
        if os.name == "nt":
            import msvcrt
            handle.seek(0)
            handle.write(b"0")
            handle.flush()
            handle.seek(0)
            msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        handle.close()
        yield False
        return
    try:
        yield True
    finally:
        handle.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    parser.add_argument("--run-now", action="store_true", help="Ignore time-of-day; still only uploads once per Beijing-time day")
    parser.add_argument("--refresh-today", action="store_true", help="Explicit supplementary recheck; merge samples without counting the date twice")
    parser.add_argument("--collect-only", action="store_true", help="Upload measurements without editing preferred nodes")
    parser.add_argument("--apply-history", action="store_true", help="Apply today's saved eligible measurements without benchmarking again")
    parser.add_argument("--set-password", action="store_true", help="Read panel password from stdin; encrypt with Windows DPAPI or store mode 0600 on Linux")
    parser.add_argument("--set-storage", action="store_true", help="Read UUID-to-account/namespace/token mapping JSON from stdin; protect it like the panel password")
    parser.add_argument("--check", action="store_true", help="Read-only login, backend and optimizer endpoint checks")
    args = parser.parse_args()
    config = json_read(args.config)
    if not config:
        raise ValueError("Configuration is missing")
    if args.set_password:
        path = pathlib.Path(config["password_file"])
        path.write_bytes(protect_secret(sys.stdin.readline().rstrip("\r\n").encode()))
        os.chmod(path, 0o600)
        return
    if args.set_storage:
        storage = json.load(sys.stdin)
        if not isinstance(storage, dict) or not all(isinstance(v, dict) and all(v.get(k) for k in ["account", "namespace", "token"]) for v in storage.values()):
            raise ValueError("Storage credentials must map backend UUIDs to account/namespace/token")
        path = pathlib.Path(config["storage_file"])
        path.write_bytes(protect_secret(json.dumps(storage).encode()))
        os.chmod(path, 0o600)
        return
    handler = RotatingFileHandler(pathlib.Path(config["state_file"]).with_name("optimizer.log"), maxBytes=262144, backupCount=2, encoding="utf-8")
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    LOG.addHandler(handler)
    if sys.stderr is not None:
        LOG.addHandler(logging.StreamHandler())
    LOG.setLevel(logging.INFO)
    with process_lock(str(config["state_file"]) + ".lock") as acquired:
        if not acquired:
            return
        if args.apply_history:
            apply_saved_history(config)
            return
        if args.check:
            panel = Panel(config)
            rows = panel.call("/preferred-backends")["backends"]
            storage = json.loads(protect_secret(pathlib.Path(config["storage_file"]).read_bytes(), decrypt=True))
            for row in rows:
                cfg = panel.api(row["url"], "config")["data"]
                HistoryStore(storage[cfg["uuid"]], config).read(config["carrier"])
            LOG.info("Read-only check passed: %d backends", len(rows))
            return
        run(config, args.run_now or args.refresh_today, args.refresh_today, args.collect_only)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        LOG.error("Optimizer stopped (%s) file=%s", type(error).__name__, pathlib.Path(error.filename).name if isinstance(error, OSError) and error.filename else "n/a")
        sys.exit(1)
