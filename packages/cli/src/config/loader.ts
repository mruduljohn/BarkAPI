import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

export interface BarkApiConfig {
  project: string;
  spec: string;
  base_url: string;
  auth?: {
    type: 'bearer' | 'header' | 'query';
    token_env?: string;
    header_name?: string;
    query_param?: string;
  };
  dashboard_url?: string;
  endpoints?: {
    include?: string[];
    exclude?: string[];
  };
}

const CONFIG_FILE = '.barkapi.yml';

export function findConfigFile(dir?: string): string | null {
  const searchDir = dir || process.cwd();
  const configPath = path.join(searchDir, CONFIG_FILE);
  if (fs.existsSync(configPath)) return configPath;
  return null;
}

export function loadConfig(configPath?: string): BarkApiConfig {
  const filePath = configPath || findConfigFile();
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(
      `No ${CONFIG_FILE} found. Run \`barkapi init\` to create one.`
    );
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return YAML.parse(raw) as BarkApiConfig;
}

export function writeConfig(config: BarkApiConfig, dir?: string): string {
  const outputDir = dir || process.cwd();
  const filePath = path.join(outputDir, CONFIG_FILE);
  const content = YAML.stringify(config, { lineWidth: 120 });
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

export function detectSpecFile(dir?: string): string | null {
  const searchDir = dir || process.cwd();
  const candidates = [
    'openapi.yaml', 'openapi.yml', 'openapi.json',
    'swagger.yaml', 'swagger.yml', 'swagger.json',
    'api-spec.yaml', 'api-spec.yml', 'api-spec.json',
    'docs/openapi.yaml', 'docs/openapi.yml', 'docs/openapi.json',
    'spec/openapi.yaml', 'spec/openapi.yml', 'spec/openapi.json',
  ];

  for (const candidate of candidates) {
    const fullPath = path.join(searchDir, candidate);
    if (fs.existsSync(fullPath)) return candidate;
  }
  return null;
}

export function detectProjectName(dir?: string): string {
  const searchDir = dir || process.cwd();
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(searchDir, 'package.json'), 'utf-8'));
    if (pkg.name) return pkg.name;
  } catch {}
  return path.basename(searchDir);
}
