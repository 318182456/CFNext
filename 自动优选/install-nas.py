"""Run through sudo on Synology; read credentials from stdin, never command-line arguments."""
import argparse
import base64
import json
import os
import pathlib
import pwd
import shutil
import subprocess
import sys


def webapi(method, version=4, **params):
    command = ["/usr/syno/bin/synowebapi", "--exec", "api=SYNO.Core.TaskScheduler", "version=" + str(version), "method=" + method]
    command.extend(key + "=" + json.dumps(value, ensure_ascii=False) for key, value in params.items())
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    data = json.loads(result.stdout)
    if not data.get("success"):
        raise RuntimeError("DSM scheduler API rejected operation: " + str(data.get("error", {})))
    return data.get("data", {})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--owner", default="test123")
    parser.add_argument("--directory", default="/volume1/docker/cfnext-optimizer")
    parser.add_argument("--mihomo-source", default="/volume1/docker/cinefold/mihomo/mihomo")
    args = parser.parse_args()
    if os.geteuid() != 0:
        raise RuntimeError("Run installer through sudo; scheduled benchmarks run as the ordinary user")
    account = pwd.getpwnam(args.owner)
    payload = json.load(sys.stdin)
    root = pathlib.Path(args.directory)
    root.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chown(str(root), account.pw_uid, account.pw_gid)
    os.chmod(str(root), 0o700)
    files = payload.get("files", {})
    for name in ["runner.py", "history.py"]:
        content = base64.b64decode(files[name]) if name in files else pathlib.Path(__file__).with_name(name).read_bytes()
        (root / name).write_bytes(content)
    shutil.copyfile(args.mihomo_source, str(root / "mihomo"))
    config = payload["config"]
    config.update(carrier="telecom", time="04:10", mihomo=str(root / "mihomo"), password_file=str(root / "panel.secret"),
                  storage_file=str(root / "storage.secret"), state_file=str(root / "state.json"))
    (root / "config.json").write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")
    (root / "panel.secret").write_text(payload["password"], encoding="utf-8")
    (root / "storage.secret").write_text(json.dumps(payload["storage"]), encoding="utf-8")
    for name in ["runner.py", "history.py", "config.json", "panel.secret", "storage.secret", "mihomo"]:
        os.chown(str(root / name), account.pw_uid, account.pw_gid)
        os.chmod(str(root / name), 0o700 if name == "mihomo" else 0o600)
    # Only the dedicated script is registered; existing tasks and running Mihomo instances are untouched.
    existing = webapi("list", version=3).get("tasks", [])
    task = next((t for t in existing if t["name"] == "CFNext-Telecom-Daily"), None)
    schedule = webapi("get", id=-1, real_owner=args.owner, type="script")["schedule"]
    schedule.update(hour=4, minute=10, repeat_hour=1, last_work_hour=23, repeat_min=0, date_type=0,
                    repeat_date=1001, week_day="0,1,2,3,4,5,6")
    params = {"name": "CFNext-Telecom-Daily", "owner": args.owner, "real_owner": args.owner,
              "enable": True, "type": "script", "schedule": schedule,
              "extra": {"script": "/usr/bin/python3 '" + str(root / "runner.py") + "' --config '" + str(root / "config.json") + "'"}}
    if task:
        params["id"] = task["id"]
    result = webapi("set" if task else "create", **params)
    tasks = webapi("list", version=3).get("tasks", [])
    saved = next(t for t in tasks if t["name"] == "CFNext-Telecom-Daily")
    print(json.dumps({"installed": True, "id": saved["id"], "enabled": saved["enable"], "next": saved.get("next_trigger_time"), "owner": args.owner}))


if __name__ == "__main__":
    main()
