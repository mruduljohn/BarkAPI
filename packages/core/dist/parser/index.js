"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferSchema = exports.parseOpenAPISpec = void 0;
var openapi_parser_1 = require("./openapi-parser");
Object.defineProperty(exports, "parseOpenAPISpec", { enumerable: true, get: function () { return openapi_parser_1.parseOpenAPISpec; } });
var response_inferrer_1 = require("./response-inferrer");
Object.defineProperty(exports, "inferSchema", { enumerable: true, get: function () { return response_inferrer_1.inferSchema; } });
//# sourceMappingURL=index.js.map