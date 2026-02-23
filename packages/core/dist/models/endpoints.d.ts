import type { Endpoint } from './types';
export declare function createEndpoint(projectId: number, method: string, path: string): Endpoint;
export declare function getEndpoint(id: number): Endpoint | undefined;
export declare function listEndpoints(projectId: number): Endpoint[];
export declare function updateEndpointStatus(id: number, status: Endpoint['status']): void;
export declare function deleteEndpoint(id: number): void;
//# sourceMappingURL=endpoints.d.ts.map