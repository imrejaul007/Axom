"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCatalog = getCatalog;
exports.issueVoucher = issueVoucher;
exports.activateVoucher = activateVoucher;
exports.cancelVoucher = cancelVoucher;
exports.getVoucher = getVoucher;
const rezClient_1 = require("./rezClient");
const errorHandler_1 = require("../../middleware/errorHandler");
const telemetry_1 = require("../../config/telemetry");
async function getCatalog(city) {
    try {
        const { data } = await rezClient_1.rezClient.get('/gifts/catalog', { params: { city } });
        return data;
    }
    catch (err) {
        telemetry_1.log.error({ err, city }, '[RezGift] getCatalog failed');
        throw err instanceof errorHandler_1.AppError ? err : new errorHandler_1.AppError(502, 'Gift catalog unavailable');
    }
}
async function issueVoucher(params) {
    try {
        const { data } = await rezClient_1.rezClient.post('/gifts/issue', params);
        return data;
    }
    catch (err) {
        telemetry_1.log.error({ err, params }, '[RezGift] issueVoucher failed');
        throw err instanceof errorHandler_1.AppError ? err : new errorHandler_1.AppError(502, 'Voucher issue failed');
    }
}
async function activateVoucher(voucherId) {
    try {
        await rezClient_1.rezClient.post(`/gifts/activate/${voucherId}`);
    }
    catch (err) {
        telemetry_1.log.error({ err, voucherId }, '[RezGift] activateVoucher failed');
        throw err instanceof errorHandler_1.AppError ? err : new errorHandler_1.AppError(502, 'Voucher activation failed');
    }
}
async function cancelVoucher(voucherId, reason) {
    try {
        await rezClient_1.rezClient.post(`/gifts/cancel/${voucherId}`, { reason });
    }
    catch (err) {
        telemetry_1.log.error({ err, voucherId }, '[RezGift] cancelVoucher failed');
        throw err instanceof errorHandler_1.AppError ? err : new errorHandler_1.AppError(502, 'Voucher cancellation failed');
    }
}
async function getVoucher(voucherId) {
    try {
        const { data } = await rezClient_1.rezClient.get(`/gifts/voucher/${voucherId}`);
        return data;
    }
    catch (err) {
        telemetry_1.log.error({ err, voucherId }, '[RezGift] getVoucher failed');
        throw err instanceof errorHandler_1.AppError ? err : new errorHandler_1.AppError(502, 'Voucher lookup failed');
    }
}
