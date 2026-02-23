/**
 * Merge two inferred schemas to capture the union of all fields.
 * Used when inferring schema from multiple array items.
 */
function mergeSchemas(a: Record<string, any>, b: Record<string, any>): Record<string, any> {
  if (a.type !== b.type) {
    // Different types — return the first (most common case wins)
    return a;
  }

  if (a.type === 'object' && b.type === 'object') {
    const mergedProps: Record<string, any> = { ...a.properties };
    const bProps: Record<string, any> = b.properties || {};
    for (const key of Object.keys(bProps)) {
      if (key in mergedProps) {
        mergedProps[key] = mergeSchemas(mergedProps[key], bProps[key]);
      } else {
        mergedProps[key] = bProps[key];
      }
    }
    // required = intersection (only fields present in ALL items)
    const aReq = new Set<string>(a.required || []);
    const bReq = new Set<string>(b.required || []);
    const required = [...aReq].filter(k => bReq.has(k));
    return {
      type: 'object',
      properties: mergedProps,
      required: required.length > 0 ? required : undefined,
    };
  }

  if (a.type === 'array' && b.type === 'array' && a.items && b.items) {
    return { type: 'array', items: mergeSchemas(a.items, b.items) };
  }

  return a;
}

/**
 * Infers a JSON Schema from an actual JSON response value.
 * Used to compare against the spec's expected schema.
 */
export function inferSchema(value: any): Record<string, any> {
  if (value === null) {
    return { type: 'null' };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: 'array', items: {} };
    }
    // Merge schemas from all items to capture the full shape
    const merged = value.reduce((acc: Record<string, any>, item: any) => mergeSchemas(acc, inferSchema(item)), inferSchema(value[0]));
    return {
      type: 'array',
      items: merged,
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
      const properties: Record<string, any> = {};
      const required: string[] = [];

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
