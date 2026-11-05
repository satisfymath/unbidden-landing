#!/usr/bin/env python3
"""Campaign 13's final pass, from its own records, for the site: src/content/final-pass.json.

    python3 scripts/evidence/final_pass.py [unbidden-ai checkout] [commit]

Everything is read from that commit with `git show`, so the working tree of the checkout does not matter:
docs/bench/campaign13/final-evidence.json, final/MATRIX.md, final/REPORT-aggregate.md and the export of the aegra
run of final-rerun-0.18.9. It adds no judgement: it joins, counts per repository, and fails if a total disagrees.
"""
from __future__ import annotations

import collections
import json
import pathlib
import re
import subprocess
import sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else "/Users/david/unbidden-ai-v1b"
COMMIT = sys.argv[2] if len(sys.argv) > 2 else "b7c61b2c0a50938670b69039a6cf991e236356e5"
OUT = pathlib.Path(__file__).resolve().parents[2] / "src/content/final-pass.json"
C13 = "docs/bench/campaign13"
LADDER = ["-", "L1", "L2", "L3", "L4", "L5"]


def show(path: str) -> str:
    return subprocess.run(["git", "-C", ROOT, "show", f"{COMMIT}:{path}"], check=True, capture_output=True, text=True).stdout


def jsonl(path: str) -> list[dict]:
    return [json.loads(line) for line in show(path).splitlines() if line.strip()]


def level(text: str | None) -> str:
    return text[:2] if text and text.startswith("L") else "-"


def sections(matrix: str) -> dict[str, dict]:
    """Per `## repo (version)`: the director's decisions, the opportunities, model calls, self-host."""
    out: dict[str, dict] = {}
    parts = re.split(r"^## (\S+) \((\d[\d.]*)\)\n", matrix, flags=re.M)
    for name, version, body in zip(parts[1::3], parts[2::3], parts[3::3]):
        decisions = re.search(r"Director's decisions: (.*)", body)
        calls = re.search(r"model calls (\d+)", body)
        host = re.search(r"self-host: (.*)", body)
        opportunities = []
        lines = body.splitlines()
        if "| Opportunity | Category | Status | Level | Last decision | Why / the lab's last note |" in lines:
            start = lines.index("| Opportunity | Category | Status | Level | Last decision | Why / the lab's last note |") + 2
            for line in lines[start:]:
                if not line.startswith("| "):
                    break
                cells = [c.strip() for c in re.split(r"(?<!\\)\|", line.strip()[1:-1])]
                title, category, status, lvl, decision, why = cells[0], cells[1], cells[2], cells[3], cells[4], " | ".join(cells[5:])
                opportunities.append({"title": title, "category": category, "status": status, "level": lvl, "decision": decision, "why": why})
        out[f"{name}@{version}"] = {
            "decisions": {a: int(b) for a, b in re.findall(r"(\w+) (\d+)", decisions.group(1))} if decisions else {},
            "calls": int(calls.group(1)) if calls else 0,
            "host": host.group(1).strip() if host else None,
            "opportunities": opportunities,
        }
    return out


def compare(report: str) -> list[dict]:
    """Campaign 13 against campaign 12: the rows measured the same way on both sides, parsed from the report."""
    keep = {
        "checks executed, tests collected (Level A)": "Ran the team’s tests",
        "Level B runs with >=1 opportunity": "Found an opportunity",
        "Level B runs with >=1 experiment": "Ran an experiment",
        "Level B runs with a pull request": "Opened a pull request",
        "pull requests green on the exact head": "Pull requests green on CI",
        "pull requests merged by the product": "Pull requests merged",
    }
    cell = re.compile(r"(\d+)/(\d+) \((\d+)%, 95% CI (\d+)-(\d+)%\)")
    rows = []
    for line in report.splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) != 5 or cells[0] not in keep or cells[1] not in ("dev", "independent"):
            continue
        a, b = cell.match(cells[2]), cell.match(cells[3])
        if not a or not b:
            continue
        side = lambda m: {"on": int(m[1]), "of": int(m[2]), "pct": int(m[3]), "lo": int(m[4]), "hi": int(m[5])}
        rows.append({"id": cells[0], "label": keep[cells[0]], "cls": cells[1], "c12": side(a), "c13": side(b), "source": cells[4]})
    return rows


def story() -> dict:
    """One improvement from first sight to L5: aegra, certifi, pull request #7, on 0.18.9. Times and words from its events."""
    base = f"{C13}/final-rerun-0.18.9/aegra"
    events = jsonl(f"{base}/export/events.jsonl")
    opp = next(e["entity_id"] for e in events if e["type"] == "opportunity.opened" and "certifi" in e["payload"]["title"])
    steps = []

    def add(event: dict, text: str, kind: str = "") -> None:
        steps.append({"ts": event["ts"], "at": event["ts"][11:19], "actor": event["actor"], "type": event["type"], "text": text, "kind": kind})

    for e in events:
        p, mine = e["payload"], e["correlation_id"] == opp or e["entity_id"] == opp
        if e["type"] == "operations.deployed" and "drill" in p and p["drill"].get("passed"):
            add(e, "Brought the app up from its own compose file; the rollback drill passed, there and back")
        elif e["type"] == "opportunity.opened" and mine:
            add(e, p["title"])
        elif e["type"] == "decision.made" and mine and p["chosen"] in ("run_experiment", "propose_change"):
            add(e, f"{p['chosen']}: {p['reason']}")
        elif e["type"] == "verdict.recorded" and mine and p.get("improved"):
            add(e, f"L{p['level']}, the team’s tests {p['tests']}: {p['reasons'][0]}")
        elif e["type"] == "proposal.published" and e["payload"].get("number") == 7:
            add(e, f"Pull request #{p['number']} opened on the copy", "wait")
        elif e["type"] == "agent.note" and p["text"].startswith("CI green on pull request #7"):
            add(e, "The team’s CI is green on the exact head of #7")
        elif e["type"] == "operations.merged" and p["number"] == 7:
            add(e, f"Merged #7 as {p['sha'][:7]}; the head it measured was {p['measured'][:7]}", "merge")
        elif e["type"] == "proposal.stale" and not any(s["type"] == "proposal.stale" for s in steps):
            add(e, f"The 2 other open proposals go stale: {p['reason']}")
        elif e["type"] == "operations.deployed" and p.get("self_host") == "deploy" and steps and steps[-1]["type"] in ("proposal.stale", "operations.merged"):
            add(e, f"Deployed; health answered {'ok' if p['ok'] else 'failing'}")
        elif e["type"] == "opportunity.resolved" and mine:
            add(e, p["reason"][0].upper() + p["reason"][1:])
        elif e["type"] == "impact.judged":
            add(e, f"{len(p['endpoints'])} endpoints judged after the deploy: {p.get('impact', 'healthy')}")
        elif e["type"] == "outcome.recorded" and mine:
            add(e, "L5 recorded, by verified deploy. No effect claimed", "l5")

    verdict = jsonl(f"{base}/export/deploy_verdicts.jsonl")[-1]
    outcome = next(e["payload"] for e in events if e["type"] == "outcome.recorded" and e["correlation_id"] == opp)
    verify = json.loads(show(f"{C13}/final-rerun-0.18.9/verify/verify-aegra-pr7.json"))
    return {
        "repo": "aegra",
        "version": "0.18.9",
        "pr": "https://github.com/satisfymath/c13-aegra/pull/7",
        "steps": steps,
        "endpoints": [{"target": e["target"], "before": round(e["p50_before"], 1), "after": round(e["p50_after"], 1), "impact": e["impact"]} for e in verdict["endpoints"]],
        "rounds": {"before": verdict["endpoints"][0]["rounds_before"], "after": verdict["endpoints"][0]["rounds_after"]},
        "confounders": [c["detail"] for c in outcome.get("confounders", [])],
        "verify": {"changed": verify["changed_files"], "at_base": verify["finding_checks"][0]["at_base"], "at_head": verify["finding_checks"][0]["at_head"], "verdict": verify["verdict"]},
    }


evidence = json.loads(show(f"{C13}/final-evidence.json"))
detail = sections(show(f"{C13}/final/MATRIX.md"))
pulls = evidence["pull_requests"]

repos: dict[str, dict] = {}
for r in evidence["repositories"]:
    e = repos.setdefault(r["name"], {"name": r["name"], "cls": r["class"], "family": r["family"], "stopped": r["status"] != "done", "runs": []})
    if r["status"] != "done":
        continue
    d = detail.get(f"{r['name']}@{r['version']}", {})
    mine = [p for p in pulls if p["repo"] == r["name"] and p["version"] == r["version"]]
    e["runs"].append({
        "version": r["version"], "mode": r["mode"], "checks": r["checks"], "tests": r["collected"],
        "opportunities": sum(r["opportunities"].values()), "experiments": r["experiments"] or 0, "deploys": r["deploys"] or 0,
        "level": level(r["level"]), "spent": r["spent_usd"], "first_pr_min": r["first_pr_min"], "calls": d.get("calls", 0), "host": d.get("host"),
        "decisions": d.get("decisions", {}), "items": d.get("opportunities", []),
        "prs": [{"n": p["number"], "title": p["title"], "url": p["url"], "kind": p["kind"], "ci": p["ci"], "merged": p["merged"], "verified": p["verified_independently"]} for p in mine],
    })


def best(rs: list[dict], key: str) -> int:
    return max((r[key] for r in rs), default=0)


rows = []
for e in repos.values():
    rs = e["runs"]
    prs = [p for r in rs for p in r["prs"]]
    rows.append({
        **e,
        "tests": max((r["tests"] or 0 for r in rs), default=None) if rs else None,
        "checks": rs[0]["checks"] if rs else None,
        "opportunities": best(rs, "opportunities"), "experiments": best(rs, "experiments"),
        "pulls": len(prs), "green": sum(p["ci"] == "green" for p in prs), "merged": sum(p["merged"] for p in prs),
        "level": max((r["level"] for r in rs), key=LADDER.index, default=None),
        "spent": round(sum(r["spent"] for r in rs), 4),
    })

STAGES = [
    ("corpus", "In the corpus", lambda r: True),
    ("record", "Have a record", lambda r: not r["stopped"]),
    ("opportunity", "Found an opportunity", lambda r: r["opportunities"] > 0),
    ("experiment", "Ran an experiment", lambda r: r["experiments"] > 0),
    ("pull", "Opened a pull request", lambda r: r["pulls"] > 0),
    ("green", "Green on the team’s CI", lambda r: r["green"] > 0),
    ("merged", "Merged by the product", lambda r: r["merged"] > 0),
    ("l5", "L5, a verified deploy", lambda r: r["level"] == "L5"),
]
funnel = []
for sid, label, test in STAGES:
    names = [r for r in rows if test(r)]
    funnel.append({"id": sid, "label": label, "n": len(names), "by": dict(collections.Counter(r["cls"] for r in names)), "names": [r["name"] for r in names]})

fate = collections.Counter("merged" if p["merged"] else {"green": "green", "red": "red", "none": "none"}[p["ci"]] for p in pulls)
decisions = collections.Counter()
statuses = collections.Counter()
for d in detail.values():
    decisions.update(d["decisions"])
    statuses.update(o["status"] for o in d["opportunities"])

REASONS = [
    ("improved, but the team's suite did not validate it", "Improved, but the team’s suite did not validate it"),
    ("the team's CI checks ruff only in", "The team’s CI does not check those paths"),
    ("experiments found no proven fix", "Its experiments found no proven fix"),
    ("the team's CI does not run", "The team’s CI does not run that tool"),
]
declined = collections.Counter()
for d in detail.values():
    for o in d["opportunities"]:
        if o["status"] == "declined":
            declined[next((label for needle, label in REASONS if needle in o["why"]), "Other reasons")] += 1

# refuse to write a page that disagrees with the record it cites
t = evidence["totals"]
assert len(rows) == 39 and sum(not r["stopped"] for r in rows) == t["repositories_run"]
assert sum(r["merged"] > 0 for r in rows) == t["repositories_with_a_merge"] == t["merged_by_unbidden"]
assert sum(fate.values()) == t["pull_requests"] and fate["merged"] == t["merges"]
assert sum(p["ci"] == "green" for p in pulls) == t["pull_requests_ci_green"]
assert [r["name"] for r in rows if r["level"] == "L5"] == [x["repo"] for x in t["l5"]]
assert round(sum(r["spent"] for r in rows), 2) == round(evidence["spent_usd"], 2)
assert sum(len(r["items"]) for e in repos.values() for r in e["runs"]) == sum(statuses.values())

data = {
    "source": {"commit": COMMIT, "generated_at": evidence["generated_at"], "rule": evidence["rule"], "where": evidence["where"]},
    "totals": {k: t[k] for k in ("repositories_run", "runs", "pull_requests", "pull_requests_ci_green", "merges", "merged_by_unbidden", "merged_verified_independently", "merged_by_kind")},
    "spent_usd": round(evidence["spent_usd"], 2),
    "versions": [{"version": r["version"], "records": r["records"], "spent_usd": r["spent_usd"]} for r in evidence["runs"]],
    "funnel": funnel,
    "fate": dict(fate),
    "kinds": dict(collections.Counter(p["kind"] for p in pulls)),
    "decisions": decisions.most_common(),
    "statuses": statuses.most_common(),
    "declined": sorted(declined.most_common(), key=lambda kv: (kv[0] == "Other reasons", -kv[1])),
    "opportunities": sum(statuses.values()),
    "stopped": [r["name"] for r in rows if r["stopped"]],
    "pull_requests": [{"repo": p["repo"], "version": p["version"], "n": p["number"], "title": p["title"], "url": p["url"], "kind": p["kind"], "ci": p["ci"], "merged": p["merged"], "verified": p["verified_independently"]} for p in pulls],
    "repositories": rows,
    "compare": compare(show(f"{C13}/final/REPORT-aggregate.md")),
    "story": story(),
}
OUT.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
print(json.dumps({"funnel": [(f["id"], f["n"], f["by"]) for f in funnel], "fate": fate, "kinds": data["kinds"], "decisions": data["decisions"], "statuses": data["statuses"], "stopped": data["stopped"], "levels": collections.Counter(r["level"] for r in rows), "compare": len(data["compare"]), "steps": len(data["story"]["steps"]), "bytes": OUT.stat().st_size}, indent=0, default=str))
