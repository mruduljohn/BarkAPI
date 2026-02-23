export interface ParsedEndpoint {
    method: string;
    path: string;
    responseSchema: Record<string, any> | null;
    statusCode: string;
}
export declare function parseOpenAPISpec(specPath: string): Promise<ParsedEndpoint[]>;
//# sourceMappingURL=openapi-parser.d.ts.map