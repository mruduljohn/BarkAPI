import {
  parseOpenAPISpec,
  inferSchema,
  diffSchemas,
  getDb,
  createProject,
  getProjectByName,
  createEndpoint,
  createCheckRun,
  finishCheckRun,
  createDriftsBatch,
  updateEndpointStatus,
  sendNotifications,
} from '@barkapi/core';
import type { DriftResult, ParsedEndpoint } from '@barkapi/core';
import type { BarkApiConfig } from '../config';
import { callEndpoint } from './endpoint-caller';
import path from 'path';

export interface EndpointCheckResult {
  method: string;
  path: string;
  drifts: DriftResult[];
  error?: string;
}

export interface CheckResult {
  projectName: string;
  checkRunId: number;
  endpoints: EndpointCheckResult[];
  totals: {
    total: number;
    passing: number;
    breaking: number;
    warning: number;
  };
}

export async function runCheck(config: BarkApiConfig, dbPath?: string): Promise<CheckResult> {
  // Ensure DB is initialized
  getDb(dbPath);

  // Ensure project exists in DB
  let project = getProjectByName(config.project);
  if (!project) {
    project = createProject(
      config.project,
      config.spec,
      config.base_url
    );
  }

  // Parse spec — support both local paths and URLs
  const isUrl = config.spec.startsWith('http://') || config.spec.startsWith('https://');
  const specPath = isUrl ? config.spec : path.resolve(process.cwd(), config.spec);
  const parsedEndpoints = await parseOpenAPISpec(specPath);

  // Filter endpoints if configured
  const filtered = filterEndpoints(parsedEndpoints, config);

  // Create check run
  const checkRun = createCheckRun(project.id);

  const results: EndpointCheckResult[] = [];
  let passing = 0;
  let breaking = 0;
  let warning = 0;

  for (const ep of filtered) {
    const endpoint = createEndpoint(project.id, ep.method, ep.path);

    const callResult = await callEndpoint(config.base_url, ep.method, ep.path, config);

    if (callResult.error || !callResult.body) {
      updateEndpointStatus(endpoint.id, 'error');
      results.push({
        method: ep.method,
        path: ep.path,
        drifts: [],
        error: callResult.error || 'No response body',
      });
      continue;
    }

    if (!ep.responseSchema) {
      updateEndpointStatus(endpoint.id, 'healthy');
      results.push({ method: ep.method, path: ep.path, drifts: [] });
      passing++;
      continue;
    }

    const actualSchema = inferSchema(callResult.body);
    const drifts = diffSchemas(ep.responseSchema, actualSchema);

    // Check response headers if spec defines them
    if (ep.responseHeaders && callResult.headers) {
      const headerDrifts = diffResponseHeaders(ep.responseHeaders, callResult.headers);
      drifts.push(...headerDrifts);
    }

    // Save drifts to DB
    if (drifts.length > 0) {
      createDriftsBatch(checkRun.id, endpoint.id, drifts);

      // Fire alert notifications (non-blocking)
      sendNotifications(project.id, {
        projectName: config.project,
        checkRunId: checkRun.id,
        endpointMethod: ep.method,
        endpointPath: ep.path,
        drifts,
      }).catch(() => {});
    }

    const hasBreaking = drifts.some(d => d.severity === 'breaking');
    const hasWarning = drifts.some(d => d.severity === 'warning');

    if (hasBreaking) {
      breaking++;
      updateEndpointStatus(endpoint.id, 'drifted');
    } else if (hasWarning) {
      warning++;
      updateEndpointStatus(endpoint.id, 'drifted');
    } else {
      passing++;
      updateEndpointStatus(endpoint.id, 'healthy');
    }

    results.push({ method: ep.method, path: ep.path, drifts });
  }

  // Finish check run
  finishCheckRun(checkRun.id, {
    total_endpoints: filtered.length,
    passing,
    breaking,
    warning,
  });

  return {
    projectName: config.project,
    checkRunId: checkRun.id,
    endpoints: results,
    totals: { total: filtered.length, passing, breaking, warning },
  };
}

function filterEndpoints(endpoints: ParsedEndpoint[], config: BarkApiConfig): ParsedEndpoint[] {
  if (!config.endpoints) return endpoints;

  let filtered = endpoints;

  if (config.endpoints.include?.length) {
    filtered = filtered.filter(ep =>
      config.endpoints!.include!.some(pattern => ep.path.includes(pattern))
    );
  }

  if (config.endpoints.exclude?.length) {
    filtered = filtered.filter(ep =>
      !config.endpoints!.exclude!.some(pattern => ep.path.includes(pattern))
    );
  }

  return filtered;
}

function diffResponseHeaders(
  specHeaders: Record<string, { required: boolean; schema?: Record<string, any> }>,
  actualHeaders: Record<string, string | string[] | undefined>
): DriftResult[] {
  const drifts: DriftResult[] = [];
  const lowerActual: Record<string, string> = {};
  for (const [k, v] of Object.entries(actualHeaders)) {
    if (v !== undefined) {
      lowerActual[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : v;
    }
  }

  for (const [name, spec] of Object.entries(specHeaders)) {
    const headerPath = `header.${name}`;
    if (!(name in lowerActual)) {
      drifts.push({
        field_path: headerPath,
        drift_type: 'removed',
        severity: spec.required ? 'breaking' : 'warning',
        expected: `present (${spec.required ? 'required' : 'optional'})`,
        actual: 'missing',
      });
    }
  }

  return drifts;
}
