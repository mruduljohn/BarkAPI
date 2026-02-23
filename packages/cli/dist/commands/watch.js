"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.watchCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const config_1 = require("../config");
const runner_1 = require("../runner");
const output_1 = require("../output");
exports.watchCommand = new commander_1.Command('watch')
    .description('Continuously monitor API endpoints for drift')
    .option('--config <path>', 'Path to .barkapi.yml')
    .option('--interval <seconds>', 'Check interval in seconds', '30')
    .action(async (opts) => {
    let config;
    try {
        config = (0, config_1.loadConfig)(opts.config);
    }
    catch (err) {
        console.error(chalk_1.default.red(err.message));
        process.exit(1);
    }
    const interval = parseInt(opts.interval, 10) * 1000;
    console.log(chalk_1.default.cyan(`Watching ${config.project} every ${opts.interval}s...`));
    console.log(chalk_1.default.gray('Press Ctrl+C to stop.\n'));
    const tick = async () => {
        const spinner = (0, ora_1.default)('Running check...').start();
        try {
            const result = await (0, runner_1.runCheck)(config);
            spinner.stop();
            const timestamp = new Date().toLocaleTimeString();
            console.log(chalk_1.default.gray(`[${timestamp}]`));
            console.log((0, output_1.formatCheckResult)(result));
        }
        catch (err) {
            spinner.fail(chalk_1.default.red(`Check failed: ${err.message}`));
        }
    };
    await tick();
    setInterval(tick, interval);
});
//# sourceMappingURL=watch.js.map