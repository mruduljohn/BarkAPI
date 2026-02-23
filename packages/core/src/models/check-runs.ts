import { getDb } from '../db';
import type { CheckRun } from './types';

export function createCheckRun(projectId: number): CheckRun {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO check_runs (project_id) VALUES (?)');
  const result = stmt.run(projectId);
  return getCheckRun(result.lastInsertRowid as number)!;
}

export function getCheckRun(id: number): CheckRun | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM check_runs WHERE id = ?').get(id) as CheckRun | undefined;
}

export function listCheckRuns(projectId: number, limit = 50, offset = 0): CheckRun[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM check_runs WHERE project_id = ? ORDER BY started_at DESC LIMIT ? OFFSET ?'
  ).all(projectId, limit, offset) as CheckRun[];
}

export function countCheckRuns(projectId: number): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM check_runs WHERE project_id = ?').get(projectId) as { count: number };
  return row.count;
}

export function getLatestCheckRuns(projectId: number, count = 2): CheckRun[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM check_runs WHERE project_id = ? ORDER BY started_at DESC LIMIT ?'
  ).all(projectId, count) as CheckRun[];
}

export function getCheckRunStats(projectId: number): {
  total: number;
  avgDurationMs: number | null;
} {
  const db = getDb();
  const row = db.prepare(
    `SELECT COUNT(*) as total,
            AVG(CASE WHEN finished_at IS NOT NULL
                THEN (julianday(finished_at) - julianday(started_at)) * 86400000
                ELSE NULL END) as avg_duration_ms
     FROM check_runs WHERE project_id = ?`
  ).get(projectId) as { total: number; avg_duration_ms: number | null };
  return { total: row.total, avgDurationMs: row.avg_duration_ms };
}

export function finishCheckRun(
  id: number,
  counts: { total_endpoints: number; passing: number; breaking: number; warning: number }
): CheckRun | undefined {
  const db = getDb();
  db.prepare(
    `UPDATE check_runs SET
      finished_at = datetime('now'),
      total_endpoints = ?,
      passing = ?,
      breaking = ?,
      warning = ?
    WHERE id = ?`
  ).run(counts.total_endpoints, counts.passing, counts.breaking, counts.warning, id);
  return getCheckRun(id);
}
