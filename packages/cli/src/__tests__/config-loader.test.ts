import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadConfig, writeConfig, detectSpecFile, detectProjectName, findConfigFile } from '../config/loader';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'barkapi-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('writeConfig / loadConfig', () => {
  it('writes and reads back config', () => {
    const config = {
      project: 'test-api',
      spec: 'openapi.yaml',
      base_url: 'http://localhost:3000',
    };
    const filePath = writeConfig(config, tmpDir);
    expect(fs.existsSync(filePath)).toBe(true);

    const loaded = loadConfig(filePath);
    expect(loaded.project).toBe('test-api');
    expect(loaded.spec).toBe('openapi.yaml');
    expect(loaded.base_url).toBe('http://localhost:3000');
  });

  it('throws when config file does not exist', () => {
    expect(() => loadConfig('/nonexistent/.barkapi.yml')).toThrow();
  });
});

describe('findConfigFile', () => {
  it('finds .barkapi.yml in a directory', () => {
    fs.writeFileSync(path.join(tmpDir, '.barkapi.yml'), 'project: test\nspec: spec.yaml\nbase_url: http://localhost:3000');
    expect(findConfigFile(tmpDir)).not.toBeNull();
  });

  it('returns null when no config exists', () => {
    expect(findConfigFile(tmpDir)).toBeNull();
  });
});

describe('detectSpecFile', () => {
  it('detects openapi.yaml', () => {
    fs.writeFileSync(path.join(tmpDir, 'openapi.yaml'), '');
    expect(detectSpecFile(tmpDir)).toBe('openapi.yaml');
  });

  it('detects swagger.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'swagger.json'), '');
    expect(detectSpecFile(tmpDir)).toBe('swagger.json');
  });

  it('detects spec in docs/ subdirectory', () => {
    fs.mkdirSync(path.join(tmpDir, 'docs'));
    fs.writeFileSync(path.join(tmpDir, 'docs', 'openapi.yaml'), '');
    expect(detectSpecFile(tmpDir)).toBe('docs/openapi.yaml');
  });

  it('returns null when no spec found', () => {
    expect(detectSpecFile(tmpDir)).toBeNull();
  });
});

describe('detectProjectName', () => {
  it('reads name from package.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'my-cool-api' }));
    expect(detectProjectName(tmpDir)).toBe('my-cool-api');
  });

  it('falls back to directory name', () => {
    const name = detectProjectName(tmpDir);
    expect(name).toBe(path.basename(tmpDir));
  });
});
