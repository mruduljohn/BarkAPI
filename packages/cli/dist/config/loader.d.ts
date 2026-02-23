export interface BarkApiConfig {
    project: string;
    spec: string;
    base_url: string;
    auth?: {
        type: 'bearer' | 'header' | 'query';
        token_env?: string;
        header_name?: string;
        query_param?: string;
    };
    dashboard_url?: string;
    endpoints?: {
        include?: string[];
        exclude?: string[];
    };
}
export declare function findConfigFile(dir?: string): string | null;
export declare function loadConfig(configPath?: string): BarkApiConfig;
export declare function writeConfig(config: BarkApiConfig, dir?: string): string;
export declare function detectSpecFile(dir?: string): string | null;
export declare function detectProjectName(dir?: string): string;
//# sourceMappingURL=loader.d.ts.map