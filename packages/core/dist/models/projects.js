"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProject = createProject;
exports.getProject = getProject;
exports.getProjectByName = getProjectByName;
exports.listProjects = listProjects;
exports.updateProject = updateProject;
exports.deleteProject = deleteProject;
const db_1 = require("../db");
function createProject(name, specPath, baseUrl) {
    const db = (0, db_1.getDb)();
    const stmt = db.prepare('INSERT INTO projects (name, spec_path, base_url) VALUES (?, ?, ?)');
    const result = stmt.run(name, specPath, baseUrl);
    return getProject(result.lastInsertRowid);
}
function getProject(id) {
    const db = (0, db_1.getDb)();
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}
function getProjectByName(name) {
    const db = (0, db_1.getDb)();
    return db.prepare('SELECT * FROM projects WHERE name = ?').get(name);
}
function listProjects() {
    const db = (0, db_1.getDb)();
    return db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
}
function updateProject(id, updates) {
    const db = (0, db_1.getDb)();
    const fields = [];
    const values = [];
    if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
    }
    if (updates.spec_path !== undefined) {
        fields.push('spec_path = ?');
        values.push(updates.spec_path);
    }
    if (updates.base_url !== undefined) {
        fields.push('base_url = ?');
        values.push(updates.base_url);
    }
    if (fields.length === 0)
        return getProject(id);
    fields.push("updated_at = datetime('now')");
    values.push(id);
    db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return getProject(id);
}
function deleteProject(id) {
    const db = (0, db_1.getDb)();
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}
//# sourceMappingURL=projects.js.map