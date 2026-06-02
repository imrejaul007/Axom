/**
 * TrustOS Shield SDK
 * Consumer-facing scam protection and trust score SDK
 *
 * @example
 * ```typescript
 * import { TrustShieldSDK, TrustScoreCard, ScamAlertCard } from '@axom/trust-os-shield-sdk';
 *
 * // Initialize SDK
 * const shield = new TrustShieldSDK({
 *   apiKey: 'your-api-key',
 *   apiBaseUrl: 'https://api.trustos.example.com',
 *   userId: 'user-123',
 * });
 *
 * // Check SMS for scam
 * const result = await shield.checkSMS(
 *   'Your bank account will be blocked. Click here: sbi-secure.xyz'
 * );
 *
 * if (result.success && result.data?.isScam) {
 *   console.log('⚠️ Scam detected!');
 * }
 *
 * // Get trust score
 * const score = await shield.getTrustScore();
 *
 * // Start background monitoring
 * shield.startBackgroundSync();
 * ```
 */

// Core SDK
export { TrustShieldSDK } from './services/trustShield.js';

// Types
export type * from './types/index.js';

// Components (React)
export { TrustScoreCard } from './components/TrustScoreCard.jsx';
export { ScamAlertCard, ScamBadge } from './components/ScamAlertCard.jsx';

// Default export
export { TrustShieldSDK as default } from './services/trustShield.js';
