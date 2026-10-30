"""Bounded daily benchmark history and conservative carrier-specific promotion."""
import datetime as dt
import ipaddress
import math

LABELS = {"unicom": "联通", "telecom": "电信"}
TIMEZONE = dt.timezone(dt.timedelta(hours=8))


def normalize_results(results):
    if not isinstance(results, list) or len(results) > 100:
        raise ValueError("A daily batch must contain at most 100 candidates")
    normalized, seen = [], set()
    for row in results:
        ip, port = str(ipaddress.IPv4Address(row["ip"])), int(row["port"])
        if not 1 <= port <= 65535 or (ip, port) in seen:
            raise ValueError("Invalid or duplicate candidate")
        seen.add((ip, port))
        latencies = [n if isinstance(n, (int, float)) and math.isfinite(n) and 0 < n <= 60000 else None for n in row["latencies"][:5]]
        downloads = []
        for d in row["downloads"][:3]:
            expected, received, seconds = d.get("expectedBytes", 0), d.get("bytes", 0), d.get("seconds", 0)
            ok = d.get("ok") is True and 8 * 1048576 <= expected <= 128 * 1048576 and received == expected and 0 < seconds <= 600
            downloads.append({"ok": ok, "speed": received / seconds if ok else 0, "size": expected})
        if len(latencies) < 2 or len(downloads) < 2:
            raise ValueError("Two latency and full-download rounds are required")
        normalized.append({"ip": ip, "port": port, "latencies": latencies, "downloads": downloads})
    return normalized


def update_history(previous, results, now=None):
    now = (now or dt.datetime.now(TIMEZONE)).astimezone(TIMEZONE)
    today = now.date().isoformat()
    cutoff = (now - dt.timedelta(days=29)).date().isoformat()
    days = [d for d in previous.get("days", []) if cutoff <= d["day"] <= today]
    duplicate = any(d["day"] == today for d in days)
    if not duplicate:
        days.append({"day": today, "results": normalize_results(results)})
    return {"version": 1, "days": days[-30:]}, duplicate


def quantile(values, p):
    values = sorted(values)
    return values[math.ceil((len(values) - 1) * p)] if values else None


def rank_history(history, now=None):
    today = (now or dt.datetime.now(TIMEZONE)).astimezone(TIMEZONE).date().isoformat()
    rows = {}
    for day in history.get("days", []):
        for result in day["results"]:
            key = (result["ip"], result["port"])
            r = rows.setdefault(key, {"ip": key[0], "port": key[1], "days": 0, "attempts": 0, "successes": 0,
                                      "delays": [], "speeds": [], "lastDay": "", "latestOk": False})
            r["days"] += 1
            downloads, latencies = result["downloads"], result["latencies"]
            r["attempts"] += len(downloads) + len(latencies)
            r["successes"] += sum(d["ok"] for d in downloads) + sum(d is not None for d in latencies)
            r["delays"].extend(d for d in latencies if d is not None)
            r["speeds"].extend(d["speed"] for d in downloads if d["ok"])
            if day["day"] >= r["lastDay"]:
                r["lastDay"] = day["day"]
                r["latestOk"] = len(downloads) >= 2 and all(d["ok"] for d in downloads) and all(d is not None for d in latencies) and any(d["ok"] and d.get("size", 0) >= 32 * 1048576 for d in downloads)
    ranked = []
    for r in rows.values():
        rate = r["successes"] / r["attempts"]
        ranked.append({"ip": r["ip"], "port": r["port"], "days": r["days"], "lastDay": r["lastDay"],
                       "successRate": rate, "latencyP90": quantile(r["delays"], .9), "speedP25": quantile(r["speeds"], .25),
                       "eligible": r["days"] >= 3 and r["lastDay"] == today and r["latestOk"] and rate >= .8})
    ranked.sort(key=lambda r: (-int(r["eligible"]), -r["successRate"], -(r["speedP25"] or 0), r["latencyP90"] or float("inf")))
    return ranked


def select_preferred(config, carrier, ranking, backend_number):
    original, label = config.get("preferredIPs", []), LABELS[carrier]
    count = sum(label in p.get("name", "") for p in original) or 2
    winners, used_ips = [], set()
    for row in ranking:
        if row["eligible"] and row["ip"] not in used_ips:
            winners.append(row)
            used_ips.add(row["ip"])
        if len(winners) >= count:
            break
    if len(winners) < count:
        return original
    chosen = [{"ip": r["ip"], "port": r["port"], "name": "后端{}·{}优选-{:02d}".format(backend_number, label, i + 1)}
              for i, r in enumerate(winners)]
    return [p for p in original if label not in p.get("name", "")] + chosen
