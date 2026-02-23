"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCheck = runCheck;
const core_1 = require("@barkapi/core");
const endpoint_caller_1 = require("./endpoint-caller");
const path_1 = __importDefault(require("path"));
async function runCheck(config, dbPath) {
    // Ensure DB is initialized
    (0, core_1.getDb)(dbPath);
    // Ensure project exists in DB
    let project = (0, core_1.getProjectByName)(config.project);
    if (!project) {
        project = (0, core_1.createProject)(config.project, config.spec, config.base_url);
    }
    // Parse spec
    const specPath = path_1.default.resolve(process.cwd(), config.spec);
    const parsedEndpoints = await (0, core_1.parseOpenAPISpec)(specPath);
    // Filter endpoints if configured
    const filtered = filterEndpoints(parsedEndpoints, config);
    // Create check run
    const checkRun = (0, core_1.createCheckRun)(project.id);
    const results = [];
    let passing = 0;
    let breaking = 0;
    let warning = 0;
    for (const ep of filtered) {
        const endpoint = (0, core_1.createEndpoint)(project.id, ep.method, ep.path);
        const callResult = await (0, endpoint_caller_1.callEndpoint)(config.base_url, ep.method, ep.path, config);
        if (callResult.error || !callResult.body) {
            (0, core_1.updateEndpointStatus)(endpoint.id, 'error');
            results.push({
                method: ep.method,
                path: ep.path,
                drifts: [],
                error: callResult.error || 'No response body',
            });
            continue;
        }
        if (!ep.responseSchema) {
            (0, core_1.updateEndpointStatus)(endpoint.id, 'healthy');
            results.push({ method: ep.method, path: ep.path, drifts: [] });
            passing++;
            continue;
        }
        const actualSchema = (0, core_1.inferSchema)(callResult.body);
        const drifts = (0, core_1.diffSchemas)(ep.responseSchema, actualSchema);
        // Save drifts to DB
        if (drifts.length > 0) {
            (0, core_1.createDriftsBatch)(checkRun.id, endpoint.id, drifts);
        }
        const hasBreaking = drifts.some(d => d.severity === 'breaking');
        const hasWarning = drifts.some(d => d.severity === 'warning');
        if (hasBreaking) {
            breaking++;
            (0, core_1.updateEndpointStatus)(endpoint.id, 'drifted');
        }
        else if (hasWarning) {
            warning++;
            (0, core_1.updateEndpointStatus)(endpoint.id, 'drifted');
        }
        else {
            passing++;
            (0, core_1.updateEndpointStatus)(endpoint.id, 'healthy');
        }
        results.push({ method: ep.method, path: ep.path, drifts });
    }
    // Finish check run
    (0, core_1.finishCheckRun)(checkRun.id, {
        total_endpoints: filtered.length,
        passing,
        breaking,
        warning,
    });
    return {
        projectName: config.project,
        checkRunId: checkRun.id,
        endpoints: results,
        totals: { total: filtered.length, passing, breaking, warning },
    };
}
function filterEndpoints(endpoints, config) {
    if (!config.endpoints)
        return endpoints;
    let filtered = endpoints;
    if (config.endpoints.include?.length) {
        filtered = filtered.filter(ep => config.endpoints.include.some(pattern => ep.path.includes(pattern)));
    }
    if (config.endpoints.exclude?.length) {
        filtered = filtered.filter(ep => !config.endpoints.exclude.some(pattern => ep.path.includes(pattern)));
    }
    return filtered;
}
//# sourceMappingURL=check-runner.js.map