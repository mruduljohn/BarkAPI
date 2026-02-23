import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPI, OpenAPIV3 } from 'openapi-types';

export interface ParsedEndpoint {
  method: string;
  path: string;
  responseSchema: Record<string, any> | null;
  requestBodySchema: Record<string, any> | null;
  responseHeaders: Record<string, { required: boolean; schema?: Record<string, any> }> | null;
  statusCode: string;
}

export async function parseOpenAPISpec(specPathOrUrl: string): Promise<ParsedEndpoint[]> {
  // SwaggerParser.dereference supports both file paths and URLs natively
  const api = await SwaggerParser.dereference(specPathOrUrl) as OpenAPIV3.Document;
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
      const requestBody = extractRequestBodySchema(operation);
      const responseHeaders = extractResponseHeaders(response);

      endpoints.push({
        method: method.toUpperCase(),
        path,
        responseSchema: schema,
        requestBodySchema: requestBody,
        responseHeaders,
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

function extractResponseHeaders(
  response: OpenAPIV3.ResponseObject
): Record<string, { required: boolean; schema?: Record<string, any> }> | null {
  if (!response.headers) return null;
  const headers: Record<string, { required: boolean; schema?: Record<string, any> }> = {};
  for (const [name, headerObj] of Object.entries(response.headers)) {
    const header = headerObj as OpenAPIV3.HeaderObject;
    headers[name.toLowerCase()] = {
      required: header.required ?? false,
      schema: header.schema as Record<string, any> | undefined,
    };
  }
  return Object.keys(headers).length > 0 ? headers : null;
}

function extractRequestBodySchema(operation: OpenAPIV3.OperationObject): Record<string, any> | null {
  if (!operation.requestBody) return null;
  const body = operation.requestBody as OpenAPIV3.RequestBodyObject;
  if (!body.content) return null;
  const jsonContent = body.content['application/json'];
  if (!jsonContent?.schema) return null;
  return jsonContent.schema as Record<string, any>;
}

function extractResponseSchema(response: OpenAPIV3.ResponseObject): Record<string, any> | null {
  if (!response.content) return null;

  const jsonContent = response.content['application/json'];
  if (!jsonContent?.schema) return null;

  return jsonContent.schema as Record<string, any>;
}
