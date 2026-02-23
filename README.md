<p align="center">
  <img src="https://em-content.zobj.net/source/apple/391/dog-face_1f436.png" width="80" />
</p>

<h1 align="center">BarkAPI</h1>

<p align="center">
  <strong>Your API's watchdog.</strong><br/>
  Detects schema drift between your OpenAPI spec and live API responses — before things break in production.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node.js >= 18" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
  <img src="https://img.shields.io/badge/sqlite-embedded-orange" alt="SQLite" />
  <img src="https://img.shields.io/badge/typescript-strict-blue" alt="TypeScript" />
</p>

---

**BarkAPI** is a developer tool that parses your OpenAPI spec, hits your live endpoints, compares response shapes, and reports mismatches — like **ESLint for your API contracts**. Ships with a CLI for your terminal and CI pipelines, plus a dark-mode web dashboard for visualization and monitoring.

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
- **Web dashboard** — endpoint health map, drift history timeline, side-by-side JSON diffs
- **Alerting** — configure Slack webhook and email notifications
- **Embedded SQLite** — no external database to set up or maintain
- **Monorepo** — shared core engine, separate CLI and dashboard packages

---

## Quick Start

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Navigate to your API project and initialize
cd /path/to/your-api
npx barkapi init --spec openapi.yaml --base-url http://localhost:3000

# Run a drift check
npx barkapi check

# Push results to the dashboard
npx barkapi report --push
```

---

## CLI Reference

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

### `barkapi watch`

Runs checks continuously on an interval. Great for local development.

```bash
barkapi watch [options]

Options:
  --config <path>        Path to .barkapi.yml
  --interval <seconds>   Check interval (default: 30)
```

### `barkapi report`

Runs a check and optionally pushes results to the web dashboard.

```bash
barkapi report [options]

Options:
  --config <path>   Path to .barkapi.yml
  --push            Push results to dashboard
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

# Optional: dashboard URL for report --push
dashboard_url: http://localhost:3100

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
| Optional → required | `breaking` | New constraint on request/response |
| Undocumented field added | `info` | Response has a field not in the spec |

---

## Dashboard

The web dashboard runs on **port 3100** and provides a visual interface for monitoring drift across all your projects.

```bash
# Development
npm run dev:dashboard

# Production
npm run build:dashboard
npm run start -w packages/dashboard
```

### Pages

| Page | Route | Description |
|------|-------|-------------|
| **Projects** | `/` | Overview cards with health summary per project |
| **Health Map** | `/projects/:id` | Grid of endpoints, color-coded green/yellow/red |
| **Endpoint Detail** | `/projects/:id/endpoints/:eid` | Drift list with side-by-side expected vs actual |
| **Timeline** | `/projects/:id/timeline` | Area chart of drift over time + check run history |
| **Alerts** | `/projects/:id/alerts` | Configure Slack and email notifications |

The dashboard receives data from the CLI via `barkapi report --push`, which hits the `POST /api/check-runs` endpoint.

---

## Architecture

```
BarkAPI/
├── packages/
│   ├── core/                   @barkapi/core
│   │   └── src/
│   │       ├── parser/         OpenAPI parser + response schema inferrer
│   │       ├── diff/           Recursive schema differ + severity classifier
│   │       ├── db/             SQLite connection, schema migration, queries
│   │       └── models/         CRUD for projects, endpoints, check runs, drifts, alerts
│   ├── cli/                    @barkapi/cli
│   │   └── src/
│   │       ├── commands/       init, check, watch, report
│   │       ├── config/         .barkapi.yml loader + project detector
│   │       ├── runner/         HTTP endpoint caller + check orchestrator
│   │       └── output/         ESLint-style chalk formatter
│   └── dashboard/              @barkapi/dashboard
│       └── app/
│           ├── api/            REST API routes
│           ├── components/     Sidebar, Card, Badge, Button, Table, CodeBlock
│           ├── lib/            DB connection utilities
│           └── projects/       Project pages (health map, detail, timeline, alerts)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict) |
| CLI framework | Commander.js |
| Terminal UI | chalk + ora |
| API parsing | @apidevtools/swagger-parser |
| Database | SQLite via better-sqlite3 |
| Web framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS (dark mode) |
| Charts | Recharts |
| Icons | Lucide React |
| Monorepo | npm workspaces |

### Database Schema

Five tables with foreign keys and indexes:

- **`projects`** — name, spec_path, base_url, timestamps
- **`endpoints`** — method, path, status (healthy/drifted/error), unique per project
- **`check_runs`** — timestamps, passing/breaking/warning counts
- **`drifts`** — field_path, drift_type, severity, expected vs actual values
- **`alert_configs`** — type (slack/email), JSON config, min severity, enabled flag

---

## CI Integration

Add BarkAPI to your CI pipeline to catch contract drift before it reaches production:

```yaml
# GitHub Actions example
- name: Check API contracts
  run: |
    npx barkapi check --spec openapi.yaml --base-url ${{ vars.STAGING_URL }}
```

The `check` command exits with code 1 on breaking drift, failing your pipeline automatically.

---

## Development

```bash
# Clone and install
git clone <repo-url>
cd BarkAPI
npm install

# Build everything
npm run build

# Build individual packages
npm run build:core
npm run build:cli
npm run build:dashboard

# Run dashboard in dev mode
npm run dev:dashboard
```

---

## License

MIT
