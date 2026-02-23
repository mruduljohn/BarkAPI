"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = exports.getDefaultDbPath = exports.closeDb = exports.getDb = void 0;
var connection_1 = require("./connection");
Object.defineProperty(exports, "getDb", { enumerable: true, get: function () { return connection_1.getDb; } });
Object.defineProperty(exports, "closeDb", { enumerable: true, get: function () { return connection_1.closeDb; } });
Object.defineProperty(exports, "getDefaultDbPath", { enumerable: true, get: function () { return connection_1.getDefaultDbPath; } });
var schema_1 = require("./schema");
Object.defineProperty(exports, "migrate", { enumerable: true, get: function () { return schema_1.migrate; } });
//# sourceMappingURL=index.js.map