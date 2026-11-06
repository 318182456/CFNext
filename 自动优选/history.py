"""Bounded daily benchmark history and conservative carrier-specific promotion."""
import datetime as dt
import ipaddress
import math
import copy

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


def update_history(previous, results, now=None, refresh=False):
    now = (now or dt.datetime.now(TIMEZONE)).astimezone(TIMEZONE)
    today = now.date().isoformat()
    cutoff = (now - dt.timedelta(days=29)).date().isoformat()
    days = copy.deepcopy([d for d in previous.get("days", []) if cutoff <= d["day"] <= today])
    duplicate = any(d["day"] == today for d in days)
    if not duplicate:
        days.append({"day": today, "results": normalize_results(results)})
    elif refresh:
        # ASVS 2.2.1/2.2.3: validate supplementary samples; one tuple/date still counts as one day.
        day = next(d for d in days if d["day"] == today)
        merged = {(r["ip"], r["port"]): r for r in day["results"]}
        for row in normalize_results(results):
            key = (row["ip"], row["port"])
            if key in merged:
                old = merged[key]
                latest = {"latencies": row["latencies"], "downloads": row["downloads"]}
                merged[key] = {**row, "latencies": (old["latencies"] + row["latencies"])[-30:],
                               "downloads": (old["downloads"] + row["downloads"])[-12:], "latest": latest}
            else:
                merged[key] = row
        if len(merged) > 100:
            raise ValueError("A daily batch must contain at most 100 distinct candidates")
        day["results"] = list(merged.values())
    return {"version": 1, "days": days[-30:]}, duplicate


def quantile(values, p):
    values = sorted(values)
    return values[math.ceil((len(values) - 1) * p)] if values else None


def performance_score(latency, speed):
    """Estimated round trip plus a 256 KiB transfer, in ms; lower is better."""
    if latency is None or not speed or speed <= 0:
        return float("inf")
    return latency + 262144000 / speed


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
                last = result.get("latest", result)
                latest_downloads, latest_latencies = last["downloads"], last["latencies"]
                r["latestHealthy"] = len(latest_downloads) >= 2 and all(d["ok"] for d in latest_downloads) and all(d is not None for d in latest_latencies)
                r["latestOk"] = r["latestHealthy"] and any(d["ok"] and d.get("size", 0) >= 32 * 1048576 for d in latest_downloads)
                r["latestLatency"] = quantile([d for d in latest_latencies if d is not None], .9)
                r["latestSpeed"] = quantile([d["speed"] for d in latest_downloads if d["ok"]], .25)
    ranked = []
    for r in rows.values():
        rate = r["successes"] / r["attempts"]
        ranked.append({"ip": r["ip"], "port": r["port"], "days": r["days"], "lastDay": r["lastDay"],
                       "successRate": rate, "latencyP90": quantile(r["delays"], .9), "speedP25": quantile(r["speeds"], .25),
                       "latestLatencyP90": r["latestLatency"], "latestSpeedP25": r["latestSpeed"],
                       "healthyToday": r["lastDay"] == today and r["latestHealthy"],
                       "score": performance_score(r["latestLatency"], min(r["latestSpeed"] or 0, quantile(r["speeds"], .25) or 0)),
                       "eligible": r["days"] >= 3 and r["lastDay"] == today and r["latestOk"] and rate >= .8})
    ranked.sort(key=lambda r: (-int(r["eligible"]), 0 if r["successRate"] >= .95 else 1 if r["successRate"] >= .8 else 2,
                               r["score"], -r["successRate"]))
    return ranked


def select_preferred(config, carrier, ranking, backend_number):
    original, label = config.get("preferredIPs", []), LABELS[carrier]
    count = sum(label in p.get("name", "") for p in original) or 2
    by_pair = {(r["ip"], r["port"]): r for r in ranking}
    chosen = [copy.deepcopy(p) for p in original if label in p.get("name", "")]
    for row in (r for r in ranking if r["eligible"]):
        pair = (row["ip"], row["port"])
        if any((p["ip"], p.get("port", 443)) == pair for p in chosen):
            continue
        same_ip = next((i for i, p in enumerate(chosen) if p["ip"] == row["ip"]), None)
        def incumbent(index):
            p = chosen[index]
            r = by_pair.get((p["ip"], p.get("port", 443)), {})
            return (not r.get("healthyToday", False), r.get("score", float("inf")))
        index = same_ip if same_ip is not None else (max(range(len(chosen)), key=incumbent) if len(chosen) >= count else len(chosen))
        if index < len(chosen):
            bad, score = incumbent(index)
            # Avoid daily churn: a healthy incumbent needs at least 15% estimated improvement.
            if not bad and row["score"] > score * .85:
                continue
            previous = by_pair.get((chosen[index]["ip"], chosen[index].get("port", 443)), {})
            # A transient failed download must not replace a mostly reliable route with a far slower one.
            if bad and previous.get("successRate", 1) >= .8 and math.isfinite(score) and row["score"] > score * 1.5:
                continue
            chosen[index].update(ip=row["ip"], port=row["port"])
        else:
            chosen.append({"ip": row["ip"], "port": row["port"],
                           "name": "后端{}·{}优选-{:02d}".format(backend_number, label, index + 1)})
    if chosen == [p for p in original if label in p.get("name", "")]:
        return original
    # Preserve positions and names of all other carrier/user-defined nodes.
    updated = iter(chosen)
    combined = [next(updated) if label in p.get("name", "") else p for p in original]
    combined.extend(updated)
    return combined
