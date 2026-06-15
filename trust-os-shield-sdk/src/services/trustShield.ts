/**
 * TrustOS Shield SDK - Core Service
 * Main SDK entry point
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';
import type {
  TrustOSShieldConfig,
  SDKResponse,
  ScamCheckResult,
  BreachAlert,
  Breach,
  TrustScore,
  ProtectedItem,
} from '../types/index.js';

// ============================================
// TRUST SHIELD SDK
// ============================================

export class TrustShieldSDK {
  private client: AxiosInstance;
  private config: TrustOSShieldConfig;
  private userId?: string;
  private syncInterval?: NodeJS.Timeout;
  private protectedItems: ProtectedItem[] = [];

  constructor(config: TrustOSShieldConfig) {
    this.config = {
      enableBackgroundSync: true,
      syncIntervalMs: 5 * 60 * 1000, // 5 minutes
      enableNotifications: true,
      ...config,
    };

    this.userId = config.userId;

    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
        'X-SDK-Version': '1.0.0',
      },
    });
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  /**
   * Set current user ID
   */
  setUser(userId: string): void {
    this.userId = userId;
  }

  /**
   * Get user protection status
   */
  async getProtectionStatus(): Promise<SDKResponse<{
    userId: string;
    isProtected: boolean;
    trustScore: TrustScore;
    breachStatus?: BreachAlert;
    protectedItems: ProtectedItem[];
  }>> {
    try {
      const response = await this.client.get(`/shield/status/${this.userId}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ============================================
  // TRUST SCORE
  // ============================================

  /**
   * Get user's trust score
   */
  async getTrustScore(): Promise<SDKResponse<TrustScore>> {
    try {
      const response = await this.client.get(`/shield/score/${this.userId}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get detailed trust breakdown
   */
  async getTrustBreakdown(): Promise<SDKResponse<{
    dimensions: {
      identity: { score: number; factors: string[] };
      financial: { score: number; factors: string[] };
      behavioral: { score: number; factors: string[] };
      reputation: { score: number; factors: string[] };
      compliance: { score: number; factors: string[] };
    };
    recommendations: string[];
  }>> {
    try {
      const response = await this.client.get(`/shield/score/${this.userId}/breakdown`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ============================================
  // SCAM DETECTION
  // ============================================

  /**
   * Check SMS for scam
   */
  async checkSMS(content: string, sender?: string): Promise<SDKResponse<ScamCheckResult>> {
    try {
      const response = await this.client.post('/scam/check-sms', {
        content,
        sender,
        userId: this.userId,
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Check WhatsApp message for scam
   */
  async checkWhatsApp(content: string, sender?: string): Promise<SDKResponse<ScamCheckResult>> {
    try {
      const response = await this.client.post('/scam/check-whatsapp', {
        content,
        sender,
        userId: this.userId,
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Check URL/link for scam
   */
  async checkLink(url: string): Promise<SDKResponse<ScamCheckResult>> {
    try {
      const response = await this.client.post('/scam/check-link', {
        url,
        userId: this.userId,
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Check phone number for scam
   */
  async checkPhone(phone: string): Promise<SDKResponse<{
    isScam: boolean;
    riskScore: number;
    scamReports: number;
    callerType?: string;
  }>> {
    try {
      const response = await this.client.post('/scam/check-phone', {
        phone,
        userId: this.userId,
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Report a scam
   */
  async reportScam(data: {
    type: 'sms' | 'call' | 'link' | 'whatsapp';
    content?: string;
    sender?: string;
    url?: string;
    description?: string;
  }): Promise<SDKResponse<{ reportId: string }>> {
    try {
      const response = await this.client.post('/scam/report', {
        ...data,
        userId: this.userId,
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ============================================
  // BREACH MONITORING
  // ============================================

  /**
   * Check if email is in data breach
   */
  async checkEmailBreach(email: string): Promise<SDKResponse<BreachAlert>> {
    try {
      const response = await this.client.post('/breach/check', {
        email,
        userId: this.userId,
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Check if phone is in data breach
   */
  async checkPhoneBreach(phone: string): Promise<SDKResponse<BreachAlert>> {
    try {
      const response = await this.client.post('/breach/check', {
        phone,
        userId: this.userId,
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Add item to monitoring
   */
  async addProtectedItem(item: Omit<ProtectedItem, 'addedAt' | 'breachCount'>): Promise<SDKResponse<ProtectedItem>> {
    try {
      const response = await this.client.post('/shield/protect', {
        ...item,
        userId: this.userId,
      });
      const newItem = response.data.data;
      this.protectedItems.push(newItem);
      return {
        success: true,
        data: newItem,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get all breach alerts
   */
  async getBreachAlerts(): Promise<SDKResponse<Breach[]>> {
    try {
      const response = await this.client.get(`/shield/breaches/${this.userId}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ============================================
  // BACKGROUND SYNC
  // ============================================

  /**
   * Start background sync
   */
  startBackgroundSync(): void {
    if (this.syncInterval) {
      return; // Already running
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.syncProtectionStatus();
      } catch (error) {
        logger.error('Background sync failed', { error: String(error) });
      }
    }, this.config.syncIntervalMs);

    logger.info('Background sync started');
  }

  /**
   * Stop background sync
   */
  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
      logger.info('Background sync stopped');
    }
  }

  /**
   * Sync protection status
   */
  private async syncProtectionStatus(): Promise<void> {
    const status = await this.getProtectionStatus();
    if (status.success && status.data) {
      // Check for new breaches
      if (status.data.breachStatus?.breaches.length) {
        for (const breach of status.data.breachStatus.breaches) {
          if (this.config.onBreachDetected) {
            this.config.onBreachDetected(breach);
          }
        }
      }
    }
  }

  // ============================================
  // ERROR HANDLING
  // ============================================

  private handleError(error: unknown): SDKResponse<never> {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: {
          code: error.response?.data?.error?.code || 'NETWORK_ERROR',
          message: error.response?.data?.error?.message || error.message,
        },
      };
    }
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      },
    };
  }

  // ============================================
  // CLEANUP
  // ============================================

  /**
   * Destroy SDK instance
   */
  destroy(): void {
    this.stopBackgroundSync();
    this.protectedItems = [];
    this.userId = undefined;
  }
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default TrustShieldSDK;
