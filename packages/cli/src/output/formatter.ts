import chalk from 'chalk';
import type { CheckResult, EndpointCheckResult } from '../runner';
import type { DriftResult } from '@barkapi/core';

export function formatCheckResult(result: CheckResult): string {
  const lines: string[] = [];
  lines.push('');

  for (const ep of result.endpoints) {
    lines.push(formatEndpoint(ep));
  }

  lines.push('');
  lines.push(formatSummary(result));
  lines.push('');

  return lines.join('\n');
}

function formatEndpoint(ep: EndpointCheckResult): string {
  const lines: string[] = [];
  const methodColor = getMethodColor(ep.method);
  const header = `${methodColor(ep.method)} ${chalk.white(ep.path)}`;

  if (ep.error) {
    lines.push(header);
    lines.push(`  ${chalk.red('✗')} ${chalk.red(ep.error)}`);
    return lines.join('\n');
  }

  if (ep.drifts.length === 0) {
    lines.push(`${header}  ${chalk.green('✓ no drift detected')}`);
    return lines.join('\n');
  }

  lines.push(header);
  for (const drift of ep.drifts) {
    lines.push(formatDrift(drift));
  }

  return lines.join('\n');
}

function formatDrift(drift: DriftResult): string {
  const icon = drift.severity === 'breaking'
    ? chalk.red('✗')
    : drift.severity === 'warning'
    ? chalk.yellow('⚠')
    : chalk.blue('ℹ');

  const fieldPath = chalk.gray(drift.field_path.padEnd(25));
  const description = getDriftDescription(drift);
  const severity = drift.severity === 'breaking'
    ? chalk.red(`[${drift.severity}]`)
    : drift.severity === 'warning'
    ? chalk.yellow(`[${drift.severity}]`)
    : chalk.blue(`[${drift.severity}]`);

  return `  ${icon} ${fieldPath} ${description}  ${severity}`;
}

function getDriftDescription(drift: DriftResult): string {
  switch (drift.drift_type) {
    case 'type_changed':
      return `type changed: ${drift.expected} → ${drift.actual}`;
    case 'removed':
      return 'field removed from response';
    case 'added':
      return 'new field not in spec';
    case 'nullability_changed':
      return `nullability: ${drift.expected} → ${drift.actual}`;
    case 'required_changed':
      return `required changed: ${drift.expected} → ${drift.actual}`;
    default:
      return drift.drift_type;
  }
}

function formatSummary(result: CheckResult): string {
  const parts: string[] = [];
  if (result.totals.breaking > 0) {
    parts.push(chalk.red(`✗ ${result.totals.breaking} breaking`));
  }
  if (result.totals.warning > 0) {
    parts.push(chalk.yellow(`⚠ ${result.totals.warning} warning`));
  }
  parts.push(chalk.green(`✓ ${result.totals.passing} passing`));
  parts.push(chalk.gray(`(${result.totals.total} endpoints checked)`));

  return parts.join('  ');
}

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
