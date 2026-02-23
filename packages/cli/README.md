# BarkAPI

**Your API's watchdog.** Detects schema drift between your OpenAPI spec and live API responses — before things break in production.

```
GET /api/users/:id
  ✗ .data.email       type changed: string → number    [breaking]
  ⚠ .data.avatar      new field not in spec             [warning]

GET /api/orders
  ✓ no drift detected

✗ 2 breaking  ⚠ 1 warning  ✓ 8 passing  (12 endpoints checked)
```

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

## Quick Start

```bash
# Navigate to your API project
cd /path/to/your-api

# Initialize — auto-detects your OpenAPI spec
barkapi init --spec openapi.yaml --base-url http://localhost:3000

# Run a one-time check
barkapi check

# Start dashboard + watch mode (opens browser automatically)
barkapi dev
```

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

### `barkapi check`

Parses your spec, calls each endpoint, diffs the response against the expected schema, and prints an ESLint-style report. Exits with code 1 on breaking drift — perfect for CI.

```bash
barkapi check [options]

Options:
  --config <path>     Path to .barkapi.yml
  --spec <path>       Override spec path
  --base-url <url>    Override base URL
```

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

Compares two OpenAPI spec versions and shows schema differences.

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

# Optional: path parameters
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

## Dashboard

The `barkapi dev` command launches a web dashboard at `http://localhost:3100` with:

- **Bento grid layout** — health ring, stat cards, drift distribution at a glance
- **Schema viewer** — interactive tree of your OpenAPI schema with drift annotations inline
- **Endpoint health map** — color-coded grid showing status of every endpoint
- **Drift history** — grouped by field path with side-by-side expected vs actual diffs
- **Timeline charts** — area charts showing drift trends over time
- **Breadcrumb navigation** — always know where you are
- **Alerting** — Slack webhook and email notifications
- **Real-time updates** — auto-refreshes every 3s, no manual refresh needed

## Drift Detection

| Drift Type | Severity | What it means |
|------------|----------|---------------|
| Removed required field | `breaking` | A required field is gone |
| Removed optional field | `warning` | An optional field disappeared |
| Type changed | `breaking` | Field type shifted (e.g. `string` → `number`) |
| Nullable → non-null | `breaking` | Consumers handling null will break |
| Non-null → nullable | `warning` | Field can now be null |
| Required changed | `breaking` | Required/optional status changed |
| Enum changed | `warning` | Allowed enum values differ |
| Format changed | `warning` | Field format differs |
| Undocumented field added | `info` | Response has a field not in the spec |

## CI Integration

```yaml
# GitHub Actions
- name: Check API contracts
  run: npx barkapi check --spec openapi.yaml --base-url ${{ vars.STAGING_URL }}
```

Or generate a workflow automatically: `barkapi ci-gen`

## License

MIT
