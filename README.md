<div align="center">
  <img src="https://em-content.zobj.net/source/apple/391/dog-face_1f436.png" height="120" alt="BarkAPI Logo" />
  <h1>BarkAPI</h1>
  <p><strong>Your API's Watchdog.</strong></p>
  <p><em>Detect schema drift between your OpenAPI spec and live responses before production breaks.</em></p>
  
  <p>
    <a href="https://www.npmjs.com/package/barkapi"><img src="https://img.shields.io/npm/v/barkapi?style=for-the-badge&color=2563EB" alt="npm version" /></a>
    <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=for-the-badge&color=10B981" alt="Node.js >= 18" />
    <img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge&color=8B5CF6" alt="MIT License" />
    <img src="https://img.shields.io/badge/typescript-strict-blue?style=for-the-badge&color=3B82F6" alt="TypeScript" />
  </p>
</div>

---

> **BarkAPI** parses your OpenAPI spec, hits your live endpoints, compares response shapes, and reports mismatches. It acts like **ESLint for your API contracts**. Ships with a CLI for your terminal and CI pipelines, plus a real-time web dashboard with schema visualizations.

```
GET /api/users/:id
  ✗ .data.email       type changed: string → number    [breaking]
  ⚠ .data.avatar      new field not in spec             [warning]

GET /api/orders
  ✓ no drift detected

✗ 2 breaking  ⚠ 1 warning  ✓ 8 passing  (12 endpoints checked)
```

## ✨ Highlights & Features

- 🛠 **Zero-config setup** — Auto-detects your OpenAPI spec and project framework.
- 🔍 **Recursive schema diffing** — Catches type changes, missing fields, nullability shifts, and undocumented fields.
- 🚥 **Severity grading** — Categorized into `breaking`, `warning`, and `info` so you prioritize what matters.
- 🚀 **CI-friendly** — Exits with code `1` on breaking drift. Plug it directly into your pipelines.
- ⏱ **Watch mode** — Monitor endpoints continuously on an interval.
- 🖥 **Bento Dashboard** — One command (`barkapi dev`) starts watch mode + an amazing real-time dashboard.
- 📈 **Visualizations** — Interactive schema trees, endpoint health grids, timelines, and diff history.
- 🔔 **Alerting** — Configure Slack webhooks and email notifications on new schema drifts.
- 🗄 **Embedded SQLite** — No external DBs needed. Data stays local, fast, and secure.

<br/>

## 📖 Real-World Use Cases

### 🛠 1. Local Development (The "Dev Server")
> *For developers actively writing or consuming the API who need real-time feedback.*
- **Action**: Run `barkapi dev` while building your app alongside your backend web server.
- **Outcome**: A beautiful dashboard opens at `localhost:3100`. As you iteratively code, if you accidentally rename `email` to `emailAddress` in your JSON payload without updating the spec, the dashboard instantly flashes red for a `breaking` drift. You catch the contract breach before even committing code.

### 🛑 2. Continuous Integration (The "Pipeline Gatekeeper")
> *For engineering leaders wanting to prevent breaking API changes from reaching production.*
- **Action**: Use `barkapi ci-gen` to drop a GitHub Actions workflow into your repo that runs `barkapi check` against a staging deployment environment.
- **Outcome**: When a developer opens a Pull Request that introduces a database change, altering an API response scalar from `string` to `number`, BarkAPI throws a fatal error in CI and **exits with code 1**. The PR fails automatically, preventing mobile clients from crashing in the wild.

### 🚨 3. Background Monitoring & Alerts (The "Production Watchdog")
> *For SREs and teams watching third-party APIs or checking critical production/staging environments for unauthorized drift.*
- **Action**: Run `barkapi watch --interval 300` (every 5 mins) with Slack/email webhooks configured in `.barkapi.yml`.
- **Outcome**: A rogue raw-SQL migration quietly exposes a sensitive internal `password_hash` column to the `GET /users` endpoint. BarkAPI immediately catches the undocumented field addition, classifies it, and fires an alert to your `#engineering-alerts` Slack channel to contain the spillage.

### 🗂 4. Offline Schema Audits (The "Spec Compare")
> *For frontend engineers trying to understand exactly what changed in a massive updated `v2` OpenAPI spec delivery.*
- **Action**: Run `barkapi diff v1-openapi.yaml v2-openapi.yaml`.
- **Outcome**: Instead of scanning thousands of lines of raw YAML diffs, barkapi diff outputs exactly which fields were *added*, became *nullable*, or were *dropped*, letting you know where to update your TypeScript types.

<br/>

## 📦 Installation

```bash
npm install -g barkapi
```

### Prerequisites
- **Node.js >= 18**
- **Build tools** for SQLite (`better-sqlite3`):
  - macOS: `xcode-select --install`
  - Ubuntu/Debian: `sudo apt install build-essential python3`
  - Windows: Visual Studio Build Tools (C++ Workload)

<br/>

## 🚀 Quick Start

Launch the watchdog in just two commands:

```bash
# 1. Navigate to your API project
cd /path/to/your-api

# 2. Initialize (auto-detects spec + setups config)
barkapi init --spec openapi.yaml --base-url http://localhost:3000

# 3. Start dashboard + watch mode
barkapi dev
```
*The dashboard opens at `http://localhost:3100` and auto-refreshes every 3 seconds.*

<br/>

## ⌨️ CLI Commands

| Command | Description | Example / Options |
|---------|-------------|-------------------|
| `barkapi init` | Scans project, finds spec, generates `.barkapi.yml` | `--spec <path> --base-url <url>` |
| `barkapi dev` | 🔥 Starts interactive web dashboard + watch checks | `--interval <sec> --port <port>` |
| `barkapi check` | One-shot run. Prints ESLint-style report. Fails on breaking. | `--config <path>` |
| `barkapi watch` | Runs continuous checks based on intervals | `--interval <sec>` |
| `barkapi diff` | Compares two offline OpenAPI specs for diffs | `<old-spec> <new-spec> --json` |
| `barkapi ci-gen` | Generates GitHub Actions workflow CI files | `--base-url-var <var>` |

<br/>

## ⚙️ Configuration (`.barkapi.yml`)

BarkAPI uses a simple YAML config file in your project root. 

```yaml
project: my-api
spec: openapi.yaml
base_url: http://localhost:3000

# Optional: API authentication
auth:
  type: bearer              # bearer | header | query
  token_env: API_TOKEN      # reads from environment variable

# Optional: Path parameters for simulated requests
path_params:
  id: "1"

# Optional: Endpoint Filtering
endpoints:
  include:
    - /api/users
  exclude:
    - /api/internal
```

<br/>

## 🔬 Drift Detection Engine

BarkAPI performs strict structural diffing between standard OpenAPI JSON Schemas and observed JavaScript object trees.

| Drift Type | Severity | What it means |
|------------|----------|---------------|
| Removed required field | 🔴 `breaking` | A field your consumers depend on is gone |
| Type changed | 🔴 `breaking` | Field type shifted (e.g. `string` → `number`) |
| Nullable → non-null | 🔴 `breaking` | Consumers handling null will break |
| Required changed | 🔴 `breaking` | Required/optional status changed |
| Removed optional field | 🟡 `warning` | A field disappeared but wasn't explicitly required |
| Non-null → nullable | 🟡 `warning` | Field can now be null |
| Enum changed | 🟡 `warning` | Allowed enum values differ |
| Undocumented field | 🔵 `info` | Response has a field not listed in the spec |

<br/>

## 🖥 Dashboard Experience

The `barkapi dev` command launches a web dashboard at `http://localhost:3100` with real-time updates:

| Page | Route | Description |
|------|-------|-------------|
| **Projects** | `/` | Overview cards with health donut, labeled status dots, drift count |
| **Project Detail** | `/projects/:id` | Bento grid with health ring, passing/breaking/warning stats, drift type distribution, endpoint health map |
| **Endpoint Detail** | `/projects/:id/endpoints/:eid` | Three tabs — **Overview** (stats), **Schema** (annotated tree), **History** (drift list grouped by field) |
| **Timeline** | `/projects/:id/timeline` | Area/line/bar charts + check run cards with mini health rings |
| **Alerts** | `/projects/:id/alerts` | Configure Slack and email notifications with severity filters |

<br/>

## 🧪 Example Project

The `examples/` directory contains a complete demo with intentional drift to see how BarkAPI reacts:

```bash
# 1. Start the example API server (has intentional drift from spec)
cd examples
node server.js

# 2. In another terminal, run BarkAPI against it
cd examples
barkapi init --spec openapi.yaml --base-url http://localhost:4000
barkapi dev
```

The example server returns responses that intentionally differ from its OpenAPI spec:
- `GET /api/users/:id` — `email` is a number (spec says string), missing `created_at`, extra `avatar` field
- `GET /api/products/:id` — `price` is a string (spec says number)

<br/>

## 🤖 CI Integration

### GitHub Actions

```yaml
- name: Check API contracts
  run: |
    npx barkapi check --spec openapi.yaml --base-url ${{ vars.STAGING_URL }}
```

Or generate a workflow file automatically:

```bash
barkapi ci-gen --base-url-var vars.STAGING_URL
```

> 💡 The `check` command gracefully exits with code 1 on breaking drift, failing your pipeline automatically.

<br/>

## 🏗 Architecture & Stack

```text
BarkAPI/
├── packages/
│   ├── core/                   @barkapi/core — shared engine
│   │   └── src/
│   │       ├── parser/         OpenAPI parser + response schema inferrer
│   │       ├── diff/           Recursive schema differ + severity classifier
│   │       ├── db/             SQLite connection, schema migration, queries
│   │       └── models/         CRUD for projects, endpoints, runs, alerts
│   ├── cli/                    barkapi — the npm package
│   │   └── src/
│   │       ├── commands/       init, check, watch, dev, diff, ci-gen
│   │       ├── config/         .barkapi.yml loader + project detector
│   │       └── runner/         HTTP endpoint caller + check orchestrator
│   └── dashboard/              @barkapi/dashboard — Next.js web UI
│       └── app/
│           ├── api/            REST API routes (SSE, stats, schema)
│           └── projects/       Project pages (health map, detail, timeline)
├── examples/                   Demo project with intentional drift
│   ├── openapi.yaml            Sample OpenAPI spec
│   └── server.js               API server with mismatched responses
```

### ⚡️ Technologies

| Layer | Technology |
|-------|-----------|
| **CLI & Tools** | Commander.js, chalk, ora |
| **API Parsing** | `@apidevtools/swagger-parser` |
| **Database** | SQLite via `better-sqlite3` (WAL mode) |
| **Web UI** | Next.js 14, Tailwind CSS, Framer Motion |
| **Charts & Icons** | Recharts, Lucide React |

<br/>

## 🔨 Development

```bash
# Clone and install
git clone https://github.com/mruduljohn/BarkAPI.git
cd BarkAPI
npm install

# Build all packages
npm run build

# Build individual packages
npm run build:core
npm run build:cli
npm run build:dashboard

# Run dashboard in dev mode
npm run dev:dashboard
```

<br/>

## 📝 License

Released under the [MIT License](LICENSE).
