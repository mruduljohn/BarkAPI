<p align="center">
  <img src="https://em-content.zobj.net/source/apple/391/dog-face_1f436.png" width="80" />
</p>

<h1 align="center">BarkAPI</h1>

<p align="center">
  <strong>Your API's watchdog.</strong><br/>
  Detects schema drift between your OpenAPI spec and live API responses — before things break in production.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/barkapi"><img src="https://img.shields.io/npm/v/barkapi" alt="npm version" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node.js >= 18" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
  <img src="https://img.shields.io/badge/typescript-strict-blue" alt="TypeScript" />
</p>

---

**BarkAPI** parses your OpenAPI spec, hits your live endpoints, compares response shapes, and reports mismatches — like **ESLint for your API contracts**. Ships with a CLI for your terminal and CI pipelines, plus a real-time web dashboard with schema visualization and drift annotations.

```
GET /api/users/:id
  ✗ .data.email       type changed: string → number    [breaking]
  ⚠ .data.avatar      new field not in spec             [warning]

GET /api/orders
  ✓ no drift detected

✗ 2 breaking  ⚠ 1 warning  ✓ 8 passing  (12 endpoints checked)
```

---

## Features

- **Zero-config setup** — auto-detects your OpenAPI spec and project type
- **Recursive schema diffing** — catches type changes, missing fields, nullability shifts, and undocumented additions
- **Severity classification** — `breaking` / `warning` / `info` so you know what matters
- **CI-friendly** — exits with code 1 on breaking drift, plug it into any pipeline
- **Continuous watch mode** — monitor endpoints on an interval
- **`barkapi dev`** — one command starts watch mode + dashboard, auto-opens browser
- **Real-time dashboard** — bento grid layout, animated health rings, schema viewer with drift annotations
- **Schema visualization** — interactive tree rendering of your OpenAPI spec with inline drift markers
- **Alerting** — configure Slack webhook and email notifications
- **Spec diffing** — compare two versions of an OpenAPI spec offline
- **CI generation** — auto-generate GitHub Actions workflows
- **Embedded SQLite** — no external database to set up or maintain

---

## Install

```bash
npm install -g barkapi
```

### Prerequisites

- **Node.js >= 18**
- **Build tools** for native addon compilation (`better-sqlite3`):
  - macOS: `xcode-select --install`
  - Ubuntu/Debian: `sudo apt install build-essential python3`
  - Windows: install the "Desktop development with C++" workload from Visual Studio Build Tools

---

## Quick Start

```bash
# 1. Navigate to your API project
cd /path/to/your-api

# 2. Initialize — auto-detects your OpenAPI spec
barkapi init --spec openapi.yaml --base-url http://localhost:3000

# 3. Start dashboard + watch mode (opens browser automatically)
barkapi dev
```

That's it — two commands. The dashboard opens at `http://localhost:3100` and auto-refreshes every 3 seconds.

---

## Commands

### `barkapi init`

Scans your project for OpenAPI specs, detects project metadata, and generates a `.barkapi.yml` config file.

```bash
barkapi init [options]

Options:
  --spec <path>       Path to OpenAPI spec file
  --base-url <url>    Base URL for your API (default: http://localhost:3000)
  --name <name>       Project name (default: from package.json)
```

Auto-detects spec files at common paths: `openapi.yaml`, `swagger.json`, `docs/openapi.yml`, etc.

### `barkapi check`

Parses your spec, calls each endpoint, diffs the response against the expected schema, and prints an ESLint-style report.

```bash
barkapi check [options]

Options:
  --config <path>     Path to .barkapi.yml
  --spec <path>       Override spec path
  --base-url <url>    Override base URL
```

**Exit code 1** if any breaking drift is detected — perfect for CI gates.

### `barkapi dev`

The all-in-one development command. Starts the web dashboard and watch mode together. Auto-opens your browser.

```bash
barkapi dev [options]

Options:
  --config <path>        Path to .barkapi.yml
  --interval <seconds>   Check interval (default: 30)
  --port <port>          Dashboard port (default: 3100)
  --no-open              Don't auto-open browser
```

### `barkapi watch`

Runs checks continuously on an interval.

```bash
barkapi watch [options]

Options:
  --config <path>        Path to .barkapi.yml
  --interval <seconds>   Check interval (default: 30)
```

### `barkapi diff`

Compares two OpenAPI spec versions and shows schema differences between them.

```bash
barkapi diff <old-spec> <new-spec> [options]

Options:
  --json    Output as JSON
```

### `barkapi ci-gen`

Generates a GitHub Actions workflow file for automated contract checking.

```bash
barkapi ci-gen [options]

Options:
  --config <path>              Path to .barkapi.yml
  --base-url-var <var>         GitHub Actions variable name (default: vars.STAGING_URL)
  --output <path>              Output path (default: .github/workflows/barkapi.yml)
```

### `barkapi report`

Runs a check and prints results.

```bash
barkapi report [options]

Options:
  --config <path>   Path to .barkapi.yml
```

---

## Configuration

BarkAPI uses a `.barkapi.yml` file in your project root:

```yaml
project: my-api
spec: openapi.yaml
base_url: http://localhost:3000

# Optional: API authentication
auth:
  type: bearer              # bearer | header | query
  token_env: API_TOKEN      # reads from environment variable

# Optional: path parameters for parameterized endpoints
path_params:
  id: "1"

# Optional: filter which endpoints to check
endpoints:
  include:
    - /api/users
    - /api/orders
  exclude:
    - /api/internal
```

### Auth Types

| Type | Description | Config |
|------|------------|--------|
| `bearer` | `Authorization: Bearer <token>` header | `token_env`: env var name |
| `header` | Custom header | `token_env` + `header_name` |
| `query` | Query parameter | `token_env` + `query_param` |

---

## Drift Detection

The diff engine performs recursive structural comparison between your OpenAPI spec schemas and actual API response shapes.

| Drift Type | Severity | What it means |
|------------|----------|---------------|
| Removed required field | `breaking` | A field your consumers depend on is gone |
| Removed optional field | `warning` | A field disappeared but wasn't required |
| Type changed | `breaking` | Field type shifted (e.g. `string` → `number`) |
| Nullable → non-null | `breaking` | Consumers handling null will break |
| Non-null → nullable | `warning` | Field can now be null |
| Required changed | `breaking` | Required/optional status changed |
| Enum changed | `warning` | Allowed enum values differ |
| Format changed | `warning` | Field format differs (e.g. `date-time` missing) |
| Undocumented field added | `info` | Response has a field not in the spec |

---

## Dashboard

The `barkapi dev` command launches a web dashboard at `http://localhost:3100` with:

- **Bento grid layout** — health ring, stat cards, drift distribution at a glance
- **Schema viewer** — interactive tree of your OpenAPI schema with drift annotations inline
- **Endpoint health map** — color-coded grid showing status of every endpoint
- **Drift history** — grouped by field path with side-by-side expected vs actual diffs
- **Timeline charts** — area charts showing drift trends over time
- **Breadcrumb navigation** — always know where you are: `Projects > My API > GET /users/{id}`
- **Alerting** — configure Slack webhook and email notifications
- **Real-time updates** — auto-refreshes every 3s via shared SQLite database

### Dashboard Pages

| Page | Route | Description |
|------|-------|-------------|
| **Projects** | `/` | Overview cards with health donut, labeled status dots, drift count |
| **Project Detail** | `/projects/:id` | Bento grid with health ring, passing/breaking/warning stats, drift type distribution, endpoint health map |
| **Endpoint Detail** | `/projects/:id/endpoints/:eid` | Three tabs — **Overview** (stats), **Schema** (annotated tree), **History** (drift list grouped by field) |
| **Timeline** | `/projects/:id/timeline` | Area/line/bar charts + check run cards with mini health rings |
| **Alerts** | `/projects/:id/alerts` | Configure Slack and email notifications with severity filters |

---

## Example Project

The [`examples/`](https://github.com/mruduljohn/BarkAPI/tree/main/examples) directory contains a complete demo with intentional drift:

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

---

## CI Integration

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

The `check` command exits with code 1 on breaking drift, failing your pipeline automatically.

---

## Architecture

```
BarkAPI/
├── packages/
│   ├── core/                   @barkapi/core — shared engine
│   │   └── src/
│   │       ├── parser/         OpenAPI parser + response schema inferrer
│   │       ├── diff/           Recursive schema differ + severity classifier
│   │       ├── db/             SQLite connection, schema migration, queries
│   │       └── models/         CRUD for projects, endpoints, check runs, drifts, alerts
│   ├── cli/                    barkapi — the npm package
│   │   └── src/
│   │       ├── commands/       init, check, watch, report, dev, diff, ci-gen
│   │       ├── config/         .barkapi.yml loader + project detector
│   │       ├── runner/         HTTP endpoint caller + check orchestrator
│   │       └── output/         ESLint-style chalk formatter
│   └── dashboard/              @barkapi/dashboard — Next.js web UI
│       └── app/
│           ├── api/            REST API routes (projects, endpoints, stats, schema, SSE)
│           ├── components/     UI primitives, schema viewer, health ring, breadcrumbs
│           ├── hooks/          usePolling, useSSE (real-time data fetching)
│           └── projects/       Project pages (health map, detail, timeline, alerts)
├── examples/                   Demo project with intentional drift
│   ├── openapi.yaml            Sample OpenAPI spec
│   ├── server.js               API server with mismatched responses
│   └── .barkapi.yml            Pre-configured BarkAPI config
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict) |
| CLI framework | Commander.js |
| Terminal UI | chalk + ora |
| API parsing | @apidevtools/swagger-parser |
| Database | SQLite via better-sqlite3 (WAL mode) |
| Web framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS (dark mode) |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Monorepo | npm workspaces |

---

## License

MIT
