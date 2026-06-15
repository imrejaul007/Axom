"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telemetry_1 = require("./telemetry");
const logger = {
    info: (message, meta) => {
        telemetry_1.log.info({ ...meta, message });
    },
    error: (message, meta) => {
        telemetry_1.log.error({ ...meta, message });
    },
    warn: (message, meta) => {
        telemetry_1.log.warn({ ...meta, message });
    },
    debug: (message, meta) => {
        telemetry_1.log.debug({ ...meta, message });
    },
};
exports.default = logger;
exports.logger = logger;
