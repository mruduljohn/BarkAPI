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

export function listDriftsByEndpoint(endpointId: number, limit = 100): Drift[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM drifts WHERE endpoint_id = ? ORDER BY detected_at DESC LIMIT ?'
  ).all(endpointId, limit) as Drift[];
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
