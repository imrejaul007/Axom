"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rezClient = void 0;
/**
 * Shared REZ partner API axios client.
 * Normalises all REZ API errors so partner internals are never leaked to end users.
 */
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../config/env");
const errorHandler_1 = require("../../middleware/errorHandler");
exports.rezClient = axios_1.default.create({
    baseURL: env_1.env.REZ.API_URL,
    headers: { 'x-partner-key': env_1.env.REZ.API_KEY },
    timeout: 10000,
});
exports.rezClient.interceptors.response.use((res) => res, (err) => {
    const status = err.response?.status;
    const rezMessage = err.response?.data?.message;
    // Map REZ status codes to Rendez-appropriate codes
    if (status === 402 || status === 422) {
        // Insufficient balance or validation error — surface to user safely
        throw new errorHandler_1.AppError(status, rezMessage || 'REZ wallet operation failed');
    }
    if (status && status >= 400 && status < 500) {
        throw new errorHandler_1.AppError(400, rezMessage || 'Invalid request to payment partner');
    }
    // 5xx or network errors — don't expose REZ internals
    throw new errorHandler_1.AppError(502, 'Payment partner temporarily unavailable — please try again');
});
