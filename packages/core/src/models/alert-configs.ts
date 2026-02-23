import { getDb } from '../db';
import type { AlertConfig } from './types';

export function createAlertConfig(
  projectId: number,
  type: 'slack' | 'email',
  config: Record<string, any>,
  minSeverity: 'breaking' | 'warning' | 'info' = 'breaking'
): AlertConfig {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO alert_configs (project_id, type, config, min_severity) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(projectId, type, JSON.stringify(config), minSeverity);
  return getAlertConfig(result.lastInsertRowid as number)!;
}

export function getAlertConfig(id: number): AlertConfig | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM alert_configs WHERE id = ?').get(id) as AlertConfig | undefined;
}

export function listAlertConfigs(projectId: number): AlertConfig[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM alert_configs WHERE project_id = ? ORDER BY created_at DESC'
  ).all(projectId) as AlertConfig[];
}

export function updateAlertConfig(
  id: number,
  updates: Partial<Pick<AlertConfig, 'config' | 'min_severity' | 'enabled'>>
): AlertConfig | undefined {
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.config !== undefined) { fields.push('config = ?'); values.push(updates.config); }
  if (updates.min_severity !== undefined) { fields.push('min_severity = ?'); values.push(updates.min_severity); }
  if (updates.enabled !== undefined) { fields.push('enabled = ?'); values.push(updates.enabled); }

  if (fields.length === 0) return getAlertConfig(id);
  values.push(id);

  db.prepare(`UPDATE alert_configs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getAlertConfig(id);
}

export function deleteAlertConfig(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM alert_configs WHERE id = ?').run(id);
}
