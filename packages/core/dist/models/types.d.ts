export interface Project {
    id: number;
    name: string;
    spec_path: string;
    base_url: string;
    created_at: string;
    updated_at: string;
}
export interface Endpoint {
    id: number;
    project_id: number;
    method: string;
    path: string;
    status: 'healthy' | 'drifted' | 'error';
    last_checked_at: string | null;
    created_at: string;
}
export interface CheckRun {
    id: number;
    project_id: number;
    started_at: string;
    finished_at: string | null;
    total_endpoints: number;
    passing: number;
    breaking: number;
    warning: number;
}
export interface Drift {
    id: number;
    check_run_id: number;
    endpoint_id: number;
    field_path: string;
    drift_type: string;
    severity: 'breaking' | 'warning' | 'info';
    expected: string | null;
    actual: string | null;
    detected_at: string;
}
export interface AlertConfig {
    id: number;
    project_id: number;
    type: 'slack' | 'email';
    config: string;
    min_severity: 'breaking' | 'warning' | 'info';
    enabled: number;
    created_at: string;
}
export type DriftType = 'removed' | 'type_changed' | 'nullability_changed' | 'required_changed' | 'added';
export type Severity = 'breaking' | 'warning' | 'info';
export interface DriftResult {
    field_path: string;
    drift_type: DriftType;
    severity: Severity;
    expected?: string;
    actual?: string;
}
//# sourceMappingURL=types.d.ts.map