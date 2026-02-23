"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const url_1 = require("url");
const config_1 = require("../config");
const runner_1 = require("../runner");
const output_1 = require("../output");
exports.reportCommand = new commander_1.Command('report')
    .description('Run check and optionally push results to dashboard')
    .option('--config <path>', 'Path to .barkapi.yml')
    .option('--push', 'Push results to dashboard')
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
    spinner.text = 'Running check...';
    try {
        const result = await (0, runner_1.runCheck)(config);
        spinner.stop();
        console.log((0, output_1.formatCheckResult)(result));
        if (opts.push) {
            const dashboardUrl = config.dashboard_url || 'http://localhost:3100';
            const pushSpinner = (0, ora_1.default)(`Pushing results to ${dashboardUrl}...`).start();
            try {
                await pushToDashboard(dashboardUrl, result);
                pushSpinner.succeed(chalk_1.default.green('Results pushed to dashboard'));
            }
            catch (err) {
                pushSpinner.fail(chalk_1.default.red(`Push failed: ${err.message}`));
            }
        }
        if (result.totals.breaking > 0) {
            process.exit(1);
        }
    }
    catch (err) {
        spinner.fail(chalk_1.default.red(`Report failed: ${err.message}`));
        process.exit(1);
    }
});
async function pushToDashboard(baseUrl, result) {
    const url = new url_1.URL('/api/check-runs', baseUrl);
    const body = JSON.stringify(result);
    return new Promise((resolve, reject) => {
        const client = url.protocol === 'https:' ? https_1.default : http_1.default;
        const req = client.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    resolve();
                }
                else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}
//# sourceMappingURL=report.js.map