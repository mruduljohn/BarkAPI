"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckRun = createCheckRun;
exports.getCheckRun = getCheckRun;
exports.listCheckRuns = listCheckRuns;
exports.finishCheckRun = finishCheckRun;
const db_1 = require("../db");
function createCheckRun(projectId) {
    const db = (0, db_1.getDb)();
    const stmt = db.prepare('INSERT INTO check_runs (project_id) VALUES (?)');
    const result = stmt.run(projectId);
    return getCheckRun(result.lastInsertRowid);
}
function getCheckRun(id) {
    const db = (0, db_1.getDb)();
    return db.prepare('SELECT * FROM check_runs WHERE id = ?').get(id);
}
function listCheckRuns(projectId, limit = 50) {
    const db = (0, db_1.getDb)();
    return db.prepare('SELECT * FROM check_runs WHERE project_id = ? ORDER BY started_at DESC LIMIT ?').all(projectId, limit);
}
function finishCheckRun(id, counts) {
    const db = (0, db_1.getDb)();
    db.prepare(`UPDATE check_runs SET
      finished_at = datetime('now'),
      total_endpoints = ?,
      passing = ?,
      breaking = ?,
      warning = ?
    WHERE id = ?`).run(counts.total_endpoints, counts.passing, counts.breaking, counts.warning, id);
    return getCheckRun(id);
}
//# sourceMappingURL=check-runs.js.map