import { getDb } from '../db';
import type { Project } from './types';

export function createProject(name: string, specPath: string, baseUrl: string): Project {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO projects (name, spec_path, base_url) VALUES (?, ?, ?)'
  );
  const result = stmt.run(name, specPath, baseUrl);
  return getProject(result.lastInsertRowid as number)!;
}

export function getProject(id: number): Project | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
}

export function getProjectByName(name: string): Project | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM projects WHERE name = ?').get(name) as Project | undefined;
}

export function listProjects(): Project[] {
  const db = getDb();
  return db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all() as Project[];
}

export function updateProject(id: number, updates: Partial<Pick<Project, 'name' | 'spec_path' | 'base_url'>>): Project | undefined {
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.spec_path !== undefined) { fields.push('spec_path = ?'); values.push(updates.spec_path); }
  if (updates.base_url !== undefined) { fields.push('base_url = ?'); values.push(updates.base_url); }

  if (fields.length === 0) return getProject(id);

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getProject(id);
}

export function deleteProject(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}
