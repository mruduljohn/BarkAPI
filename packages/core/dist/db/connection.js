"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.getDefaultDbPath = getDefaultDbPath;
exports.closeDb = closeDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const schema_1 = require("./schema");
let db = null;
function getDb(dbPath) {
    if (db)
        return db;
    const resolvedPath = dbPath || getDefaultDbPath();
    const dir = path_1.default.dirname(resolvedPath);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    db = new better_sqlite3_1.default(resolvedPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    (0, schema_1.migrate)(db);
    return db;
}
function getDefaultDbPath() {
    const dataDir = process.env.BARKAPI_DATA_DIR || path_1.default.join(process.cwd(), '.barkapi');
    return path_1.default.join(dataDir, 'barkapi.db');
}
function closeDb() {
    if (db) {
        db.close();
        db = null;
    }
}
//# sourceMappingURL=connection.js.map