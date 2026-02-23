import type { CheckRun } from './types';
export declare function createCheckRun(projectId: number): CheckRun;
export declare function getCheckRun(id: number): CheckRun | undefined;
export declare function listCheckRuns(projectId: number, limit?: number): CheckRun[];
export declare function finishCheckRun(id: number, counts: {
    total_endpoints: number;
    passing: number;
    breaking: number;
    warning: number;
}): CheckRun | undefined;
//# sourceMappingURL=check-runs.d.ts.map