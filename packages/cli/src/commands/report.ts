import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import { loadConfig } from '../config';
import { runCheck } from '../runner';
import { formatCheckResult } from '../output';

export const reportCommand = new Command('report')
  .description('Run check and optionally push results to dashboard')
  .option('--config <path>', 'Path to .barkapi.yml')
  .option('--push', 'Push results to dashboard')
  .option('--json', 'Output as JSON')
  .option('--output <path>', 'Export report to file (supports .json and .html)')
  .action(async (opts) => {
    const spinner = ora('Loading configuration...').start();

    let config;
    try {
      config = loadConfig(opts.config);
    } catch (err: any) {
      spinner.fail(chalk.red(err.message));
      process.exit(1);
    }

    spinner.text = 'Running check...';

    try {
      const result = await runCheck(config);
      spinner.stop();

      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(formatCheckResult(result));
      }

      if (opts.output) {
        const outputPath = path.resolve(process.cwd(), opts.output);
        if (opts.output.endsWith('.html')) {
          fs.writeFileSync(outputPath, generateHtmlReport(result), 'utf-8');
        } else {
          fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
        }
        console.log(chalk.green(`Report exported to ${opts.output}`));
      }

      if (opts.push) {
        console.log(chalk.yellow('\n  ⚠ --push is deprecated. The dashboard now reads from the shared database automatically.'));
        console.log(chalk.yellow('    Just run `barkapi dev` for the full experience.\n'));
        const dashboardUrl = config.dashboard_url || 'http://localhost:3100';
        const pushSpinner = ora(`Pushing results to ${dashboardUrl}...`).start();

        try {
          await pushToDashboard(dashboardUrl, result);
          pushSpinner.succeed(chalk.green('Results pushed to dashboard'));
        } catch (err: any) {
          pushSpinner.fail(chalk.red(`Push failed: ${err.message}`));
        }
      }

      if (result.totals.breaking > 0) {
        process.exit(1);
      }
    } catch (err: any) {
      spinner.fail(chalk.red(`Report failed: ${err.message}`));
      process.exit(1);
    }
  });

function generateHtmlReport(result: any): string {
  const rows = result.endpoints.map((ep: any) => {
    const status = ep.error
      ? '<span style="color:#ef4444">ERROR</span>'
      : ep.drifts.length === 0
        ? '<span style="color:#22c55e">PASS</span>'
        : `<span style="color:#eab308">${ep.drifts.length} drift(s)</span>`;

    const driftRows = ep.drifts.map((d: any) => `
      <tr>
        <td style="padding:4px 8px;font-family:monospace;font-size:13px">${d.field_path}</td>
        <td style="padding:4px 8px">${d.drift_type}</td>
        <td style="padding:4px 8px;color:${d.severity === 'breaking' ? '#ef4444' : d.severity === 'warning' ? '#eab308' : '#3b82f6'}">${d.severity}</td>
        <td style="padding:4px 8px">${d.expected || ''} &rarr; ${d.actual || ''}</td>
      </tr>
    `).join('');

    return `
      <tr style="border-bottom:1px solid #333">
        <td style="padding:8px;font-family:monospace;font-weight:bold">${ep.method} ${ep.path}</td>
        <td style="padding:8px">${status}</td>
      </tr>
      ${driftRows ? `<tr><td colspan="2"><table style="width:100%;margin:0 0 8px 24px">${driftRows}</table></td></tr>` : ''}
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BarkAPI Report - ${result.projectName}</title>
  <style>
    body { background: #0a0a0a; color: #e5e5e5; font-family: -apple-system, sans-serif; padding: 32px; max-width: 960px; margin: 0 auto; }
    h1 { color: #60a5fa; }
    .summary { display: flex; gap: 16px; margin: 16px 0; }
    .stat { padding: 8px 16px; border-radius: 8px; font-weight: bold; }
    .breaking { background: #7f1d1d; color: #fca5a5; }
    .warning { background: #713f12; color: #fde68a; }
    .passing { background: #14532d; color: #86efac; }
    table { border-collapse: collapse; width: 100%; }
    th { text-align: left; padding: 8px; border-bottom: 2px solid #333; color: #a1a1aa; }
    td { padding: 8px; }
    .footer { margin-top: 32px; color: #71717a; font-size: 12px; }
  </style>
</head>
<body>
  <h1>BarkAPI Drift Report</h1>
  <p>Project: <strong>${result.projectName}</strong> &mdash; ${new Date().toLocaleString()}</p>

  <div class="summary">
    ${result.totals.breaking > 0 ? `<span class="stat breaking">${result.totals.breaking} breaking</span>` : ''}
    ${result.totals.warning > 0 ? `<span class="stat warning">${result.totals.warning} warning</span>` : ''}
    <span class="stat passing">${result.totals.passing} passing</span>
  </div>

  <table>
    <thead><tr><th>Endpoint</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">Generated by BarkAPI v0.1.0</div>
</body>
</html>`;
}

async function pushToDashboard(baseUrl: string, result: any): Promise<void> {
  const url = new URL('/api/check-runs', baseUrl);
  const body = JSON.stringify(result);

  return new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
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
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
