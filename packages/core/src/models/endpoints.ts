import { getDb } from '../db';
import type { Endpoint } from './types';

export function createEndpoint(projectId: number, method: string, path: string): Endpoint {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT OR IGNORE INTO endpoints (project_id, method, path) VALUES (?, ?, ?)'
  );
  stmt.run(projectId, method.toUpperCase(), path);

  return db.prepare(
    'SELECT * FROM endpoints WHERE project_id = ? AND method = ? AND path = ?'
  ).get(projectId, method.toUpperCase(), path) as Endpoint;
}

export function getEndpoint(id: number): Endpoint | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM endpoints WHERE id = ?').get(id) as Endpoint | undefined;
}

export function listEndpoints(projectId: number): Endpoint[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM endpoints WHERE project_id = ? ORDER BY path, method'
  ).all(projectId) as Endpoint[];
}

export function updateEndpointStatus(id: number, status: Endpoint['status']): void {
  const db = getDb();
  db.prepare(
    "UPDATE endpoints SET status = ?, last_checked_at = datetime('now') WHERE id = ?"
  ).run(status, id);
}

export function deleteEndpoint(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM endpoints WHERE id = ?').run(id);
}
