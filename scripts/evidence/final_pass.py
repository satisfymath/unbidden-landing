#!/usr/bin/env python3
"""Campaign 13's final pass, from its own records, for the site: src/content/final-pass.json.

    python3 scripts/evidence/final_pass.py [path to the unbidden-ai checkout running the pass]

Reads docs/bench/campaign13/final and bench/campaign13/corpus.yaml there, and asks GitHub for the state and checks of
each pull request. Run it again whenever the pass moves. It writes no judgement: only what the records and GitHub say.
"""
import datetime as dt
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/Users/david/unbidden-ai-v1b")
FINAL = ROOT / "docs/bench/campaign13/final"
OUT = pathlib.Path(__file__).resolve().parents[2] / "src/content/final-pass.json"


def classes() -> dict[str, str]:
    text = (ROOT / "bench/campaign13/corpus.yaml").read_text()
    out = {}
    for block in re.split(r"\n\s*-\s+(?=name:)", text)[1:]:
        out[re.search(r"name:\s*(\S+)", block).group(1)] = re.search(r"class:\s*(\S+)", block).group(1)
    return out


def walk(o, found: dict) -> None:
    if isinstance(o, dict):
        if str(o.get("id", "")).startswith("prop_"):
            found[o["id"]] = o
        for v in o.values():
            walk(v, found)
    elif isinstance(o, list):
        for v in o:
            walk(v, found)


def levels(o, out: list) -> list:
    if isinstance(o, dict):
        for k, v in o.items():
            if k == "level_max" and isinstance(v, int):
                out.append(v)
            levels(v, out)
    elif isinstance(o, list):
        for v in o:
            levels(v, out)
    return out


def github(url: str) -> dict:
    owner_repo, number = re.match(r"https://github.com/(.+)/pull/(\d+)", url).groups()
    raw = subprocess.run(
        ["gh", "pr", "view", number, "-R", owner_repo, "--json", "state,statusCheckRollup"],
        check=True, capture_output=True, text=True,
    ).stdout
    d = json.loads(raw)
    checks = [c.get("conclusion") or c.get("state") for c in d["statusCheckRollup"]]
    return {"state": d["state"], "green": sum(c == "SUCCESS" for c in checks), "red": sum(c == "FAILURE" for c in checks), "checks": len(checks)}


cls = classes()
summary = json.loads((FINAL / "summary-B.json").read_text())
header = json.loads((FINAL / "run-header.json").read_text())
prs, l5, tests = [], [], 0
for row in summary:
    facts = json.loads((FINAL / row["name"] / "B1.json").read_text())["facts"]
    found: dict = {}
    walk(facts, found)
    if max(levels(facts, []) or [0]) >= 5:
        l5.append(row["name"])
    for p in found.values():
        if not p.get("pr"):
            continue
        prs.append({"repo": row["name"], "cls": cls[row["name"]], "title": p["title"], "url": p["pr"], "status": p["status"], **github(p["pr"])})

data = {
    "as_of": dt.datetime.fromtimestamp((FINAL / "summary-B.json").stat().st_mtime).strftime("%Y-%m-%d %H:%M"),
    "candidate": header["candidate"][:7],
    "corpus": len(cls),
    "done": len(summary),
    "by_class": {c: sum(cls[r["name"]] == c for r in summary) for c in ("dev", "independent", "frontier")},
    "spent_usd": round(sum(r.get("spent_usd") or 0 for r in summary), 2),
    "l5_verified_deploy": l5,
    "prs": prs,
}
OUT.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
merged = [p for p in prs if p["state"] == "MERGED"]
print(f"{data['done']}/{data['corpus']} repositories, {len(prs)} pull requests, {len(merged)} merged, {data['spent_usd']} USD, L5 {l5} -> {OUT}")
