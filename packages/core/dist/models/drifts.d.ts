import type { Drift, DriftResult } from './types';
export declare function createDrift(checkRunId: number, endpointId: number, drift: DriftResult): Drift;
export declare function getDrift(id: number): Drift | undefined;
export declare function listDriftsByCheckRun(checkRunId: number): Drift[];
export declare function listDriftsByEndpoint(endpointId: number, limit?: number): Drift[];
export declare function createDriftsBatch(checkRunId: number, endpointId: number, drifts: DriftResult[]): void;
//# sourceMappingURL=drifts.d.ts.map