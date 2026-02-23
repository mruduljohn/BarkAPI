import type { AlertConfig } from './types';
export declare function createAlertConfig(projectId: number, type: 'slack' | 'email', config: Record<string, any>, minSeverity?: 'breaking' | 'warning' | 'info'): AlertConfig;
export declare function getAlertConfig(id: number): AlertConfig | undefined;
export declare function listAlertConfigs(projectId: number): AlertConfig[];
export declare function updateAlertConfig(id: number, updates: Partial<Pick<AlertConfig, 'config' | 'min_severity' | 'enabled'>>): AlertConfig | undefined;
export declare function deleteAlertConfig(id: number): void;
//# sourceMappingURL=alert-configs.d.ts.map