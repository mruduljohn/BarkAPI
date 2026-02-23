"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const config_1 = require("../config");
exports.initCommand = new commander_1.Command('init')
    .description('Initialize BarkAPI in the current project')
    .option('--spec <path>', 'Path to OpenAPI spec file')
    .option('--base-url <url>', 'Base URL for API')
    .option('--name <name>', 'Project name')
    .action(async (opts) => {
    const spinner = (0, ora_1.default)('Detecting project configuration...').start();
    // Check if already initialized
    const existingConfig = (0, config_1.findConfigFile)();
    if (existingConfig) {
        spinner.warn(chalk_1.default.yellow('.barkapi.yml already exists'));
        return;
    }
    // Detect spec file
    const specFile = opts.spec || (0, config_1.detectSpecFile)();
    if (!specFile) {
        spinner.fail(chalk_1.default.red('No OpenAPI spec file found. Use --spec to specify one.'));
        process.exit(1);
    }
    spinner.text = `Found spec: ${specFile}`;
    // Detect project name
    const projectName = opts.name || (0, config_1.detectProjectName)();
    // Base URL
    const baseUrl = opts.baseUrl || 'http://localhost:3000';
    const config = {
        project: projectName,
        spec: specFile,
        base_url: baseUrl,
    };
    const configPath = (0, config_1.writeConfig)(config);
    spinner.succeed(chalk_1.default.green(`Created ${configPath}`));
    console.log('');
    console.log(chalk_1.default.gray('  project: ') + chalk_1.default.white(config.project));
    console.log(chalk_1.default.gray('  spec:    ') + chalk_1.default.white(config.spec));
    console.log(chalk_1.default.gray('  url:     ') + chalk_1.default.white(config.base_url));
    console.log('');
    console.log(chalk_1.default.gray('Run ') + chalk_1.default.cyan('barkapi check') + chalk_1.default.gray(' to detect drift.'));
});
//# sourceMappingURL=init.js.map