"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogCacheWorker = exports.catalogCacheQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const GiftService_1 = require("../services/GiftService");
const telemetry_1 = require("../config/telemetry");
exports.catalogCacheQueue = new bullmq_1.Queue('catalog-cache', { connection: redis_1.redis });
const giftService = new GiftService_1.GiftService();
exports.catalogCacheWorker = new bullmq_1.Worker('catalog-cache', async (job) => {
    try {
        const cities = job.data.cities || [];
        // Refresh cache for all active cities
        await Promise.all([
            giftService.getCatalog(),
            ...cities.map((city) => giftService.getCatalog(city)),
        ]);
        telemetry_1.log.info('[CatalogCache] Refreshed gift catalog cache');
    }
    catch (err) {
        // RD-L-08 FIX: Catch and log errors explicitly.
        // Without this, a failed cache refresh would silently complete the job without
        // indicating failure, making it impossible to detect stale cache state.
        telemetry_1.log.error({ err }, '[CatalogCache] Worker error');
        throw err;
    }
}, {
    connection: redis_1.redis,
    // C-28 FIX: Job timeout enforcement - prevent stuck jobs
    lockDuration: 30000, // 30 second lock
    lockRenewTime: 5000, // Renew lock every 5 seconds
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 2, // Fail job after 2 stalled attempts
});
exports.catalogCacheWorker.on('stalled', (jobId) => {
    telemetry_1.log.warn({ jobId }, '[CatalogCache] Job stalled (lock expired without renewal)');
});
