import type { DriftResult } from '../models/types';
/**
 * Recursively compares an expected (spec) schema against an actual (inferred) schema.
 * Returns a list of drift results with severity classifications.
 */
export declare function diffSchemas(expected: Record<string, any>, actual: Record<string, any>, path?: string): DriftResult[];
//# sourceMappingURL=schema-differ.d.ts.map