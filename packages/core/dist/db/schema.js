"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = migrate;
function migrate(db) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      spec_path TEXT NOT NULL,
      base_url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS endpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'healthy' CHECK(status IN ('healthy', 'drifted', 'error')),
      last_checked_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(project_id, method, path)
    );

    CREATE TABLE IF NOT EXISTS check_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      finished_at TEXT,
      total_endpoints INTEGER NOT NULL DEFAULT 0,
      passing INTEGER NOT NULL DEFAULT 0,
      breaking INTEGER NOT NULL DEFAULT 0,
      warning INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS drifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      check_run_id INTEGER NOT NULL REFERENCES check_runs(id) ON DELETE CASCADE,
      endpoint_id INTEGER NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
      field_path TEXT NOT NULL,
      drift_type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('breaking', 'warning', 'info')),
      expected TEXT,
      actual TEXT,
      detected_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alert_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('slack', 'email')),
      config TEXT NOT NULL DEFAULT '{}',
      min_severity TEXT NOT NULL DEFAULT 'breaking' CHECK(min_severity IN ('breaking', 'warning', 'info')),
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_endpoints_project ON endpoints(project_id);
    CREATE INDEX IF NOT EXISTS idx_check_runs_project ON check_runs(project_id);
    CREATE INDEX IF NOT EXISTS idx_drifts_check_run ON drifts(check_run_id);
    CREATE INDEX IF NOT EXISTS idx_drifts_endpoint ON drifts(endpoint_id);
    CREATE INDEX IF NOT EXISTS idx_alert_configs_project ON alert_configs(project_id);
  `);
}
//# sourceMappingURL=schema.js.map