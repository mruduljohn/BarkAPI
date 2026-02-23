import http from 'http';
import https from 'https';
import { URL } from 'url';
import type { BarkApiConfig } from '../config';

export interface CallResult {
  statusCode: number;
  body: any;
  headers?: Record<string, string | string[] | undefined>;
  error?: string;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

export async function callEndpoint(
  baseUrl: string,
  method: string,
  path: string,
  config: BarkApiConfig
): Promise<CallResult> {
  const url = new URL(resolvePath(path, config.path_params), baseUrl);

  // Add query auth if configured
  if (config.auth?.type === 'query' && config.auth.query_param && config.auth.token_env) {
    const token = process.env[config.auth.token_env];
    if (token) {
      url.searchParams.set(config.auth.query_param, token);
    }
  }

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'barkapi/0.1.0',
  };

  // Add header auth
  if (config.auth?.type === 'bearer' && config.auth.token_env) {
    const token = process.env[config.auth.token_env];
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } else if (config.auth?.type === 'header' && config.auth.header_name && config.auth.token_env) {
    const token = process.env[config.auth.token_env];
    if (token) headers[config.auth.header_name] = token;
  }

  let lastResult: CallResult | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const result = await makeRequest(url, method, headers);
    lastResult = result;

    // Success or non-retryable error — return immediately
    if (!result.error && result.statusCode > 0 && result.statusCode < 500) {
      return result;
    }

    // Don't retry on 4xx (client errors are not transient)
    if (result.statusCode >= 400 && result.statusCode < 500) {
      return result;
    }

    // Wait with exponential backoff before retrying
    if (attempt < MAX_RETRIES - 1) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  return lastResult!;
}

function makeRequest(url: URL, method: string, headers: Record<string, string>): Promise<CallResult> {
  return new Promise((resolve) => {
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(url, { method, headers, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const responseHeaders = res.headers as Record<string, string | string[] | undefined>;
        try {
          const body = JSON.parse(data);
          resolve({ statusCode: res.statusCode || 0, body, headers: responseHeaders });
        } catch {
          resolve({ statusCode: res.statusCode || 0, body: null, headers: responseHeaders, error: 'Invalid JSON response' });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 0, body: null, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ statusCode: 0, body: null, error: 'Request timeout' });
    });

    req.end();
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Replace path params like {id} or :id with configured or default values */
function resolvePath(p: string, pathParams?: Record<string, string>): string {
  return p
    .replace(/\{([^}]+)\}/g, (_, name) => pathParams?.[name] ?? '1')
    .replace(/:([a-zA-Z_]+)/g, (_, name) => pathParams?.[name] ?? '1');
}
