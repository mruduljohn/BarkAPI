"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEndpoint = createEndpoint;
exports.getEndpoint = getEndpoint;
exports.listEndpoints = listEndpoints;
exports.updateEndpointStatus = updateEndpointStatus;
exports.deleteEndpoint = deleteEndpoint;
const db_1 = require("../db");
function createEndpoint(projectId, method, path) {
    const db = (0, db_1.getDb)();
    const stmt = db.prepare('INSERT OR IGNORE INTO endpoints (project_id, method, path) VALUES (?, ?, ?)');
    stmt.run(projectId, method.toUpperCase(), path);
    return db.prepare('SELECT * FROM endpoints WHERE project_id = ? AND method = ? AND path = ?').get(projectId, method.toUpperCase(), path);
}
function getEndpoint(id) {
    const db = (0, db_1.getDb)();
    return db.prepare('SELECT * FROM endpoints WHERE id = ?').get(id);
}
function listEndpoints(projectId) {
    const db = (0, db_1.getDb)();
    return db.prepare('SELECT * FROM endpoints WHERE project_id = ? ORDER BY path, method').all(projectId);
}
function updateEndpointStatus(id, status) {
    const db = (0, db_1.getDb)();
    db.prepare("UPDATE endpoints SET status = ?, last_checked_at = datetime('now') WHERE id = ?").run(status, id);
}
function deleteEndpoint(id) {
    const db = (0, db_1.getDb)();
    db.prepare('DELETE FROM endpoints WHERE id = ?').run(id);
}
//# sourceMappingURL=endpoints.js.map