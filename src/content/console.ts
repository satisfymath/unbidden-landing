/**
 * Terminal material for the operator's console. Every string here is copied from satisfymath/unbidden-ai at main
 * 5ecd617 (0.12.2) or from logs the repository itself ships. Sources are given per block as path:line. Nothing is invented;
 * where a value is not documented it is omitted rather than guessed. See docs/CONTENT_SOURCES.md.
 */

// unbidden/tui/brand.py:7-20
export const TUI = {
  MARK: '○˙', // ○˙
  WORDMARK: 'UNBiDDEN',
  TAGLINE: "Intelligence that doesn't wait for instructions.",
  VERBS: ['Discovering.', 'Investigating.', 'Experimenting.', 'Proving.'],
  ACCENT: '#F5B700',
  RING: ['⠀⡀⡤⠒⠒⠀', '⠼⠀⠀⠀⠀⡧', '⠘⠦⡀⡀⠴⠃'] as const,
  DOT: '⠛',
  VERSION: '0.12.2',
  // unbidden/tui/app.py:34-48
  PALETTE: { bg: '#0e0e0e', surface: '#161616', panel: '#2a2a2a', fg: '#ececec', primary: '#d7d7d7', secondary: '#9a9a9a' },
}
// brand.py:14-19 renders the ring as three rows of braille cells; the first row is five cells and the dot is the sixth.
export const SPLASH_ROWS = [
  '⠀⡀⡤⠒⠒⠀',
  '⠼⠀⠀⠀⠀⡧',
  '⠘⠦⡀⡀⠴⠃',
] as const
export const SPLASH_WORDMARK = 'U N B i D D E N'

export type Verb = 'Discovering' | 'Investigating' | 'Experimenting' | 'Proving' | 'Deciding' | 'Asking' | 'Guarding'
export interface FeedLine { t: string; text: string; detail?: string; accent?: boolean }
export interface FeedGroup { verb: Verb; lines: FeedLine[] }

/**
 * One real cycle, as the agent logged it: docs/bench/stage10-regression/v4-3b5b99d/conduit/R10-B-1/cycles.log
 * (lines 1-11 and 232-262; the dependency-build failure at lines 12-231 is omitted). The lines are grouped under the
 * feed's verbs following unbidden/tui/feed.py:32-73; timestamps are the log's own.
 */
export const FEED: { workspace: string; head: string; groups: FeedGroup[]; source: string; note: string } = {
  workspace: 'conduit',
  head: '029eb7781c60',
  source: 'docs/bench/stage10-regression/v4-3b5b99d/conduit/R10-B-1/cycles.log',
  note: 'Agent log of one real cycle on the Conduit repository (regression run v4-3b5b99d), laid out as the feed shows it. Timestamps as recorded.',
  groups: [
    {
      verb: 'Discovering',
      lines: [
        { t: '15:28:20', text: 'HEAD is 029eb7781c60' },
        { t: '15:28:21', text: 'connections: postgres:127.0.0.1:55440/postgres connected, http_api:http://127.0.0.1:18110 needs_capability' },
        { t: '15:28:25', text: 'scan of 029eb7781c60: 0 reports, 0 new opportunities' },
        { t: '15:29:57', text: 'map of 029eb7781c60: 38 resources, 0 blind spots' },
      ],
    },
    {
      verb: 'Investigating',
      lines: [
        { t: '15:29:58', text: 'robustness probe at 029eb7781c60: investigate (probe app (30 public functions sampled))' },
        { t: '15:51:42', text: 'candidate: index on favorites.article_id, written from the finding', accent: true },
      ],
    },
    {
      verb: 'Experimenting',
      lines: [
        { t: '15:51:43', text: 'writing the workload (attempt 1)' },
        { t: '15:52:08', text: 'validating the workload at the base' },
        { t: '15:55:30', text: 'measuring 4 sessions per side, alternating' },
        { t: '15:58:56', text: 'A/A control: base against base' },
        { t: '16:00:37', text: 'confirming in 4 new sessions per side (1 candidate(s) at this commit)' },
        { t: '16:04:03', text: 'running the CI test job on both sides' },
      ],
    },
    {
      verb: 'Proving',
      lines: [{ t: '16:08:09', text: 'opp_8aa2df1342d54cdc: improved, evidence L4', accent: true }],
    },
    {
      verb: 'Deciding',
      lines: [
        { t: '16:08:09', text: "opp_8aa2df1342d54cdc: propose_change (evidence L4 meets the mandate's L4)" },
        { t: '16:08:09', text: 'opp_8aa2df1342d54cdc: branch unbidden/favorites-article-id-is-a-foreign-key-wi-d54cdc ready' },
      ],
    },
    {
      verb: 'Guarding',
      lines: [
        {
          t: '16:08:09',
          text: "opp_8aa2df1342d54cdc: not published: destination github.com is not in the mandate's allowlist; destination api.github.com is not in the mandate's allowlist",
          accent: true,
        },
      ],
    },
    {
      verb: 'Investigating',
      lines: [{ t: '16:08:10', text: 'candidate: index on articles.author_id, written from the finding' }],
    },
    {
      verb: 'Experimenting',
      lines: [
        { t: '16:08:31', text: 'validating the workload at the base' },
        { t: '16:08:58', text: 'measuring 4 sessions per side, alternating' },
        { t: '16:12:30', text: 'running the CI test job on both sides' },
      ],
    },
    {
      verb: 'Proving',
      lines: [
        {
          t: '16:16:37',
          text: 'opp_65ff7491fae54f8b: no proven fix (GET /api/articles/feed: session medians 32.37 -> 32.68 ms (-1% faster), permutation p = 0.9 (slower: 0.114), 95% interval of the effect [-2%, +0%]; no change of 20% or more either way)',
        },
      ],
    },
  ],
}

/** The cycle as docs/ARCHITECTURE.md:11-19 names it, mapped to the five stage labels of the page plus `operate`. */
export const CYCLE_NODES = [
  { label: 'OBSERVE', job: 'observe', verbs: ['Discovering'] as Verb[] },
  { label: 'INVESTIGATE', job: 'research', verbs: ['Investigating'] as Verb[] },
  { label: 'EXPERIMENT', job: 'lab', verbs: ['Experimenting'] as Verb[] },
  { label: 'PROVE', job: 'L1–L6', verbs: ['Proving'] as Verb[] },
  { label: 'PROPOSE', job: 'publish', verbs: ['Deciding', 'Asking', 'Guarding'] as Verb[] },
] as const

// unbidden/tui/text.py:21-31
export const BAR = {
  running: '● agent',
  stopped: '○ agent off',
  ollama: 'ollama ✓',
  kill: 'KILL SWITCH',
}
// unbidden/tui/text.py:91-93
export const KILL = {
  on: 'Kill switch engaged: nothing runs and nothing is sent until /resume.',
  off: 'Kill switch released. The agent continues on its next cycle.',
  // unbidden/cli.py:1863, 1875
  cli_on: 'Kill switch engaged. No job starts and no model is called until `unbidden resume`.',
  cli_off: 'Kill switch released.',
}
// unbidden/tui/text.py:149-205, the sentence templates the feed uses (shown as templates, braces kept)
export const TEMPLATES = [
  'Found: {title}',
  'Measuring the {origin} candidate ({files} file(s)).',
  'Improved, L{level}{measure}.',
  'Not improved, L{level}{measure}.',
  'Proposal ready on {branch} ({commit}), L{level}.',
  'A proposal waits for you: /approve {id} · /why {id}',
  'Pull request opened: {url}',
  'Blocked {bytes} bytes to {destination} for {purpose}: {reasons}',
  'Credential-looking values masked before the model saw them ({purpose}).',
  '{purpose} · {tier} · {model} · {tokens} tokens · US${usd:.4f}',
  'Kill switch {state}.',
  'Rolled back to {commit}: {result}',
  'Outcome held over {checks} check(s).',
  'It needs a capability: {what}',
]
// unbidden/tui/text.py:205
export const LEVEL_NAMES: Record<number, string> = { 1: 'suspicion', 2: 'reproduced', 3: 'lab', 4: 'validated', 5: 'operational', 6: 'persistent' }
// docs/RELEASE.md:133-140 (short form README.md:110-117)
export const LEVELS = [
  { id: 'L1', name: 'Reasonable suspicion', def: 'a check or a model points at something; nothing reproduced' },
  { id: 'L2', name: 'Reproduced', def: 'the finding is observed (a scan, a query plan, a discrepancy between an API and its data)' },
  { id: 'L3', name: 'Improved in the lab', def: "a change measured better in the sandbox, but the project's checks did not validate it on both sides" },
  { id: 'L4', name: 'Functionally validated', def: "the project's own checks pass on both sides (three rounds each), and the measurement passes criteria perf-v4" },
  { id: 'L5', name: 'Operational result', def: 'measured on the running system after deploy, its confounders listed' },
  { id: 'L6', name: 'Persisted', def: "L5 held over the mandate's period" },
]

/**
 * `unbidden doctor` as recorded on this machine during the product walk:
 * docs/bench/product-walk-2026-11-01/walk-stdout.log:66-83 (the walk ran 0.9.0; marks and wording are the CLI's).
 */
export const DOCTOR = {
  command: 'unbidden doctor',
  head: 'option api: Ollama and a local model are optional; the Meta API key is required',
  rows: [
    { mark: 'ok', name: 'ollama', detail: '3 model(s) at http://localhost:11434' },
    { mark: 'ok', name: 'machine', detail: 'Apple M5 Pro, 64 GB, 54 GB for a model' },
    { mark: 'ok', name: 'local model', detail: 'muse-glimmer:30b-mxfp8-dflash (fits in 54 GB: 8-bit: the best local quality measured)' },
    { mark: 'ok', name: 'docker', detail: 'running' },
    { mark: 'ok', name: 'docker compose', detail: 'Docker Compose version v5.5.0' },
    { mark: 'ok', name: 'meta api', detail: 'key set, API reachable' },
    { mark: '--', name: 'github', detail: 'no GITHUB_TOKEN: proposals stay local branches (optional)' },
    { mark: 'ok', name: 'mandate', detail: 'profile frontier, PRs require_approval' },
    { mark: 'ok', name: 'repository', detail: 'public (confirmed)' },
    { mark: 'ok', name: 'scope: stack', detail: 'Python 3.9 (poetry.lock, poetry.lock)' },
  ],
  note: 'Recorded on an Apple M5 Pro on 2026-11-01 (product walk, docs/bench/product-walk-2026-11-01).',
}
// docs/bench/product-walk-2026-11-01/walk-stdout.log:85-92, the home screen of `unbidden` with no command
export const HOME = [
  'rich · head 9d8f9a372cc5 · mode supervised · models frontier',
  'agent: not running',
  'opportunities: none yet',
  'no scan yet',
  'spend: US$27.7637 spent on this machine · US$9.5308 available under the cap',
  'next: unbidden scan',
]

// unbidden/cli.py:2131-2302 and unbidden/distribution/__init__.py:175-178 — every top-level command and its help text
export const HELP = {
  usage: 'usage: unbidden [-h] [--version] [--json] [--plain] <command> ...',
  description: "Intelligence that doesn't wait for instructions.",
  options: [
    ['--version', "show program's version number and exit"],
    ['--json', 'machine-readable output (with no command: the state)'],
    ['--plain', 'with no command: the text screen, never the app'],
  ],
  commands: [
    ['update', 'install a newer (or an older, with --version) release over this one'],
    ['uninstall', 'remove the unbidden tool; ~/.unbidden and .unbidden/ stay'],
    ['prepare', 'copy a repository apart, read its stack and CI, build its image and run its own checks; say every block'],
    ['init', 'set up unbidden in this repository'],
    ['setup', 'guided configuration: found, model access, permissions; more by name'],
    ['scan', "run the repository's own checks in the sandbox and record opportunities"],
    ['map', 'discover the system and show what is known, how, and what cannot be seen'],
    ['status', 'what unbidden knows and is doing'],
    ['connections', "the project's resources: found, granted, connected, and what each allows"],
    ['approve-writes', 'let Unbidden change one granted connection for a while'],
    ['activity', 'what was found, decided and why, built, proved, spent and learned'],
    ['errors', "what the project's logs said: recurring errors, new after a deploy, 5xx"],
    ['decide', 'what the Director would do with each open opportunity, without doing it'],
    ['health', 'errors and latency of each service against its baseline, and where trouble starts'],
    ['inbox', 'opportunities, most proven first'],
    ['try', 'run an experiment on one opportunity now'],
    ['watch', 'keep working in the foreground of this terminal'],
    ['start', 'run the agent in the background (log in .unbidden/logs/agent.log)'],
    ['stop', 'end the background agent cleanly; the kill switch is not touched'],
    ['approve', 'allow the pull request of a proven opportunity'],
    ['review', 'read each waiting proposal and approve, reject or skip it'],
    ['mode', 'show or set autonomy: supervised, autopilot or autonomous'],
    ['deploy', "deploy a local commit or branch with the mandate's steps"],
    ['drill', 'prove rollback works before autonomy relies on it'],
    ['hold', 'list holds, or release one (people only)'],
    ['deploys', 'every deploy seen, the code it ran and how that is known'],
    ['doctor', 'check the machine, local model, Docker, Meta API, GitHub and mandate'],
    ['models', 'show or set the model profile: local, local-first or frontier'],
    ['route', 'which model serves each task here, and why (dry)'],
    ['spend', 'remote model spend on this machine against the verified credit balance'],
    ['egress', 'everything that left this machine, with the exact payloads'],
    ['probe', 'look for crashes with property-based tests, run offline'],
    ['investigate', 'explain a failure between two versions, read-only'],
    ['forge', 'capabilities unbidden built for itself: list, build or approve'],
    ['logs', 'real traffic of a service, read with a capability forge built'],
    ['reject', 'decline an opportunity for good'],
    ['why', 'decisions, verdicts and every outbound payload behind an opportunity'],
    ['show', 'one opportunity with its full history'],
    ['ui', "open or reuse the project's dashboard (reads the state; starts no job)"],
    ['app', "the full-screen app: the agent's work as it happens, a prompt"],
    ['chat', "the dashboard's chat from the terminal: inform, analyze; never act"],
    ['kill', 'freeze everything now, in every process, until `unbidden resume`'],
    ['resume', 'release the kill switch'],
  ] as [string, string][],
}

// unbidden/tui/text.py:34-71 — the app's slash commands
export const SLASH = [
  ['/start [--ui] [--force]', 'run the agent in the background; --ui serves the dashboard'],
  ['/stop', 'stop the agent cleanly; nothing stays frozen'],
  ['/kill [reason]', 'engage the kill switch: nothing runs or leaves until /resume'],
  ['/resume', 'release the kill switch'],
  ['/inbox [--all]', 'open opportunities, most proven first'],
  ['/why <id>', 'every decision, verdict and outbound payload behind one opportunity'],
  ['/approve <id> [--hours N]', 'let the pull request for this opportunity open'],
  ['/reject <id> <reason>', 'close this opportunity with your reason'],
  ['/activity', 'found, decided, checked, asked, proven, spent'],
  ['/spend', "the machine's spend ledger and its cap"],
  ['/doctor', 'what this machine provides, required or optional for your option'],
  ['/ui [--open]', 'open or reuse the dashboard in the browser'],
  ['/setup [section|--all]', 'found, model access, permissions; more by name'],
  ['/language [en|es]', 'the language Unbidden speaks to you; saved on this machine'],
  ['/log', "show or hide the agent's log"],
  ['/verbose', 'show or hide every allowed egress and model call'],
  ['/clear', 'clear the feed'],
  ['/quit', 'leave; the agent keeps running'],
] as [string, string][]
// unbidden/tui/text.py:124, 129-132
export const PROMPT_PLACEHOLDER = 'Ask about the project, or / for a command'
export const KEYS = 'Ctrl+C cancels a running answer, clears the prompt, or asks twice to quit. Quitting stops no agent. Esc closes a panel. Ctrl+L clears the feed. PageUp and PageDown scroll it.'

// docs/RELEASE.md:279-295 — the mandate example, verbatim
export const MANDATE_YAML = `mandate:
  workspace: shop
  priorities: [correctness, performance of reads as data grows]
  business_constraints: {maximum_monthly_spend_usd: 2.0}
  autonomy: {observe: allow, run_experiments: allow, provision_dependencies: allow, delegate_synthetic: allow,
             use_new_capabilities: allow, open_pull_requests: deny, merge_pull_requests: deny, deploy: deny,
             rollback: deny, act_on_connections: deny}
  egress: {package_registries: [pypi.org, files.pythonhosted.org],
           remote_models: {destinations: [api.meta.ai], max_payload_bytes: 60000}}
  models: {profile: frontier, local_fallback: deny, local_inference: deny}    # what the option \`api\` writes
  connections:
    - {id: shop-db, kind: postgres, location: 127.0.0.1:5432/shop, environment: staging, username: shop_reader,
       credential_ref: SHOP_READER_PW, permissions: [read]}
    - {id: shop-api, kind: http_api, location: http://127.0.0.1:8000, docs: http://127.0.0.1:8000/openapi.json,
       environment: staging, credential_ref: SHOP_API_KEY, permissions: [read]}`

// docs/RELEASE.md:114-117
export const PERMISSIONS = ['observe', 'run_experiments', 'provision_dependencies', 'use_new_capabilities', 'delegate_synthetic', 'open_pull_requests', 'merge_pull_requests', 'deploy', 'rollback', 'act_on_connections'] as const
export const PERMISSION_VALUES = ['allow', 'require_approval', 'deny'] as const

/**
 * The three modes, as README.md:92-98 describes them, and what each one documents about pull requests, merges,
 * deploys and rollbacks. Values the repository does not state are left as null and rendered as "—".
 */
export type Mode = 'supervised' | 'autopilot' | 'autonomous'
export const MODES: { id: Mode; readme: string; pr: string | null; merge: string | null; deploy: string | null; rollback: string | null }[] = [
  { id: 'supervised', readme: 'asks before a pull request; never merges or deploys', pr: 'require_approval', merge: 'deny', deploy: 'deny', rollback: null },
  { id: 'autopilot', readme: 'opens proven pull requests on its own; people merge', pr: 'allow', merge: 'deny', deploy: null, rollback: null },
  {
    id: 'autonomous',
    readme: "also merges L4 work, deploys with the team's steps, rolls back; refuses without `operations.deploy_steps` and a passed drill",
    pr: 'allow',
    merge: 'allow (L4 only)',
    deploy: 'allow (needs operations.deploy_steps + a passed drill)',
    rollback: 'allow',
  },
]
// README.md:100-104 — in every mode
export const EVERY_MODE = [
  'only L4 proposals are merged, pinned to the commit that was measured',
  'a merge waits until the previous deploy has been judged',
  'a rollback leaves a hold only a person can release (`unbidden hold release`)',
  '`unbidden kill` freezes everything in every process until `unbidden resume`',
]
// unbidden/cli.py:517-529 — what `unbidden mode` prints
export const MODE_OUTPUT = (mode: Mode, was?: Mode) => (was ? `mode: ${mode} (was ${was})` : `mode: ${mode}`)

// README.md:56-65 — the first commands, with the README's own comments
export const THEN = [
  ['cd your-repo', ''],
  ['unbidden', '# the app: the setup assistant the first time, then the live feed; --plain for text'],
  ['unbidden doctor', '# what works here, what is required for your option, what is optional'],
  ['unbidden start --ui', '# the agent in the background, serving the dashboard from its own process'],
  ['unbidden status', '# agent pid and log, dashboard URL, kill switch'],
  ['unbidden stop', '# ends the agent cleanly; `unbidden start` resumes interrupted jobs'],
] as [string, string][]
// README.md:39-49
export const INSTALL_LINE = 'curl -fsSL https://unbidden.cl/install.sh | sh'
export const VERSION_LINE = ['unbidden --version', '# unbidden 0.12.2'] as const

// cli-spinners "dots" frames (the CLI uses Rich's default status spinner); used for the active feed line
export const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
export const BLOCKS = ['░', '▒', '▓', '█'] // ░ ▒ ▓ █
export const GLYPHS = { empty: '□', half: '▨', full: '■', done: '▩' } // □ ▨ ■ ▩
