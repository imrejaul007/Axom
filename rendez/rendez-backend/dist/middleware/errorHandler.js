"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
const telemetry_1 = require("../config/telemetry");
class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ message: err.message });
    }
    telemetry_1.log.error({ err, statusCode: err.statusCode }, '[Error]');
    res.status(500).json({ message: 'Internal server error' });
}
