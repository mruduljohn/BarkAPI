#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const init_1 = require("./commands/init");
const check_1 = require("./commands/check");
const watch_1 = require("./commands/watch");
const report_1 = require("./commands/report");
const program = new commander_1.Command();
program
    .name('barkapi')
    .description('API Contract Drift Detector — Your API\'s watchdog')
    .version('0.1.0');
program.addCommand(init_1.initCommand);
program.addCommand(check_1.checkCommand);
program.addCommand(watch_1.watchCommand);
program.addCommand(report_1.reportCommand);
program.parse();
//# sourceMappingURL=index.js.map