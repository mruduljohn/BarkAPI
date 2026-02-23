"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCheckResult = formatCheckResult;
const chalk_1 = __importDefault(require("chalk"));
function formatCheckResult(result) {
    const lines = [];
    lines.push('');
    for (const ep of result.endpoints) {
        lines.push(formatEndpoint(ep));
    }
    lines.push('');
    lines.push(formatSummary(result));
    lines.push('');
    return lines.join('\n');
}
function formatEndpoint(ep) {
    const lines = [];
    const methodColor = getMethodColor(ep.method);
    const header = `${methodColor(ep.method)} ${chalk_1.default.white(ep.path)}`;
    if (ep.error) {
        lines.push(header);
        lines.push(`  ${chalk_1.default.red('✗')} ${chalk_1.default.red(ep.error)}`);
        return lines.join('\n');
    }
    if (ep.drifts.length === 0) {
        lines.push(`${header}  ${chalk_1.default.green('✓ no drift detected')}`);
        return lines.join('\n');
    }
    lines.push(header);
    for (const drift of ep.drifts) {
        lines.push(formatDrift(drift));
    }
    return lines.join('\n');
}
function formatDrift(drift) {
    const icon = drift.severity === 'breaking'
        ? chalk_1.default.red('✗')
        : drift.severity === 'warning'
            ? chalk_1.default.yellow('⚠')
            : chalk_1.default.blue('ℹ');
    const fieldPath = chalk_1.default.gray(drift.field_path.padEnd(25));
    const description = getDriftDescription(drift);
    const severity = drift.severity === 'breaking'
        ? chalk_1.default.red(`[${drift.severity}]`)
        : drift.severity === 'warning'
            ? chalk_1.default.yellow(`[${drift.severity}]`)
            : chalk_1.default.blue(`[${drift.severity}]`);
    return `  ${icon} ${fieldPath} ${description}  ${severity}`;
}
function getDriftDescription(drift) {
    switch (drift.drift_type) {
        case 'type_changed':
            return `type changed: ${drift.expected} → ${drift.actual}`;
        case 'removed':
            return 'field removed from response';
        case 'added':
            return 'new field not in spec';
        case 'nullability_changed':
            return `nullability: ${drift.expected} → ${drift.actual}`;
        case 'required_changed':
            return `required changed: ${drift.expected} → ${drift.actual}`;
        default:
            return drift.drift_type;
    }
}
function formatSummary(result) {
    const parts = [];
    if (result.totals.breaking > 0) {
        parts.push(chalk_1.default.red(`✗ ${result.totals.breaking} breaking`));
    }
    if (result.totals.warning > 0) {
        parts.push(chalk_1.default.yellow(`⚠ ${result.totals.warning} warning`));
    }
    parts.push(chalk_1.default.green(`✓ ${result.totals.passing} passing`));
    parts.push(chalk_1.default.gray(`(${result.totals.total} endpoints checked)`));
    return parts.join('  ');
}
function getMethodColor(method) {
    switch (method.toUpperCase()) {
        case 'GET': return chalk_1.default.green;
        case 'POST': return chalk_1.default.blue;
        case 'PUT': return chalk_1.default.yellow;
        case 'PATCH': return chalk_1.default.magenta;
        case 'DELETE': return chalk_1.default.red;
        default: return chalk_1.default.white;
    }
}
//# sourceMappingURL=formatter.js.map