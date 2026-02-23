import { Command } from 'commander';
import chalk from 'chalk';
import { parseOpenAPISpec, diffSchemas } from '@barkapi/core';
import type { DriftResult } from '@barkapi/core';
import path from 'path';

export const diffCommand = new Command('diff')
  .description('Compare two OpenAPI spec versions and show schema differences')
  .argument('<old-spec>', 'Path to the old/base spec')
  .argument('<new-spec>', 'Path to the new/changed spec')
  .option('--json', 'Output as JSON')
  .action(async (oldSpecPath: string, newSpecPath: string, opts) => {
    const oldSpec = path.resolve(process.cwd(), oldSpecPath);
    const newSpec = path.resolve(process.cwd(), newSpecPath);

    let oldEndpoints, newEndpoints;
    try {
      oldEndpoints = await parseOpenAPISpec(oldSpec);
      newEndpoints = await parseOpenAPISpec(newSpec);
    } catch (err: any) {
      console.error(chalk.red(`Failed to parse spec: ${err.message}`));
      process.exit(1);
    }

    const oldMap = new Map(oldEndpoints.map(ep => [`${ep.method} ${ep.path}`, ep]));
    const newMap = new Map(newEndpoints.map(ep => [`${ep.method} ${ep.path}`, ep]));

    const allDiffs: Array<{
      method: string;
      path: string;
      status: 'added' | 'removed' | 'changed' | 'unchanged';
      drifts: DriftResult[];
    }> = [];

    // Check for removed endpoints
    for (const [key, ep] of oldMap) {
      if (!newMap.has(key)) {
        allDiffs.push({ method: ep.method, path: ep.path, status: 'removed', drifts: [] });
      }
    }

    // Check for added endpoints
    for (const [key, ep] of newMap) {
      if (!oldMap.has(key)) {
        allDiffs.push({ method: ep.method, path: ep.path, status: 'added', drifts: [] });
      }
    }

    // Check for changed endpoints
    for (const [key, oldEp] of oldMap) {
      const newEp = newMap.get(key);
      if (!newEp) continue;

      const drifts: DriftResult[] = [];

      // Diff response schemas
      if (oldEp.responseSchema && newEp.responseSchema) {
        drifts.push(...diffSchemas(oldEp.responseSchema, newEp.responseSchema));
      }

      // Diff request body schemas
      if (oldEp.requestBodySchema && newEp.requestBodySchema) {
        const bodyDrifts = diffSchemas(oldEp.requestBodySchema, newEp.requestBodySchema);
        for (const d of bodyDrifts) {
          d.field_path = `request.${d.field_path}`;
        }
        drifts.push(...bodyDrifts);
      } else if (oldEp.requestBodySchema && !newEp.requestBodySchema) {
        drifts.push({
          field_path: 'request',
          drift_type: 'removed',
          severity: 'breaking',
          expected: 'request body defined',
          actual: 'no request body',
        });
      } else if (!oldEp.requestBodySchema && newEp.requestBodySchema) {
        drifts.push({
          field_path: 'request',
          drift_type: 'added',
          severity: 'warning',
          expected: 'no request body',
          actual: 'request body added',
        });
      }

      allDiffs.push({
        method: oldEp.method,
        path: oldEp.path,
        status: drifts.length > 0 ? 'changed' : 'unchanged',
        drifts,
      });
    }

    if (opts.json) {
      console.log(JSON.stringify(allDiffs, null, 2));
      return;
    }

    // Human-readable output
    const changed = allDiffs.filter(d => d.status !== 'unchanged');
    if (changed.length === 0) {
      console.log(chalk.green('\nNo differences found between specs.\n'));
      return;
    }

    console.log(chalk.cyan.bold(`\nSpec Diff: ${oldSpecPath} → ${newSpecPath}\n`));

    for (const entry of allDiffs) {
      if (entry.status === 'unchanged') continue;

      const methodColor = getMethodColor(entry.method);
      const header = `${methodColor(entry.method)} ${chalk.white(entry.path)}`;

      if (entry.status === 'removed') {
        console.log(`${header}  ${chalk.red('REMOVED')}`);
      } else if (entry.status === 'added') {
        console.log(`${header}  ${chalk.green('ADDED')}`);
      } else {
        console.log(header);
        for (const drift of entry.drifts) {
          const icon = drift.severity === 'breaking' ? chalk.red('✗')
            : drift.severity === 'warning' ? chalk.yellow('⚠')
            : chalk.blue('ℹ');
          const severity = drift.severity === 'breaking' ? chalk.red(`[${drift.severity}]`)
            : drift.severity === 'warning' ? chalk.yellow(`[${drift.severity}]`)
            : chalk.blue(`[${drift.severity}]`);
          console.log(`  ${icon} ${chalk.gray(drift.field_path.padEnd(25))} ${drift.drift_type}: ${drift.expected} → ${drift.actual}  ${severity}`);
        }
      }
    }

    const breaking = allDiffs.reduce((n, d) => n + d.drifts.filter(dr => dr.severity === 'breaking').length, 0);
    const removed = allDiffs.filter(d => d.status === 'removed').length;
    console.log('');
    if (breaking > 0 || removed > 0) {
      console.log(chalk.red(`${breaking + removed} breaking change(s) detected`));
      process.exit(1);
    }
  });

function getMethodColor(method: string): (s: string) => string {
  switch (method.toUpperCase()) {
    case 'GET': return chalk.green;
    case 'POST': return chalk.blue;
    case 'PUT': return chalk.yellow;
    case 'PATCH': return chalk.magenta;
    case 'DELETE': return chalk.red;
    default: return chalk.white;
  }
}
