import https from 'https';

const PACKAGE_NAME = 'barkapi';
const CURRENT_VERSION = '0.1.0';

/**
 * Non-blocking check for newer npm version. Logs a message if update available.
 * Never throws or blocks the CLI — runs entirely in background.
 */
export function checkForUpdates(): void {
  const url = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;

  const req = https.get(url, { timeout: 3000 }, (res) => {
    if (res.statusCode !== 200) return;
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const { version } = JSON.parse(data);
        if (version && version !== CURRENT_VERSION && isNewer(version, CURRENT_VERSION)) {
          console.log(
            `\n  Update available: ${CURRENT_VERSION} → ${version}` +
            `\n  Run \`npm install -g ${PACKAGE_NAME}\` to update.\n`
          );
        }
      } catch {}
    });
  });

  req.on('error', () => {});
  req.on('timeout', () => req.destroy());
}

function isNewer(latest: string, current: string): boolean {
  const l = latest.split('.').map(Number);
  const c = current.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true;
    if ((l[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}
