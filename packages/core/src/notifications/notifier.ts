import https from 'https';
import http from 'http';
import { URL } from 'url';
import { listAlertConfigs } from '../models/alert-configs';
import type { AlertConfig, DriftResult, Severity } from '../models/types';

export interface NotificationPayload {
  projectName: string;
  checkRunId: number;
  endpointMethod: string;
  endpointPath: string;
  drifts: DriftResult[];
}

const SEVERITY_ORDER: Record<Severity, number> = {
  info: 0,
  warning: 1,
  breaking: 2,
};

/**
 * Send notifications for detected drifts based on configured alert configs.
 * Only sends if the max drift severity meets the alert's min_severity threshold.
 */
export async function sendNotifications(
  projectId: number,
  payload: NotificationPayload
): Promise<void> {
  if (payload.drifts.length === 0) return;

  const maxSeverity = getMaxSeverity(payload.drifts);
  const configs = listAlertConfigs(projectId);
  const enabled = configs.filter(c => c.enabled === 1);

  for (const config of enabled) {
    if (SEVERITY_ORDER[maxSeverity] < SEVERITY_ORDER[config.min_severity as Severity]) {
      continue;
    }

    try {
      if (config.type === 'slack') {
        await sendSlackNotification(config, payload);
      } else if (config.type === 'email') {
        await sendEmailNotification(config, payload);
      }
    } catch (err: any) {
      // Log but don't throw — notifications should not break the check flow
      console.error(`[barkapi] Failed to send ${config.type} notification: ${err.message}`);
    }
  }
}

function getMaxSeverity(drifts: DriftResult[]): Severity {
  let max: Severity = 'info';
  for (const d of drifts) {
    if (SEVERITY_ORDER[d.severity] > SEVERITY_ORDER[max]) {
      max = d.severity;
    }
  }
  return max;
}

async function sendSlackNotification(
  config: AlertConfig,
  payload: NotificationPayload
): Promise<void> {
  const parsed = JSON.parse(config.config);
  const webhookUrl = parsed.webhook_url;
  if (!webhookUrl) return;

  const breaking = payload.drifts.filter(d => d.severity === 'breaking').length;
  const warnings = payload.drifts.filter(d => d.severity === 'warning').length;
  const info = payload.drifts.filter(d => d.severity === 'info').length;

  const severityEmoji = breaking > 0 ? ':red_circle:' : warnings > 0 ? ':large_yellow_circle:' : ':large_blue_circle:';

  const driftLines = payload.drifts.slice(0, 10).map(d => {
    const icon = d.severity === 'breaking' ? ':x:' : d.severity === 'warning' ? ':warning:' : ':information_source:';
    return `${icon} \`${d.field_path}\` — ${d.drift_type} (${d.expected} → ${d.actual})`;
  });

  if (payload.drifts.length > 10) {
    driftLines.push(`_...and ${payload.drifts.length - 10} more_`);
  }

  const slackPayload = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${severityEmoji} BarkAPI Drift Detected`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Project:*\n${payload.projectName}` },
          { type: 'mrkdwn', text: `*Endpoint:*\n${payload.endpointMethod} ${payload.endpointPath}` },
          { type: 'mrkdwn', text: `*Breaking:* ${breaking}  *Warning:* ${warnings}  *Info:* ${info}` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: driftLines.join('\n'),
        },
      },
    ],
  };

  await postJson(webhookUrl, slackPayload);
}

async function sendEmailNotification(
  config: AlertConfig,
  payload: NotificationPayload
): Promise<void> {
  const parsed = JSON.parse(config.config);
  const smtpUrl = parsed.smtp_url;
  const to = parsed.to;

  if (!smtpUrl || !to) {
    // If no SMTP URL, try to use a simple webhook-based email service
    // For now, log a message — real SMTP requires nodemailer or similar
    console.error(
      `[barkapi] Email alert configured for ${to} but no smtp_url provided. ` +
      `Drift detected on ${payload.endpointMethod} ${payload.endpointPath}: ` +
      `${payload.drifts.length} issue(s) in project "${payload.projectName}".`
    );
    return;
  }

  const breaking = payload.drifts.filter(d => d.severity === 'breaking').length;
  const warnings = payload.drifts.filter(d => d.severity === 'warning').length;

  const subject = `[BarkAPI] Drift detected: ${payload.endpointMethod} ${payload.endpointPath} (${breaking} breaking, ${warnings} warning)`;

  const driftDetails = payload.drifts.map(d =>
    `  - ${d.field_path}: ${d.drift_type} [${d.severity}] (expected: ${d.expected}, actual: ${d.actual})`
  ).join('\n');

  const body = [
    `BarkAPI Drift Report`,
    ``,
    `Project: ${payload.projectName}`,
    `Endpoint: ${payload.endpointMethod} ${payload.endpointPath}`,
    `Check Run: #${payload.checkRunId}`,
    ``,
    `Drifts (${payload.drifts.length}):`,
    driftDetails,
  ].join('\n');

  const emailPayload = { to, subject, body };
  await postJson(smtpUrl, emailPayload);
}

function postJson(url: string, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const body = JSON.stringify(data);

    const req = client.request(parsed, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 10000,
    }, (res) => {
      // Consume response
      res.on('data', () => {});
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode} from ${url}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout posting to ${url}`));
    });

    req.write(body);
    req.end();
  });
}
