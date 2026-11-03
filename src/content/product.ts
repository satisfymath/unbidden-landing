/**
 * Copy for Acts II–IV. Every claim traces to satisfymath/unbidden-ai at main 5ecd617 (0.12.2, 2026-11-03).
 * Sources are noted inline as file:line of that commit. Nothing here is invented; levels are the repository's own.
 */
const GH = 'https://github.com/satisfymath/unbidden-ai'
export const LINKS = {
  repo: GH,
  readme: `${GH}#readme`,
  architecture: `${GH}/blob/main/docs/ARCHITECTURE.md`,
  evidence: `${GH}/blob/main/docs/EVIDENCE.md`,
  decisions: `${GH}/blob/main/docs/DECISIONS.md`,
  install: `${GH}/blob/main/docs/INSTALL.md`,
  release: `${GH}/releases/tag/v0.12.2`,
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

export type FigurePart = { text: string; big?: boolean; num?: number; unit?: string }
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

export const EVIDENCE = {
  eyebrow: 'The evidence',
  title: 'What it has shown, at the level it reached.',
  // README.md L108–117; docs/EVIDENCE.md L4–5
  lede:
    'Every result carries one of six levels, and a laboratory result is never presented as a deployed one. These are the results the repository documents today, with their own caveats.',
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
      caveat: 'First measured 13.0 → 4.1 ms (p = 3.4e-08) under earlier criteria, marked pending revalidation; one later revalidation came out inconclusive. In production the endpoint measured 10.5 → 1.7 ms, below the pre-registered 10 ms floor, so no change was claimed: this stays L4, not L5.',
      verdict: 'opp_56f9d3d9ace0468f (item.owner_id): improved, L4 confirmed (US$0.0292)',
      links: [
        { label: 'revalidation v4-dec7ba2', href: `${GH}/blob/main/docs/bench/stage10-revalidation/v4-dec7ba2/README.md` },
        { label: 'DECISIONS.md D-010', href: `${LINKS.decisions}#d-010` },
        { label: 'pull request', href: LINKS.fastapiPr },
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
    {
      id: 'holdout',
      level: 'Honest result',
      levelClass: 'honest',
      levelN: 0,
      title: 'Repositories it had never seen',
      figure: [{ text: '7 / 10', big: true }, { text: 'bootstrapped' }, { text: '0 / 7', big: true }, { text: 'validated improvements' }],
      verdict: '16:16:37 opp_65ff7491fae54f8b: no proven fix (GET /api/articles/feed: session medians 32.37 -> 32.68 ms (-1% faster), permutation p = 0.9)',
      // docs/EVIDENCE.md L44–84, L95
      body: 'The holdout was run once and frozen. It has not yet found a validated improvement in an unseen, mature library, and one earlier L4 was a false positive. All of the results on this page cost US$1.24 at list price.',
      caveat: 'Version 0.12.2 is an experimental candidate, not 1.0. What blocks 1.0: no useful cycle has been shown on an application not used in development.',
      links: [{ label: 'EVIDENCE.md', href: LINKS.evidence }, { label: 'RELEASE.md', href: `${GH}/blob/main/docs/RELEASE.md` }],
    },
  ] as Finding[],
  foot: 'Production impact is measured from Unbidden’s own probes, not user traffic. A few real projects, run a few times each: the repository makes no claim about rates.',
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
    'Open source under Apache 2.0. Version 0.12.2, an experimental candidate, not 1.0.',
  ],
}

export const FOOTER = {
  version: 'v0.12.2 · experimental candidate',
  credit: 'Film sequence generated locally with MiniMax H3 (FL2VA) on Apple silicon from eight approved frames; no inference runs in the browser. Site built from the public repository; evidence levels are the repository’s own.',
}
