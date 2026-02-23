"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.devCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const runner_1 = require("../runner");
const output_1 = require("../output");
exports.devCommand = new commander_1.Command('dev')
    .description('Start dashboard + watch mode (full dev experience)')
    .option('--config <path>', 'Path to .barkapi.yml')
    .option('--interval <seconds>', 'Check interval in seconds', '30')
    .option('--port <port>', 'Dashboard port', '3100')
    .option('--no-open', 'Don\'t auto-open browser')
    .action(async (opts) => {
    let config;
    try {
        config = (0, config_1.loadConfig)(opts.config);
    }
    catch (err) {
        console.error(chalk_1.default.red(err.message));
        process.exit(1);
    }
    const port = parseInt(opts.port, 10);
    const interval = parseInt(opts.interval, 10) * 1000;
    const dbPath = path_1.default.resolve(process.cwd(), '.barkapi', 'barkapi.db');
    // Find the dashboard package directory
    const dashboardDir = findDashboardDir();
    if (!dashboardDir) {
        console.error(chalk_1.default.red('Could not find @barkapi/dashboard package. Make sure it is installed.'));
        process.exit(1);
    }
    console.log(chalk_1.default.cyan.bold('\n  🐕 BarkAPI Dev Mode\n'));
    console.log(chalk_1.default.gray('  Dashboard: ') + chalk_1.default.white(`http://localhost:${port}`));
    console.log(chalk_1.default.gray('  Watching:  ') + chalk_1.default.white(`${config.project} every ${opts.interval}s`));
    console.log(chalk_1.default.gray('  DB:        ') + chalk_1.default.white(dbPath));
    console.log('');
    // Start dashboard with shared DB path
    const dashboardEnv = {
        ...process.env,
        BARKAPI_DB_PATH: dbPath,
        PORT: String(port),
    };
    const dashboard = (0, child_process_1.spawn)('npx', ['next', 'dev', '-p', String(port)], {
        cwd: dashboardDir,
        env: dashboardEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    dashboard.stdout?.on('data', (data) => {
        const line = data.toString().trim();
        if (line) {
            console.log(chalk_1.default.gray(`  [dashboard] ${line}`));
        }
    });
    dashboard.stderr?.on('data', (data) => {
        const line = data.toString().trim();
        if (line && !line.includes('ExperimentalWarning')) {
            console.log(chalk_1.default.gray(`  [dashboard] ${line}`));
        }
    });
    dashboard.on('error', (err) => {
        console.error(chalk_1.default.red(`Dashboard failed to start: ${err.message}`));
    });
    // Auto-open browser after a delay
    if (opts.open !== false) {
        setTimeout(() => {
            const url = `http://localhost:${port}`;
            openBrowser(url);
        }, 3000);
    }
    // Run watch loop
    console.log(chalk_1.default.cyan(`  Starting watch mode...\n`));
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
    const watchTimer = setInterval(tick, interval);
    // Graceful shutdown
    const cleanup = () => {
        console.log(chalk_1.default.gray('\n  Shutting down...'));
        clearInterval(watchTimer);
        dashboard.kill();
        process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
});
function findDashboardDir() {
    // Try common monorepo locations
    const candidates = [
        path_1.default.resolve(__dirname, '..', '..', '..', 'dashboard'),
        path_1.default.resolve(process.cwd(), 'packages', 'dashboard'),
        path_1.default.resolve(process.cwd(), 'node_modules', '@barkapi', 'dashboard'),
    ];
    for (const dir of candidates) {
        try {
            const pkgPath = path_1.default.join(dir, 'package.json');
            const pkg = require(pkgPath);
            if (pkg.name === '@barkapi/dashboard') {
                return dir;
            }
        }
        catch {
            // not found, try next
        }
    }
    return null;
}
function openBrowser(url) {
    const cmd = process.platform === 'darwin'
        ? `open "${url}"`
        : process.platform === 'win32'
            ? `start "${url}"`
            : `xdg-open "${url}"`;
    (0, child_process_1.exec)(cmd, (err) => {
        if (err) {
            console.log(chalk_1.default.gray(`  Open ${url} in your browser`));
        }
    });
}
//# sourceMappingURL=dev.js.map