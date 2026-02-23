import { getDb } from '../db';
import type { Drift, DriftResult } from './types';

export function createDrift(
  checkRunId: number,
  endpointId: number,
  drift: DriftResult
): Drift {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO drifts (check_run_id, endpoint_id, field_path, drift_type, severity, expected, actual)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    checkRunId,
    endpointId,
    drift.field_path,
    drift.drift_type,
    drift.severity,
    drift.expected || null,
    drift.actual || null
  );
  return getDrift(result.lastInsertRowid as number)!;
}

export function getDrift(id: number): Drift | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM drifts WHERE id = ?').get(id) as Drift | undefined;
}

export function listDriftsByCheckRun(checkRunId: number): Drift[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM drifts WHERE check_run_id = ? ORDER BY severity, field_path'
  ).all(checkRunId) as Drift[];
}

export function listDriftsByEndpoint(endpointId: number, limit = 100, offset = 0): Drift[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM drifts WHERE endpoint_id = ? ORDER BY detected_at DESC LIMIT ? OFFSET ?'
  ).all(endpointId, limit, offset) as Drift[];
}

export function countDriftsByEndpoint(endpointId: number): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM drifts WHERE endpoint_id = ?').get(endpointId) as { count: number };
  return row.count;
}

export function countDriftsByType(endpointId: number): Record<string, number> {
  const db = getDb();
  const rows = db.prepare(
    'SELECT drift_type, COUNT(*) as count FROM drifts WHERE endpoint_id = ? GROUP BY drift_type'
  ).all(endpointId) as { drift_type: string; count: number }[];
  const result: Record<string, number> = {};
  for (const row of rows) result[row.drift_type] = row.count;
  return result;
}

export function countDriftsBySeverity(endpointId: number): Record<string, number> {
  const db = getDb();
  const rows = db.prepare(
    'SELECT severity, COUNT(*) as count FROM drifts WHERE endpoint_id = ? GROUP BY severity'
  ).all(endpointId) as { severity: string; count: number }[];
  const result: Record<string, number> = {};
  for (const row of rows) result[row.severity] = row.count;
  return result;
}

export function countDriftsByTypeForProject(projectId: number): Record<string, number> {
  const db = getDb();
  const rows = db.prepare(
    `SELECT d.drift_type, COUNT(*) as count FROM drifts d
     JOIN endpoints e ON d.endpoint_id = e.id
     WHERE e.project_id = ? GROUP BY d.drift_type`
  ).all(projectId) as { drift_type: string; count: number }[];
  const result: Record<string, number> = {};
  for (const row of rows) result[row.drift_type] = row.count;
  return result;
}

export function countDriftsBySeverityForProject(projectId: number): Record<string, number> {
  const db = getDb();
  const rows = db.prepare(
    `SELECT d.severity, COUNT(*) as count FROM drifts d
     JOIN endpoints e ON d.endpoint_id = e.id
     WHERE e.project_id = ? GROUP BY d.severity`
  ).all(projectId) as { severity: string; count: number }[];
  const result: Record<string, number> = {};
  for (const row of rows) result[row.severity] = row.count;
  return result;
}

export function countTotalDriftsForProject(projectId: number): number {
  const db = getDb();
  const row = db.prepare(
    `SELECT COUNT(*) as count FROM drifts d
     JOIN endpoints e ON d.endpoint_id = e.id
     WHERE e.project_id = ?`
  ).get(projectId) as { count: number };
  return row.count;
}

export function createDriftsBatch(
  checkRunId: number,
  endpointId: number,
  drifts: DriftResult[]
): void {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO drifts (check_run_id, endpoint_id, field_path, drift_type, severity, expected, actual)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insertMany = db.transaction((items: DriftResult[]) => {
    for (const d of items) {
      stmt.run(checkRunId, endpointId, d.field_path, d.drift_type, d.severity, d.expected || null, d.actual || null);
    }
  });
  insertMany(drifts);
}
