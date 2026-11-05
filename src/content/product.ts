import finalPass from './final-pass.json'

/**
 * Copy for the editorial sections. Every claim traces to satisfymath/unbidden-ai: file:line notes are of main 5ecd617
 * (0.12.2) unless they name main b8082e9 (0.17.1, 2026-11-04), tag v0.18.1 (700a5da) or the branch feat/64-campaign (campaign 12's report).
 * Nothing here is invented; levels are the repository's own.
 */
const GH = 'https://github.com/satisfymath/unbidden-ai'
export const LINKS = {
  repo: GH,
  readme: `${GH}#readme`,
  architecture: `${GH}/blob/main/docs/ARCHITECTURE.md`,
  evidence: `${GH}/blob/main/docs/EVIDENCE.md`,
  decisions: `${GH}/blob/main/docs/DECISIONS.md`,
  install: `${GH}/blob/main/docs/INSTALL.md`,
  release: `${GH}/releases/tag/v0.18.10`,
  road: `${GH}/blob/main/docs/ROAD-TO-1.0.md`,
  corpus: `${GH}/blob/main/bench/campaign13/corpus.yaml`,
  findings: `${GH}/blob/main/docs/bench/campaign13/FINDINGS.md`,
  changelog: `${GH}/blob/main/docs/RELEASE.md`,
  license: `${GH}/blob/main/LICENSE`,
  fastapiPr: 'https://github.com/satisfymath/full-stack-fastapi-template/pull/1',
  richPr: 'https://github.com/satisfymath/rich/pull/1',
}

export const INTELLIGENCE = {
  eyebrow: 'The intelligence',
  title: 'It doesn’t wait for a task. It finds what matters.',
  // README.md L5–8 (verbatim)
  lede:
    'Unbidden is a proactive engineering agent you install like a CLI. It lives in a repository, runs the team’s own checks in an offline sandbox, finds improvements it can prove, measures them, and proposes them as pull requests that carry their evidence.',
}

/** The cycle. Labels are the brief's; `ref` names the job as docs/ARCHITECTURE.md L11–19 names it. */
export const CYCLE: { label: string; body: string; ref: string; dim?: boolean }[] = [
  { label: 'Observe', body: 'It reads the repository and the systems it is allowed to see. The project’s code is never executed on your machine directly.', ref: 'observe' },
  { label: 'Investigate', body: 'It forms a hypothesis and checks it read-only, with the local model. A suspicion is reported as a suspicion.', ref: 'research · L1' },
  { label: 'Experiment', body: 'It builds what it lacks and runs the change in a sandbox: no network, read-only root, every capability dropped.', ref: 'lab · L2–L3' },
  { label: 'Prove', body: 'It measures against a baseline with the team’s own checks, three rounds per side, and states the level it reached and not one higher.', ref: 'evidence · L4' },
  { label: 'Propose', body: 'It opens a pull request that carries its evidence, pinned to the commit that was measured. People merge.', ref: 'publish' },
  { label: 'Operate', body: 'Only under an explicit mandate and a passed drill: merge, deploy with the team’s steps, watch production, roll back.', ref: 'operate · L5–L6', dim: true },
]

export const CONTROL = {
  eyebrow: 'Human control',
  title: 'Autonomy is granted, never assumed.',
  // README.md L93–104, docs/RELEASE.md L114–120, L284–286
  lede:
    'Every capability is a permission in a mandate you write: observe, run experiments, provision dependencies, open pull requests, merge, deploy, rollback. Each one is allow, require approval or deny. By default, merge, deploy and rollback are denied.',
  modes: [
    { name: 'supervised', body: 'asks before a pull request; never merges or deploys.' },
    { name: 'autopilot', body: 'opens proven pull requests on its own; people merge.' },
    { name: 'autonomous', body: 'also merges L4 work, deploys with the team’s steps, rolls back; refuses without deploy steps and a passed drill.' },
  ],
  note: 'In every mode a merge waits until the previous deploy has been judged, a rollback leaves a hold only a person can release, and the kill switch freezes everything in every process until a person resumes it.',
  // README.md L59–64 comments (verbatim) and cli.py help strings
  cli: [
    { cmd: 'unbidden', help: '# the setup assistant the first time, then the live feed' },
    { cmd: 'unbidden doctor', help: '# what works here, what is required for your option' },
    { cmd: 'unbidden start --ui', help: '# the agent in the background, serving the dashboard' },
    { cmd: 'unbidden status', help: '# agent pid and log, dashboard URL, kill switch' },
    { cmd: 'unbidden mode', help: '# show or set autonomy' },
    { cmd: 'unbidden drill', help: '# prove rollback works before autonomy relies on it' },
    { cmd: 'unbidden hold release', help: '# people only' },
    { cmd: 'unbidden kill', help: '# freezes everything until `unbidden resume`' },
  ],
}

export const MODELS = {
  eyebrow: 'Meta models, each where it belongs',
  // README.md L10–12, docs/ARCHITECTURE.md L82
  items: [
    { name: 'Muse Glimmer', where: 'local · Ollama', body: 'Runs on the machine and is the only model that ever sees secrets, logs or production data.' },
    { name: 'Muse Spark', where: 'Meta Model API', body: 'Takes the heavy work when the content is allowed to leave. Private code reaches Spark only after the privacy bridge has renamed it.' },
  ],
  labels: 'instructions < synthetic < public_code < private_code < production_data < secret',
  rule: 'Three options: local (nothing leaves), mixed, api. In every option secrets and production data stay on the machine, and the egress gate re-checks the label and scans every payload before it leaves. A model is never the control. Code decides what leaves.',
}

/** main b8082e9: docs/ROAD-TO-1.0.md §4 and docs/RELEASE.md 0.13.0 — what a stop can be. */
export const STOPS = {
  eyebrow: 'When it cannot go on',
  items: [
    { name: 'Retry', body: 'A service did not answer: it retries with backoff, then declares it.' },
    { name: 'Ask', body: 'A person can grant something: one question with options, the job parked until the answer.' },
    { name: 'Declare', body: 'It cannot work here: it says so, with the cause, and does not retry at the same commit.' },
  ],
  note: 'A spend limit, a kill switch, a policy refusal or a busy host is a block, never a verdict on the opportunity.',
}

/** README.md at main b8082e9, "Where your code goes". */
export const OPTIONS = [
  { name: 'local', body: 'Only a model on this machine, through Ollama. Nothing leaves.' },
  { name: 'mixed', body: 'Light work stays local. Heavy work whose content may leave goes to Meta’s API first.' },
  { name: 'api', body: 'Meta’s API only. A call that may not leave the machine is refused, and says why.' },
]
/** The sensitivity labels, lowest first. `stays`: in every option these never leave the machine. */
export const LABELS: { name: string; stays?: boolean }[] = [
  { name: 'instructions' }, { name: 'synthetic' }, { name: 'public_code' }, { name: 'private_code' },
  { name: 'production_data', stays: true }, { name: 'secret', stays: true },
]

export type FigurePart = { text: string; big?: boolean; num?: number; unit?: string; dec?: number }
export interface Finding {
  id: string
  level: string
  levelClass: 'lab' | 'proof' | 'honest'
  /** evidence level reached, 1–6, or 0 when the item is not a level claim */
  levelN: number
  title: string
  figure: FigurePart[]
  body: string
  caveat?: string
  /** a real line, as the agent or the records wrote it */
  verdict?: string
  links: { label: string; href: string }[]
}

/**
 * Campaign 12. Report: docs/bench/campaign12/REPORT.md on feat/64-campaign (§2, §3, §5, §7, §8, §12b, §13); summary on
 * main b8082e9: docs/DECISIONS.md D-065 and docs/ROAD-TO-1.0.md §3. `of` is the denominator shown for that row: Level B
 * (real models) ran on 4 development and 8 independent repositories; frontier repositories had no Level B run.
 */
export interface CampaignCell { on: number; of: number; also?: number; alsoKind?: 'debian' | 'scope'; note?: string }
export interface CampaignRow { id: string; label: string; scope: string; dev: CampaignCell; independent: CampaignCell; frontier: CampaignCell | null }
export const CAMPAIGN = {
  eyebrow: 'Campaign 12 · measured, then re-measured',
  classes: [
    { id: 'dev', name: 'Development', n: 12, note: 'shaped the product: calibration, not evidence' },
    { id: 'independent', name: 'Independent', n: 19, note: 'chosen by a written rule: the real test' },
    { id: 'frontier', name: 'Frontier', n: 8, note: 'at or past the edge of what it supports' },
  ],
  rows: [
    {
      id: 'lifecycle', label: 'Installed and ran as a product', scope: 'setup, start, a second start refused, stop, dashboard · no model, twice',
      dev: { on: 12, of: 12 }, independent: { on: 19, of: 19 }, frontier: { on: 8, of: 8 },
    },
    {
      id: 'checks', label: 'Reproduced the project’s own tests, green', scope: 'default mandate, on the confirmation pass',
      dev: { on: 8, of: 12 },
      independent: { on: 3, of: 19, also: 4, alsoKind: 'debian', note: '7 with Debian’s archive allowed' },
      frontier: { on: 1, of: 8, also: 4, alsoKind: 'scope', note: '4 said to be out of scope' },
    },
    {
      id: 'pr', label: 'Published a pull request', scope: 'of the repositories run with real Meta models',
      dev: { on: 3, of: 4 }, independent: { on: 1, of: 8 }, frontier: null,
    },
    {
      id: 'chain', label: 'Merged on green CI, deployed, healthy', scope: 'only repositories with a lab and a passed drill could reach this',
      dev: { on: 2, of: 4 }, independent: { on: 0, of: 8 }, frontier: null,
    },
  ] as CampaignRow[],
  facts: [
    { value: 0, label: 'human interventions during the runs' },
    { value: 0, label: 'actions outside the mandate' },
    { value: 17, unit: ' of 24', label: 'model runs published nothing, and said why' },
    { value: 2.1, dec: 2, prefix: 'US$', label: 'in model spend for the 24 evaluation runs' },
  ],
  notes: [
    'The full chain ran on fst (twice) and spoolman, whose run needed the US$2 default monthly cap raised to US$10. Spoolman: index measured 14.69 → 2.77 ms, 15 green checks.',
    'Five of the first eight pull requests were green on the team’s CI. Three failed its formatter, a defect since fixed; on the next pass one failed its type check, which candidates now go through too.',
    'These numbers come from candidates older than today’s release. The final pass over the same 39 is above.',
  ],
  links: [
    { label: 'the 39 repositories', href: LINKS.corpus },
    { label: 'DECISIONS.md D-065', href: `${LINKS.decisions}#d-065` },
    { label: 'spoolman pull request', href: 'https://github.com/satisfymath/c12-spoolman/pull/1' },
    { label: 'misago pull request', href: 'https://github.com/satisfymath/c12-misago/pull/1' },
  ],
}

/** main b8082e9: docs/RELEASE.md, docs/ROAD-TO-1.0.md §2-3, docs/bench/campaign13/FINDINGS.md */
/** main b8082e9: bench/campaign13/corpus.yaml — the 39, in the corpus's order. */
export const CORPUS = ['fst', 'conduit', 'spoolman', 'codex-lb', 'aegra', 'ctfd', 'timetracker', 'rich', 'marshmallow', 'pyjwt', 'humanize', 'sqlmodel', 'mimirq', 'mediacms', 'misago', 'brightbean-studio', 'traefik-manager', 'oauthlib', 'rdflib', 'graphtage', 'python-progressbar', 'python-mss', 'reader', 'harlequin', 'dooit', 'pipx', 'recruitops-agent', 'aiogramshopbot', 'gymhero', 'dinkydash', 'tracklater', 'librephotos', 'netbox', 'archery', 'resumeio-to-pdf', 'ai-avatar-system', 'zod', 'gin', 'weblate']

/**
 * v0.18.1: docs/bench/campaign13/DEV-EVIDENCE.md and dev-evidence.json (copied verbatim to ./dev-evidence.json).
 * `cls` is each repository's class in bench/campaign13/corpus.yaml. Records are linked at the tag, so they stay put.
 */
export type CorpusClass = 'dev' | 'independent' | 'frontier'
const TAG = `${GH}/blob/v0.18.1`
export const DEV_RUNS = {
  eyebrow: 'Campaign 13 · the development runs, 0.15 to 0.18',
  figureLabel: 'of the teams’ own tests pass under Unbidden’s measurement',
  lede: 'Each suite ran offline, in the environment the team’s own CI job prepares. Every fix of 0.16 to 0.18 was made from these runs, so they are development evidence, not the final pass.',
  facts: [
    { value: 15, label: 'team suites pass: 11 development, 3 independent, 1 frontier' },
    { value: 3, label: 'applications brought up by Unbidden itself from their own compose file' },
    { value: 1, label: 'L5 by verified deploy: fst, a security bump. No effect measured' },
    { value: 0.34, dec: 2, prefix: 'US$', label: 'of model spend. Preparing and measuring environments calls no model' },
  ],
  groups: { pass: 'Suite passes', red: 'Runs, not green', declared: 'Declared', rest: 'Not in these runs' },
  classOf: {
    fst: 'dev', 'codex-lb': 'dev', timetracker: 'dev', spoolman: 'dev', aegra: 'dev', ctfd: 'dev', humanize: 'dev', rich: 'dev', marshmallow: 'dev', pyjwt: 'dev', sqlmodel: 'dev', conduit: 'dev',
    misago: 'independent', graphtage: 'independent', oauthlib: 'independent', 'traefik-manager': 'independent', harlequin: 'independent', pipx: 'independent', 'brightbean-studio': 'independent', rdflib: 'independent', mediacms: 'independent', mimirq: 'independent',
    archery: 'frontier',
  } as Record<string, CorpusClass>,
  // DEV-EVIDENCE.md "Records": misago's record names mailpit's page as its health (host port 61027 is mailpit:8025 in dev-host/misago-final.json)
  extra: { misago: 'Its recorded drill judged health on the page of its mail catcher, a defect fixed in 0.18.1: misago now answers on its own port. The drill has no later record.' } as Record<string, string>,
  notes: [
    'Not one pass: the counts come from different versions and runs. traefik-manager passed all 2192 once and is flaky; oauthlib’s later offline runs need the network to build.',
    'Two rollback drills are recorded as passed, on codex-lb and misago. misago’s judged health on its mail catcher’s page, a defect found afterwards; TimeTracker’s was declared, its head adds a migration.',
    'On copies under satisfymath, nothing upstream. These runs fed the final pass above.',
  ],
  links: [
    { label: 'DEV-EVIDENCE.md', href: `${TAG}/docs/bench/campaign13/DEV-EVIDENCE.md` },
    { label: 'dev-evidence.json', href: `${TAG}/docs/bench/campaign13/dev-evidence.json` },
  ],
  recordHref: (record: string) => `${TAG}/${record}`,
}

/**
 * The final pass: pull request #41 of unbidden-ai, merged, pinned to its head commit so the figures and their links cannot drift. ./final-pass.json is
 * written by scripts/evidence/final_pass.py from final-evidence.json, final/MATRIX.md, final/REPORT-aggregate.md and aegra's
 * export at that commit, and it refuses to write if a total disagrees. The pass closed at 20:36 -03: FINAL.md, FINDINGS.md.
 */
const PASS = `${GH}/blob/${finalPass.source.commit}/docs/bench/campaign13`
export const FINAL_PASS = {
  eyebrow: 'Campaign 13 · the final pass',
  figureLabel: 'improvements merged by the product, each checked again apart from the agent',
  lede: 'Modest ones: 8 security bumps and 5 quality fixes. 3 reached L5 by a verified deploy, with no effect measured, all on code that shaped it. On independent code it reached L4 at best. 7 repositories were stopped at the deadline.',
  intro: 'The same 39 repositories, on copies, nothing upstream. Frontier models, and nobody helped during a run; people prepared each copy and its mandate. A merge needed the team’s own CI green on the exact head. Then a script apart from the agent checked every merge again.',
  stamp: 'Closed at 20:36 (UTC−3) on the hackathon’s deadline. Runs on 0.18.6, 4 repeated on 0.18.9.',
  facts: {
    record: 'repositories with a record',
    pulls: 'pull requests, 30 green on the team’s CI',
    l5: 'L5 by verified deploy',
    spend: 'of model spend',
  },
  funnel: {
    title: 'Where the 39 went',
    sub: 'Repositories that reached each stage. Pick one to see which.',
    note: 'dooit merged with no CI to read, on the lab’s evidence alone, so merged exceeds green.',
  },
  fate: {
    title: '44 pull requests, one square each',
    sub: 'Every square opens the real pull request.',
    groups: {
      merged: { label: 'Merged', note: 'One fix merged in two runs, so 14 merges are 13 improvements.' },
      green: { label: 'Green, not merged', note: 'A merge moves the base. Proposals on the same lock file go stale and are measured again; others ran out of time.' },
      red: { label: 'Red on the team’s CI', note: 'Left to a person, by rule, even when the base was already red.' },
      none: { label: 'No CI on the pull request', note: 'dooit #4 merged on the lab’s evidence alone. These 3 did not merge.' },
    } as Record<string, { label: string; note: string }>,
    kinds: 'By kind: 31 security, 10 quality, 3 correctness. No correctness change merged.',
  },
  decisions: {
    title: 'It measures far more than it proposes',
    sub: 'Every decision of its director across the 36 runs.',
    labels: { run_experiment: 'Run an experiment', wait: 'Wait', decline: 'Decline', propose_change: 'Propose a change', investigate: 'Investigate' } as Record<string, string>,
    declinedTitle: 'Why it declined',
  },
  levels: {
    title: 'The highest level each repository reached',
    rows: [
      { id: 'L5', label: 'L5', note: 'deployed, healthy, attributable' },
      { id: 'L4', label: 'L4', note: 'validated by the team’s suite' },
      { id: 'L3', label: 'L3', note: 'improved in the lab' },
      { id: 'L1', label: 'L1', note: 'a reasonable suspicion' },
      { id: '-', label: 'None', note: 'nothing to prove, or out of reach' },
      { id: 'stopped', label: 'Stopped', note: 'at the close, no record' },
    ],
  },
  run: {
    title: 'One improvement, from first sight to L5',
    body: 'aegra, on 0.18.9. Unbidden brought the app up by itself, found a vulnerable certifi and took it all the way. This is its own event log, shortened. The names in the second column are parts of the product, not people.',
    wait: 'waiting for CI',
    endpoints: 'The 10 endpoints, median ms before and after',
    endpointsNote: 'Within the criteria on all ten, so no change is claimed. The traffic is Unbidden’s own probes, not users, and the latency measurement proper was deferred because the host was busy.',
    verify: 'Checked apart from the agent',
    caveat: 'aegra is a development repository, deployed on this machine. A verified deploy says the change is live, attributable and healthy. It claims no measured effect.',
  },
  matrix: {
    title: 'Every repository',
    sub: 'Open a row for its pull requests and for every opportunity, with the decision and the reason.',
    all: 'All 39',
    merged: 'With a merge',
    columns: ['Repository', 'Team’s tests', 'Opportunities', 'Experiments', 'PRs', 'Green', 'Merged', 'Level', 'US$'],
    stopped: 'Stopped at the deadline, before its record. Its partial logs are kept, and nothing of it is counted.',
    checks: { passed: 'passed', failed: 'failed', infra_failed: 'environment failed', blocked: 'blocked', out_of_scope: 'out of scope' } as Record<string, string>,
    record: 'its record in MATRIX.md',
    multi: 'Highest across its runs; pull requests and spend are added up.',
  },
  merges: { title: 'Every merge', independent: 'verified' },
  compare: {
    title: 'Against campaign 12, run by run',
    sub: 'Share of runs, or of pull requests, with its 95% interval.',
    c12: 'Campaign 12',
    c13: 'Campaign 13',
    note: 'This shows movement, not a controlled effect. The product was fixed against these same repositories, the final mandate grants every permission, and some samples are tiny: campaign 12’s independent class opened one pull request.',
  },
  notes: [
    'Modest changes on purpose: dependency bumps and ruff fixes, each at L4 when proposed. Most repositories ran on a custom mandate that allows merges and no deploys, because the autonomous preset needs deploy steps and a passed drill.',
    'The pass was stopped five times to fix general defects it exposed, 9 in all, released as 0.18.2 to 0.18.10. So it is not blind to these repositories. The stopped starts are kept and never added to the totals.',
    'Stopped at the close: brightbean-studio, gymhero, misago, recruitops-agent, timetracker, traefik-manager, weblate. spoolman hit its spend cap once, and a rule written beforehand raised it.',
  ],
  links: [
    { label: 'FINAL.md', href: `${PASS}/final/FINAL.md` },
    { label: 'MATRIX.md', href: `${PASS}/final/MATRIX.md` },
    { label: 'final-evidence.json', href: `${PASS}/final-evidence.json` },
    { label: 'REPORT-aggregate.md', href: `${PASS}/final/REPORT-aggregate.md` },
    { label: 'FINDINGS.md', href: `${PASS}/FINDINGS.md` },
  ],
  matrixHref: (name: string, version: string) => `${PASS}/final/MATRIX.md#${name}-${version.replaceAll('.', '')}`,
}

export const SINCE = {
  eyebrow: 'What changed between the two campaigns',
  items: [
    { version: '0.13', title: 'Every stop retried, asked or declared.', body: 'A block is no longer read as a verdict on the change.' },
    { version: '0.14', title: 'Known vulnerabilities, proven like any other change.', body: 'On an fst copy: dnspython bumped with the team’s lock tool, advisories 1 → 0, suite green on both sides, L4.' },
    { version: '0.16', title: 'The environment the team’s own CI job prepares.', body: 'It runs that job, then measures offline in it. humanize, graphtage, oauthlib and codex-lb passed for the first time.' },
    { version: '0.17', title: 'Failing tests repaired, only when the team’s CI fails them too.', body: 'A change to a test, a skip or an xfail is refused. So far proven on a seeded defect; on real repositories the rule opened nothing.' },
    { version: '0.18', title: 'It brings an application up by itself.', body: 'From the repository’s own compose file, with generated secrets and free ports, then a rollback drill. In the final pass, aegra reached L5 this way.' },
    { version: '0.18', title: 'L5 beyond latency.', body: 'A security, quality or correctness change reaches L5 by a verified deploy: healthy, attributable, the fixed version running. It claims no measured effect.' },
  ],
  roadTitle: 'What 1.0 asks for',
  road: 'Improvements proven in five classes, re-checked independently, with zero tolerance for a false promotion, an action outside the mandate or a leaked secret. Until every line is met on the same 39, the version stays an experimental candidate.',
  classes: ['latency', 'correctness', 'reliability', 'security', 'quality'],
  links: [
    { label: 'ROAD-TO-1.0.md', href: LINKS.road },
    { label: 'campaign 13 findings', href: LINKS.findings },
    { label: 'release notes', href: LINKS.changelog },
  ],
}

export const EVIDENCE = {
  eyebrow: 'The evidence',
  title: '39 repositories. Where it held, and where it thins.',
  // main b8082e9: docs/DECISIONS.md D-065
  lede: 'The installed product on copies of 39 repositories, pinned before the first run. Nobody helped during a run.',
  more: {
    prs: { title: 'The pull requests', hint: '44 opened, 14 merges' },
    run: { title: 'One run, as it happened', hint: 'aegra, its own log' },
    repos: { title: 'All 39, one by one', hint: 'every decision and its reason' },
    read: { title: 'How to read this pass', hint: 'limits and sources' },
    c12: { title: 'Campaign 12, and the comparison', hint: 'the same 39, before' },
    dev: { title: 'The development runs', hint: 'the suites behind the fixes' },
    systems: { title: 'Single systems', hint: 'each at the level it reached' },
    since: { title: 'What changed, and what 1.0 asks for', hint: '0.13 to 0.18' },
  },
  levels: [
    { id: 'L1', name: 'reasonable suspicion' },
    { id: 'L2', name: 'reproduced' },
    { id: 'L3', name: 'improved in the lab' },
    { id: 'L4', name: 'functionally validated' },
    { id: 'L5', name: 'operational result' },
    { id: 'L6', name: 'persisted over time' },
  ],
  findings: [
    {
      id: 'fastapi',
      level: 'L4 · laboratory',
      levelClass: 'lab',
      levelN: 4,
      title: 'FastAPI template: an index on item.owner_id',
      figure: [{ text: '11.74 ms', num: 11.74, unit: ' ms', big: true }, { text: '→' }, { text: '3.65 ms', num: 3.65, unit: ' ms', big: true }, { text: 'median, GET /api/v1/items/, perf-v4' }],
      // docs/bench/stage10-revalidation/v4-dec7ba2/README.md:9-12; docs/DECISIONS.md D-010 L83–87, D-013 L119–126
      body: 'Sixty-nine percent faster under the current criteria (perf-v4): permutation p = 0.0286, interval [+67 %, +70 %], the index seen in use on every measured call, A/A control −2 %, confirmed in new sessions. The pull request was opened, merged and deployed in autonomous mode with nobody intervening.',
      // docs/EVIDENCE.md L32–33; docs/DECISIONS.md D-014 L140–143; stage10-revalidation/v4-f9fe965/README.md:6
      caveat: 'First measured 13.0 → 4.1 ms (p = 3.4e-08) under earlier criteria, marked pending revalidation; one later revalidation came out inconclusive. In production the endpoint measured 10.5 → 1.7 ms, below the pre-registered 10 ms floor, so no change was claimed: that deploy stays L4, not L5. A later run, in campaign 12, reached a latency L5.',
      verdict: 'opp_56f9d3d9ace0468f (item.owner_id): improved, L4 confirmed (US$0.0292)',
      links: [
        { label: 'revalidation v4-dec7ba2', href: `${GH}/blob/main/docs/bench/stage10-revalidation/v4-dec7ba2/README.md` },
        { label: 'DECISIONS.md D-010', href: `${LINKS.decisions}#d-010` },
        { label: 'pull request', href: LINKS.fastapiPr },
      ],
    },
    {
      id: 'mealie',
      level: 'L5 · on SQLite, probe traffic',
      levelClass: 'proof',
      levelN: 5,
      title: 'mealie: a latency L5, on SQLite',
      figure: [{ text: '11.8 ms', num: 11.8, dec: 1, unit: ' ms', big: true }, { text: '→' }, { text: '2.2 ms', num: 2.2, dec: 1, unit: ' ms', big: true }, { text: 'median live, GET /api/foods/empty' }],
      // main b8082e9: docs/EVIDENCE.md "Results on single systems"; docs/DECISIONS.md D-035, D-036, D-041
      body: 'An unindexed shopping_list_items.food_id, found and written by Unbidden, measured between two verified deploys. The 56 other probed endpoints did not change.',
      caveat: 'Probe traffic only, not users. On PostgreSQL the same index gave no relevant change: its live run, 5.3 → 5.0 ms, is recorded as an invalid L5, and its lab L4 was not confirmed on that engine.',
      links: [
        { label: 'DECISIONS.md D-041', href: `${LINKS.decisions}#d-041` },
        { label: 'EVIDENCE.md', href: LINKS.evidence },
      ],
    },
    {
      id: 'fst-security',
      level: 'L5 · verified deploy, no effect measured',
      levelClass: 'proof',
      levelN: 5,
      title: 'fst: a known vulnerability, fixed and deployed',
      figure: [{ text: '2.8.0', big: true }, { text: '→' }, { text: '2.9.0', big: true }, { text: 'dnspython, checked in a running container' }],
      // v0.18.1: docs/RELEASE.md 0.18.0, docs/bench/campaign13/DEV-EVIDENCE.md, rehearsal-0.18/fst/B1.json
      body: 'The first L5 that is not latency. In autonomous mode Unbidden found the advisory, bumped the package, saw the copy’s CI go green, merged and deployed it.',
      caveat: 'A verified deploy claims no measured effect and is kept apart from measured L5. This was a copy of a development repository, deployed to a local lab; a person set up the lab, the mandate and the rollback drill beforehand.',
      verdict: 'L5 · verified deploy: deployed, healthy, the fix is in the running version; no measured effect claimed',
      links: [
        { label: 'run record', href: DEV_RUNS.recordHref('docs/bench/campaign13/rehearsal-0.18/fst/B1.json') },
        { label: 'pull request', href: 'https://github.com/satisfymath/c13-fst/pull/4' },
      ],
    },
    {
      id: 'rich',
      level: 'L4 · functional validation',
      levelClass: 'lab',
      levelN: 4,
      title: 'Rich: two crashes in cells.py, one with no issue',
      figure: [{ text: '58 s', big: true }, { text: 'to L4, the project’s own suite, three rounds per side' }],
      // docs/DECISIONS.md D-018 L215–227
      body: 'A ZeroDivisionError at cells.py:256 that appears in no issue, and an IndexError at cells.py:266 on the same line as issue #4239 with a different, simpler trigger. The fix was written by Spark and validated without regression.',
      caveat: 'The pull request is open against a fork, not merged.',
      verdict: "the property test fails at the base and passes with the fix, Rich's suite three rounds per side with no regression: L4 in 58 s",
      links: [
        { label: 'DECISIONS.md D-018', href: `${LINKS.decisions}#d-018` },
        { label: 'pull request', href: LINKS.richPr },
      ],
    },
    {
      id: 'drill',
      level: 'Rollback proven',
      levelClass: 'proof',
      levelN: 0,
      title: 'Outage drill: a broken release, rolled back',
      figure: [{ text: '11 s', num: 11, unit: ' s', big: true }, { text: 'to call the outage' }, { text: '15 s', num: 15, unit: ' s', big: true }, { text: 'to roll back' }],
      verdict: 'scenario: release 1.6 broke the database pool · rolled back with the team\u2019s own steps · hold only a person releases',
      // docs/DECISIONS.md D-015 L151–160; docs/EVIDENCE.md L34
      body: 'A scenario script, declared as such, deployed a broken release. Unbidden called the outage, rolled back with the team’s own steps and left a hold that only a person releases.',
      caveat: 'A redeploy verdict from the same run was later found invalid and is recorded as such.',
      links: [{ label: 'DECISIONS.md D-015', href: `${LINKS.decisions}#d-015` }],
    },
  ] as Finding[],
  // main b8082e9: docs/EVIDENCE.md, "Across unseen repositories", "Known limits"
  foot: 'The blind holdout, run once and frozen: 7 of 10 bootstrapped, 0 of 7 with a validated improvement, and one earlier L4 was a false positive. It has not yet found a validated improvement in an unseen, mature library. Production impact comes from Unbidden’s own probes, not user traffic.',
  footLink: { label: 'Read docs/EVIDENCE.md', href: LINKS.evidence },
}

export const INSTALL = {
  eyebrow: 'Install',
  // README.md L36–46 (install), docs/INSTALL.md L5–8, L69–75
  lede: 'One line. The script is served from unbidden.cl and downloads the wheel of the latest GitHub release, verified against its SHA256SUMS, into its own Python. It never uses sudo.',
  command: 'curl -fsSL https://unbidden.cl/install.sh | sh',
  notes: [
    'macOS on Apple silicon, verified by hand. Linux x86-64 with glibc 2.28 or newer, verified in CI only.',
    'The machine provides git; Docker with buildx and compose for the sandbox; Ollama for the local and mixed options; a Meta API key for mixed and api.',
    'Open source under Apache 2.0. Version 0.18.10, an experimental candidate, not 1.0.',
  ],
}

export const FOOTER = {
  version: 'v0.18.10 · experimental candidate',
  credit: 'Film sequence generated locally with MiniMax H3 (FL2VA) on Apple silicon from nine approved frames; no inference runs in the browser. Site built from the public repository; evidence levels are the repository’s own.',
}
