import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { migrate } from '../db/schema';
import { createProject, getProject, getProjectByName, listProjects, deleteProject } from '../models/projects';
import { createEndpoint, listEndpoints, updateEndpointStatus } from '../models/endpoints';
import { createCheckRun, finishCheckRun, listCheckRuns } from '../models/check-runs';
import { createDriftsBatch, listDriftsByCheckRun } from '../models/drifts';
import { createAlertConfig, listAlertConfigs, updateAlertConfig, deleteAlertConfig } from '../models/alert-configs';

// We need to mock getDb to return our in-memory database
import * as connection from '../db/connection';
import { vi } from 'vitest';

let db: Database.Database;

beforeEach(() => {
  db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  migrate(db);
  // Mock getDb to return our in-memory DB
  vi.spyOn(connection, 'getDb').mockReturnValue(db);
});

afterEach(() => {
  vi.restoreAllMocks();
  db.close();
});

describe('projects model', () => {
  it('creates and retrieves a project', () => {
    const project = createProject('test-api', 'openapi.yaml', 'http://localhost:3000');
    expect(project.id).toBeDefined();
    expect(project.name).toBe('test-api');

    const fetched = getProject(project.id);
    expect(fetched).toBeDefined();
    expect(fetched!.name).toBe('test-api');
  });

  it('finds project by name', () => {
    createProject('my-api', 'spec.yaml', 'http://localhost:3000');
    const found = getProjectByName('my-api');
    expect(found).toBeDefined();
    expect(found!.name).toBe('my-api');
  });

  it('lists all projects', () => {
    createProject('api-1', 'spec.yaml', 'http://localhost:3000');
    createProject('api-2', 'spec.yaml', 'http://localhost:4000');
    const projects = listProjects();
    expect(projects).toHaveLength(2);
  });

  it('deletes a project', () => {
    const project = createProject('delete-me', 'spec.yaml', 'http://localhost:3000');
    deleteProject(project.id);
    expect(getProject(project.id)).toBeUndefined();
  });
});

describe('endpoints model', () => {
  it('creates and lists endpoints', () => {
    const project = createProject('test', 'spec.yaml', 'http://localhost:3000');
    createEndpoint(project.id, 'GET', '/api/users');
    createEndpoint(project.id, 'POST', '/api/users');
    const endpoints = listEndpoints(project.id);
    expect(endpoints).toHaveLength(2);
  });

  it('updates endpoint status', () => {
    const project = createProject('test', 'spec.yaml', 'http://localhost:3000');
    const endpoint = createEndpoint(project.id, 'GET', '/api/users');
    updateEndpointStatus(endpoint.id, 'drifted');
    const endpoints = listEndpoints(project.id);
    expect(endpoints[0].status).toBe('drifted');
  });

  it('does not duplicate endpoints with same project/method/path', () => {
    const project = createProject('test', 'spec.yaml', 'http://localhost:3000');
    createEndpoint(project.id, 'GET', '/api/users');
    createEndpoint(project.id, 'GET', '/api/users');
    const endpoints = listEndpoints(project.id);
    expect(endpoints).toHaveLength(1);
  });
});

describe('check runs model', () => {
  it('creates and finishes a check run', () => {
    const project = createProject('test', 'spec.yaml', 'http://localhost:3000');
    const run = createCheckRun(project.id);
    expect(run.id).toBeDefined();
    expect(run.finished_at).toBeNull();

    finishCheckRun(run.id, { total_endpoints: 5, passing: 3, breaking: 1, warning: 1 });
    const runs = listCheckRuns(project.id);
    expect(runs).toHaveLength(1);
    expect(runs[0].finished_at).not.toBeNull();
    expect(runs[0].passing).toBe(3);
    expect(runs[0].breaking).toBe(1);
  });
});

describe('drifts model', () => {
  it('batch creates drifts and lists by check run', () => {
    const project = createProject('test', 'spec.yaml', 'http://localhost:3000');
    const endpoint = createEndpoint(project.id, 'GET', '/api/users');
    const run = createCheckRun(project.id);

    createDriftsBatch(run.id, endpoint.id, [
      { field_path: 'email', drift_type: 'type_changed', severity: 'breaking', expected: 'string', actual: 'number' },
      { field_path: 'avatar', drift_type: 'added', severity: 'info', expected: 'not in spec', actual: 'string' },
    ]);

    const drifts = listDriftsByCheckRun(run.id);
    expect(drifts).toHaveLength(2);
    expect(drifts[0].field_path).toBe('email');
  });
});

describe('alert configs model', () => {
  it('creates, updates, and deletes alert configs', () => {
    const project = createProject('test', 'spec.yaml', 'http://localhost:3000');

    const alert = createAlertConfig(project.id, 'slack', { webhook_url: 'https://hooks.slack.com/xxx' }, 'breaking');
    expect(alert.id).toBeDefined();

    updateAlertConfig(alert.id, { enabled: 0 });
    const alerts = listAlertConfigs(project.id);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].enabled).toBe(0);

    deleteAlertConfig(alert.id);
    expect(listAlertConfigs(project.id)).toHaveLength(0);
  });
});
