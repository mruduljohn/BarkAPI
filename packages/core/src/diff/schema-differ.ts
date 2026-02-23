import type { DriftResult, DriftType, Severity } from '../models/types';

/**
 * Recursively compares an expected (spec) schema against an actual (inferred) schema.
 * Returns a list of drift results with severity classifications.
 */
export function diffSchemas(
  expected: Record<string, any>,
  actual: Record<string, any>,
  path = ''
): DriftResult[] {
  const drifts: DriftResult[] = [];

  const expType = normalizeType(expected);
  const actType = normalizeType(actual);

  // Type changed
  if (expType && actType && expType !== actType && actType !== 'null') {
    drifts.push({
      field_path: path || '.',
      drift_type: 'type_changed',
      severity: 'breaking',
      expected: expType,
      actual: actType,
    });
    return drifts; // No point comparing further if types differ
  }

  // Nullability changes
  const expNullable = isNullable(expected);
  const actNullable = isNullable(actual) || actType === 'null';
  if (expNullable !== actNullable) {
    drifts.push({
      field_path: path || '.',
      drift_type: 'nullability_changed',
      severity: !expNullable && actNullable ? 'warning' : 'breaking',
      expected: expNullable ? 'nullable' : 'non-null',
      actual: actNullable ? 'nullable' : 'non-null',
    });
  }

  // Object comparison
  if (expType === 'object' && actType === 'object') {
    const expProps = expected.properties || {};
    const actProps = actual.properties || {};
    const expRequired = new Set<string>(expected.required || []);

    // Check for removed fields (in spec but not in response)
    for (const key of Object.keys(expProps)) {
      const fieldPath = path ? `${path}.${key}` : key;
      if (!(key in actProps)) {
        drifts.push({
          field_path: fieldPath,
          drift_type: 'removed',
          severity: expRequired.has(key) ? 'breaking' : 'warning',
          expected: JSON.stringify(expProps[key]?.type || 'unknown'),
          actual: 'missing',
        });
      } else {
        // Recurse into matching fields
        drifts.push(...diffSchemas(expProps[key], actProps[key], fieldPath));
      }
    }

    // Check for added fields (in response but not in spec)
    for (const key of Object.keys(actProps)) {
      if (!(key in expProps)) {
        const fieldPath = path ? `${path}.${key}` : key;
        drifts.push({
          field_path: fieldPath,
          drift_type: 'added',
          severity: 'info',
          expected: 'not in spec',
          actual: actProps[key]?.type || 'unknown',
        });
      }
    }

    // Check required changes
    const actRequired = new Set<string>(actual.required || []);
    for (const key of Object.keys(expProps)) {
      if (key in actProps) {
        const wasOptional = !expRequired.has(key);
        const nowRequired = actRequired.has(key);
        if (wasOptional && nowRequired) {
          const fieldPath = path ? `${path}.${key}` : key;
          drifts.push({
            field_path: fieldPath,
            drift_type: 'required_changed',
            severity: 'breaking',
            expected: 'optional',
            actual: 'required',
          });
        }
      }
    }
  }

  // Array comparison
  if (expType === 'array' && actType === 'array') {
    if (expected.items && actual.items) {
      drifts.push(...diffSchemas(expected.items, actual.items, `${path}[]`));
    }
  }

  // Enum validation — check if actual value (from inferred schema) violates spec enum
  if (expected.enum && actual.enum) {
    const expValues = new Set(expected.enum.map(String));
    const newValues = actual.enum.filter((v: any) => !expValues.has(String(v)));
    const removedValues = expected.enum.filter((v: any) => !new Set(actual.enum.map(String)).has(String(v)));

    if (removedValues.length > 0) {
      drifts.push({
        field_path: path || '.',
        drift_type: 'enum_changed',
        severity: 'breaking',
        expected: `enum [${expected.enum.join(', ')}]`,
        actual: `removed values: [${removedValues.join(', ')}]`,
      });
    }
    if (newValues.length > 0) {
      drifts.push({
        field_path: path || '.',
        drift_type: 'enum_changed',
        severity: 'warning',
        expected: `enum [${expected.enum.join(', ')}]`,
        actual: `new values: [${newValues.join(', ')}]`,
      });
    }
  }

  // Format validation — check if format changed
  if (expected.format && actual.format && expected.format !== actual.format) {
    drifts.push({
      field_path: path || '.',
      drift_type: 'format_changed',
      severity: 'warning',
      expected: expected.format,
      actual: actual.format,
    });
  } else if (expected.format && !actual.format) {
    drifts.push({
      field_path: path || '.',
      drift_type: 'format_changed',
      severity: 'warning',
      expected: expected.format,
      actual: 'no format',
    });
  }

  return drifts;
}

function normalizeType(schema: Record<string, any>): string | null {
  if (!schema || !schema.type) return null;
  if (Array.isArray(schema.type)) {
    return schema.type.find((t: string) => t !== 'null') || schema.type[0];
  }
  return schema.type;
}

function isNullable(schema: Record<string, any>): boolean {
  if (!schema) return false;
  if (schema.nullable) return true;
  if (Array.isArray(schema.type) && schema.type.includes('null')) return true;
  return false;
}
