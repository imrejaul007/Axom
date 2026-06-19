import { Worker, Queue } from 'bullmq';
import { redis } from '../config/redis';
import { GiftService } from '../services/GiftService';
import { log } from '../config/telemetry';

export const catalogCacheQueue = new Queue('catalog-cache', { connection: redis });
const giftService = new GiftService();

export const catalogCacheWorker = new Worker(
  'catalog-cache',
  async (job) => {
    try {
      const cities: string[] = job.data.cities || [];
      // Refresh cache for all active cities
      await Promise.all([
        giftService.getCatalog(),
        ...cities.map((city) => giftService.getCatalog(city)),
      ]);
      log.info('[CatalogCache] Refreshed gift catalog cache');
    } catch (err) {
      // RD-L-08 FIX: Catch and log errors explicitly.
      // Without this, a failed cache refresh would silently complete the job without
      // indicating failure, making it impossible to detect stale cache state.
      log.error({ err }, '[CatalogCache] Worker error');
      throw err;
    }
  },
  {
    connection: redis,
    // C-28 FIX: Job timeout enforcement - prevent stuck jobs
    lockDuration: 30000, // 30 second lock
    lockRenewTime: 5000, // Renew lock every 5 seconds
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 2, // Fail job after 2 stalled attempts
  },
);

catalogCacheWorker.on('stalled', (jobId: string) => {
  log.warn({ jobId }, '[CatalogCache] Job stalled (lock expired without renewal)');
});
