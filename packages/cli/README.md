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

- **Endpoint health map** — color-coded green/yellow/red grid
- **Drift history timeline** — area chart showing drift trends over time
- **Side-by-side JSON diffs** — expected vs actual for each drifted field
- **Alerting** — configure Slack webhook and email notifications

The dashboard auto-refreshes every 3 seconds via a shared SQLite database. No manual pushing required.

## CI Integration

```yaml
# GitHub Actions example
- name: Check API contracts
  run: |
    npx barkapi check --spec openapi.yaml --base-url ${{ vars.STAGING_URL }}
```

The `check` command exits with code 1 on breaking drift, failing your pipeline automatically.

## License

MIT
