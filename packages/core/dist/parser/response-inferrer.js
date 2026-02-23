"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferSchema = inferSchema;
/**
 * Infers a JSON Schema from an actual JSON response value.
 * Used to compare against the spec's expected schema.
 */
function inferSchema(value) {
    if (value === null) {
        return { type: 'null' };
    }
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return { type: 'array', items: {} };
        }
        return {
            type: 'array',
            items: inferSchema(value[0]),
        };
    }
    switch (typeof value) {
        case 'string':
            return { type: 'string' };
        case 'number':
            return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
        case 'boolean':
            return { type: 'boolean' };
        case 'object': {
            const properties = {};
            const required = [];
            for (const [key, val] of Object.entries(value)) {
                properties[key] = inferSchema(val);
                if (val !== null && val !== undefined) {
                    required.push(key);
                }
            }
            return {
                type: 'object',
                properties,
                required: required.length > 0 ? required : undefined,
            };
        }
        default:
            return {};
    }
}
//# sourceMappingURL=response-inferrer.js.map