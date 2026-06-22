/**
 * BuzzLocal Integration Index
 *
 * Central export for all REZ ecosystem integrations.
 *
 * Usage:
 * import { rezIntelligence, rezDataCollector } from '@/integrations/rezIntelligence';
 * import { walletService, notificationService } from '@/integrations/rabtulPlatform';
 */

export { rezIntelligence, rezDataCollector } from './rezIntelligence';
export { authService, walletService, paymentService, notificationService } from './rabtulPlatform';

// Type exports
export type * from './rezIntelligence';
export type * from './rabtulPlatform';
