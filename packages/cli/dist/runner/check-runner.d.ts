import type { DriftResult } from '@barkapi/core';
import type { BarkApiConfig } from '../config';
export interface EndpointCheckResult {
    method: string;
    path: string;
    drifts: DriftResult[];
    error?: string;
}
export interface CheckResult {
    projectName: string;
    checkRunId: number;
    endpoints: EndpointCheckResult[];
    totals: {
        total: number;
        passing: number;
        breaking: number;
        warning: number;
    };
}
export declare function runCheck(config: BarkApiConfig, dbPath?: string): Promise<CheckResult>;
//# sourceMappingURL=check-runner.d.ts.map