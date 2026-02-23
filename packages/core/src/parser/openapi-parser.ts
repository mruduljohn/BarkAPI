import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPI, OpenAPIV3 } from 'openapi-types';

export interface ParsedEndpoint {
  method: string;
  path: string;
  responseSchema: Record<string, any> | null;
  statusCode: string;
}

export async function parseOpenAPISpec(specPath: string): Promise<ParsedEndpoint[]> {
  const api = await SwaggerParser.dereference(specPath) as OpenAPIV3.Document;
  const endpoints: ParsedEndpoint[] = [];

  if (!api.paths) return endpoints;

  for (const [path, pathItem] of Object.entries(api.paths)) {
    if (!pathItem) continue;

    const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
    for (const method of methods) {
      const operation = (pathItem as any)[method] as OpenAPIV3.OperationObject | undefined;
      if (!operation?.responses) continue;

      // Pick the success response (200, 201, or first 2xx)
      const successCode = findSuccessCode(operation.responses);
      if (!successCode) continue;

      const response = operation.responses[successCode] as OpenAPIV3.ResponseObject;
      const schema = extractResponseSchema(response);

      endpoints.push({
        method: method.toUpperCase(),
        path,
        responseSchema: schema,
        statusCode: successCode,
      });
    }
  }

  return endpoints;
}

function findSuccessCode(responses: OpenAPIV3.ResponsesObject): string | null {
  if (responses['200']) return '200';
  if (responses['201']) return '201';
  for (const code of Object.keys(responses)) {
    if (code.startsWith('2')) return code;
  }
  return null;
}

function extractResponseSchema(response: OpenAPIV3.ResponseObject): Record<string, any> | null {
  if (!response.content) return null;

  const jsonContent = response.content['application/json'];
  if (!jsonContent?.schema) return null;

  return jsonContent.schema as Record<string, any>;
}
