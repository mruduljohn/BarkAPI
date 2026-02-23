import http from 'http';
import https from 'https';
import { URL } from 'url';
import type { BarkApiConfig } from '../config';

export interface CallResult {
  statusCode: number;
  body: any;
  error?: string;
}

export async function callEndpoint(
  baseUrl: string,
  method: string,
  path: string,
  config: BarkApiConfig
): Promise<CallResult> {
  const url = new URL(resolvePath(path), baseUrl);

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

  return new Promise((resolve) => {
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(url, { method, headers, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const body = JSON.parse(data);
          resolve({ statusCode: res.statusCode || 0, body });
        } catch {
          resolve({ statusCode: res.statusCode || 0, body: null, error: 'Invalid JSON response' });
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

/** Replace path params like {id} or :id with example values */
function resolvePath(p: string): string {
  return p
    .replace(/\{([^}]+)\}/g, '1')
    .replace(/:([a-zA-Z_]+)/g, '1');
}
