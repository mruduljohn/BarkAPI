import { describe, it, expect } from 'vitest';
import { formatCheckResult } from '../output/formatter';
import type { CheckResult } from '../runner/check-runner';

describe('formatCheckResult', () => {
  it('formats a clean result with no drifts', () => {
    const result: CheckResult = {
      projectName: 'test-api',
      checkRunId: 1,
      endpoints: [
        { method: 'GET', path: '/api/users', drifts: [] },
      ],
      totals: { total: 1, passing: 1, breaking: 0, warning: 0 },
    };
    const output = formatCheckResult(result);
    expect(output).toContain('no drift detected');
    expect(output).toContain('1 passing');
  });

  it('formats breaking drift', () => {
    const result: CheckResult = {
      projectName: 'test-api',
      checkRunId: 1,
      endpoints: [
        {
          method: 'GET',
          path: '/api/users',
          drifts: [
            { field_path: 'email', drift_type: 'type_changed', severity: 'breaking', expected: 'string', actual: 'number' },
          ],
        },
      ],
      totals: { total: 1, passing: 0, breaking: 1, warning: 0 },
    };
    const output = formatCheckResult(result);
    expect(output).toContain('type changed');
    expect(output).toContain('1 breaking');
  });

  it('formats endpoint errors', () => {
    const result: CheckResult = {
      projectName: 'test-api',
      checkRunId: 1,
      endpoints: [
        { method: 'GET', path: '/api/health', drifts: [], error: 'Connection refused' },
      ],
      totals: { total: 1, passing: 0, breaking: 0, warning: 0 },
    };
    const output = formatCheckResult(result);
    expect(output).toContain('Connection refused');
  });

  it('formats multiple drift types', () => {
    const result: CheckResult = {
      projectName: 'test-api',
      checkRunId: 1,
      endpoints: [
        {
          method: 'POST',
          path: '/api/orders',
          drifts: [
            { field_path: 'status', drift_type: 'removed', severity: 'breaking', expected: '"string"', actual: 'missing' },
            { field_path: 'tracking_id', drift_type: 'added', severity: 'info', expected: 'not in spec', actual: 'string' },
          ],
        },
      ],
      totals: { total: 1, passing: 0, breaking: 1, warning: 0 },
    };
    const output = formatCheckResult(result);
    expect(output).toContain('field removed');
    expect(output).toContain('new field not in spec');
  });
});
