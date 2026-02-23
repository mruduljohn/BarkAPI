"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const config_1 = require("../config");
const runner_1 = require("../runner");
const output_1 = require("../output");
exports.checkCommand = new commander_1.Command('check')
    .description('Check API endpoints for contract drift')
    .option('--config <path>', 'Path to .barkapi.yml')
    .option('--spec <path>', 'Override spec path')
    .option('--base-url <url>', 'Override base URL')
    .action(async (opts) => {
    const spinner = (0, ora_1.default)('Loading configuration...').start();
    let config;
    try {
        config = (0, config_1.loadConfig)(opts.config);
    }
    catch (err) {
        spinner.fail(chalk_1.default.red(err.message));
        process.exit(1);
    }
    if (opts.spec)
        config.spec = opts.spec;
    if (opts.baseUrl)
        config.base_url = opts.baseUrl;
    spinner.text = `Parsing ${config.spec}...`;
    try {
        spinner.text = 'Checking endpoints for drift...';
        const result = await (0, runner_1.runCheck)(config);
        spinner.stop();
        console.log((0, output_1.formatCheckResult)(result));
        if (result.totals.breaking > 0) {
            process.exit(1);
        }
    }
    catch (err) {
        spinner.fail(chalk_1.default.red(`Check failed: ${err.message}`));
        process.exit(1);
    }
});
//# sourceMappingURL=check.js.map