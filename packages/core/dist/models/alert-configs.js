"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAlertConfig = createAlertConfig;
exports.getAlertConfig = getAlertConfig;
exports.listAlertConfigs = listAlertConfigs;
exports.updateAlertConfig = updateAlertConfig;
exports.deleteAlertConfig = deleteAlertConfig;
const db_1 = require("../db");
function createAlertConfig(projectId, type, config, minSeverity = 'breaking') {
    const db = (0, db_1.getDb)();
    const stmt = db.prepare('INSERT INTO alert_configs (project_id, type, config, min_severity) VALUES (?, ?, ?, ?)');
    const result = stmt.run(projectId, type, JSON.stringify(config), minSeverity);
    return getAlertConfig(result.lastInsertRowid);
}
function getAlertConfig(id) {
    const db = (0, db_1.getDb)();
    return db.prepare('SELECT * FROM alert_configs WHERE id = ?').get(id);
}
function listAlertConfigs(projectId) {
    const db = (0, db_1.getDb)();
    return db.prepare('SELECT * FROM alert_configs WHERE project_id = ? ORDER BY created_at DESC').all(projectId);
}
function updateAlertConfig(id, updates) {
    const db = (0, db_1.getDb)();
    const fields = [];
    const values = [];
    if (updates.config !== undefined) {
        fields.push('config = ?');
        values.push(updates.config);
    }
    if (updates.min_severity !== undefined) {
        fields.push('min_severity = ?');
        values.push(updates.min_severity);
    }
    if (updates.enabled !== undefined) {
        fields.push('enabled = ?');
        values.push(updates.enabled);
    }
    if (fields.length === 0)
        return getAlertConfig(id);
    values.push(id);
    db.prepare(`UPDATE alert_configs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return getAlertConfig(id);
}
function deleteAlertConfig(id) {
    const db = (0, db_1.getDb)();
    db.prepare('DELETE FROM alert_configs WHERE id = ?').run(id);
}
//# sourceMappingURL=alert-configs.js.map