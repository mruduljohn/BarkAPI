"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findConfigFile = findConfigFile;
exports.loadConfig = loadConfig;
exports.writeConfig = writeConfig;
exports.detectSpecFile = detectSpecFile;
exports.detectProjectName = detectProjectName;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const CONFIG_FILE = '.barkapi.yml';
function findConfigFile(dir) {
    const searchDir = dir || process.cwd();
    const configPath = path_1.default.join(searchDir, CONFIG_FILE);
    if (fs_1.default.existsSync(configPath))
        return configPath;
    return null;
}
function loadConfig(configPath) {
    const filePath = configPath || findConfigFile();
    if (!filePath || !fs_1.default.existsSync(filePath)) {
        throw new Error(`No ${CONFIG_FILE} found. Run \`barkapi init\` to create one.`);
    }
    const raw = fs_1.default.readFileSync(filePath, 'utf-8');
    return yaml_1.default.parse(raw);
}
function writeConfig(config, dir) {
    const outputDir = dir || process.cwd();
    const filePath = path_1.default.join(outputDir, CONFIG_FILE);
    const content = yaml_1.default.stringify(config, { lineWidth: 120 });
    fs_1.default.writeFileSync(filePath, content, 'utf-8');
    return filePath;
}
function detectSpecFile(dir) {
    const searchDir = dir || process.cwd();
    const candidates = [
        'openapi.yaml', 'openapi.yml', 'openapi.json',
        'swagger.yaml', 'swagger.yml', 'swagger.json',
        'api-spec.yaml', 'api-spec.yml', 'api-spec.json',
        'docs/openapi.yaml', 'docs/openapi.yml', 'docs/openapi.json',
        'spec/openapi.yaml', 'spec/openapi.yml', 'spec/openapi.json',
    ];
    for (const candidate of candidates) {
        const fullPath = path_1.default.join(searchDir, candidate);
        if (fs_1.default.existsSync(fullPath))
            return candidate;
    }
    return null;
}
function detectProjectName(dir) {
    const searchDir = dir || process.cwd();
    try {
        const pkg = JSON.parse(fs_1.default.readFileSync(path_1.default.join(searchDir, 'package.json'), 'utf-8'));
        if (pkg.name)
            return pkg.name;
    }
    catch { }
    return path_1.default.basename(searchDir);
}
//# sourceMappingURL=loader.js.map