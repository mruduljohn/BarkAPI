"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDrift = createDrift;
exports.getDrift = getDrift;
exports.listDriftsByCheckRun = listDriftsByCheckRun;
exports.listDriftsByEndpoint = listDriftsByEndpoint;
exports.createDriftsBatch = createDriftsBatch;
const db_1 = require("../db");
function createDrift(checkRunId, endpointId, drift) {
    const db = (0, db_1.getDb)();
    const stmt = db.prepare(`INSERT INTO drifts (check_run_id, endpoint_id, field_path, drift_type, severity, expected, actual)
     VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const result = stmt.run(checkRunId, endpointId, drift.field_path, drift.drift_type, drift.severity, drift.expected || null, drift.actual || null);
    return getDrift(result.lastInsertRowid);
}
function getDrift(id) {
    const db = (0, db_1.getDb)();
    return db.prepare('SELECT * FROM drifts WHERE id = ?').get(id);
}
function listDriftsByCheckRun(checkRunId) {
    const db = (0, db_1.getDb)();
    return db.prepare('SELECT * FROM drifts WHERE check_run_id = ? ORDER BY severity, field_path').all(checkRunId);
}
function listDriftsByEndpoint(endpointId, limit = 100) {
    const db = (0, db_1.getDb)();
    return db.prepare('SELECT * FROM drifts WHERE endpoint_id = ? ORDER BY detected_at DESC LIMIT ?').all(endpointId, limit);
}
function createDriftsBatch(checkRunId, endpointId, drifts) {
    const db = (0, db_1.getDb)();
    const stmt = db.prepare(`INSERT INTO drifts (check_run_id, endpoint_id, field_path, drift_type, severity, expected, actual)
     VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const insertMany = db.transaction((items) => {
        for (const d of items) {
            stmt.run(checkRunId, endpointId, d.field_path, d.drift_type, d.severity, d.expected || null, d.actual || null);
        }
    });
    insertMany(drifts);
}
//# sourceMappingURL=drifts.js.map