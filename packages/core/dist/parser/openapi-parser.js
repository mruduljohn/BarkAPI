"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOpenAPISpec = parseOpenAPISpec;
const swagger_parser_1 = __importDefault(require("@apidevtools/swagger-parser"));
async function parseOpenAPISpec(specPath) {
    const api = await swagger_parser_1.default.dereference(specPath);
    const endpoints = [];
    if (!api.paths)
        return endpoints;
    for (const [path, pathItem] of Object.entries(api.paths)) {
        if (!pathItem)
            continue;
        const methods = ['get', 'post', 'put', 'patch', 'delete'];
        for (const method of methods) {
            const operation = pathItem[method];
            if (!operation?.responses)
                continue;
            // Pick the success response (200, 201, or first 2xx)
            const successCode = findSuccessCode(operation.responses);
            if (!successCode)
                continue;
            const response = operation.responses[successCode];
            const schema = extractResponseSchema(response);
            endpoints.push({
                method: method.toUpperCase(),
                path,
                responseSchema: schema,
                statusCode: successCode,
            });
        }
    }
    return endpoints;
}
function findSuccessCode(responses) {
    if (responses['200'])
        return '200';
    if (responses['201'])
        return '201';
    for (const code of Object.keys(responses)) {
        if (code.startsWith('2'))
            return code;
    }
    return null;
}
function extractResponseSchema(response) {
    if (!response.content)
        return null;
    const jsonContent = response.content['application/json'];
    if (!jsonContent?.schema)
        return null;
    return jsonContent.schema;
}
//# sourceMappingURL=openapi-parser.js.map