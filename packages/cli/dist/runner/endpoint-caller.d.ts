import type { BarkApiConfig } from '../config';
export interface CallResult {
    statusCode: number;
    body: any;
    error?: string;
}
export declare function callEndpoint(baseUrl: string, method: string, path: string, config: BarkApiConfig): Promise<CallResult>;
//# sourceMappingURL=endpoint-caller.d.ts.map