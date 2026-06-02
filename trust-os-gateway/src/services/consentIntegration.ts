/**
 * Consent Service Integration
 * Connects to existing rez-gdpr-service
 */

import axios, { AxiosInstance } from 'axios';

// Service URLs
const GDPR_SERVICE_URL = process.env.GDPR_SERVICE_URL || 'http://localhost:3005';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'trust-os-internal-token';

import type {
  ConsentRequest,
  ConsentResponse,
  UserConsent,
  ConsentType,
  ConsentStatus,
} from '../types/index.js';

interface GDPRConsentResponse {
  userId: string;
  consentType: string;
  status: string;
  grantedAt: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export class ConsentIntegration {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: GDPR_SERVICE_URL,
      timeout: 5000,
      headers: {
        'X-Internal-Token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Grant consent for user
   */
  async grant(userId: string, consentType: ConsentType): Promise<UserConsent> {
    try {
      const response = await this.client.post<GDPRConsentResponse>('/api/consent/grant', {
        userId,
        consentType,
        status: 'granted',
        source: 'api',
      });

      return this.mapConsent(response.data);
    } catch (error) {
      console.error('Failed to grant consent:', error);
      throw error;
    }
  }

  /**
   * Deny consent for user
   */
  async deny(userId: string, consentType: ConsentType): Promise<UserConsent> {
    try {
      const response = await this.client.post<GDPRConsentResponse>('/api/consent/deny', {
        userId,
        consentType,
        status: 'denied',
        source: 'api',
      });

      return this.mapConsent(response.data);
    } catch (error) {
      console.error('Failed to deny consent:', error);
      throw error;
    }
  }

  /**
   * Withdraw consent
   */
  async withdraw(userId: string, consentType: ConsentType): Promise<UserConsent> {
    try {
      const response = await this.client.post<GDPRConsentResponse>('/api/consent/withdraw', {
        userId,
        consentType,
      });

      return this.mapConsent(response.data);
    } catch (error) {
      console.error('Failed to withdraw consent:', error);
      throw error;
    }
  }

  /**
   * Get all consents for user
   */
  async getConsents(userId: string): Promise<ConsentResponse> {
    try {
      const response = await this.client.get<{
        data: GDPRConsentResponse[];
      }>(`/api/consent/${userId}`);

      return {
        userId,
        consents: response.data.data.map((c) => this.mapConsent(c)),
      };
    } catch (error) {
      console.error('Failed to get consents:', error);
      return {
        userId,
        consents: [],
      };
    }
  }

  /**
   * Check if user has consent
   */
  async hasConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    try {
      const response = await this.client.get<{ hasConsent: boolean }>(
        `/api/consent/${userId}/${consentType}/check`
      );
      return response.data.hasConsent;
    } catch {
      return false;
    }
  }

  /**
   * Get consent by type
   */
  async getConsent(userId: string, consentType: ConsentType): Promise<UserConsent | null> {
    try {
      const response = await this.client.get<GDPRConsentResponse>(
        `/api/consent/${userId}/${consentType}`
      );
      return this.mapConsent(response.data);
    } catch {
      return null;
    }
  }

  /**
   * Export all user data (GDPR)
   */
  async exportData(userId: string): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.get<Record<string, unknown>>(
        `/api/gdpr/export/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to export data:', error);
      return {};
    }
  }

  /**
   * Delete all user data (Right to Erasure)
   */
  async eraseData(userId: string): Promise<boolean> {
    try {
      await this.client.delete(`/api/gdpr/erase/${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to erase data:', error);
      return false;
    }
  }

  /**
   * Get audit trail for user
   */
  async getAuditTrail(userId: string): Promise<Array<{
    action: string;
    timestamp: string;
    details?: string;
  }>> {
    try {
      const response = await this.client.get<{
        data: Array<{
          action: string;
          timestamp: string;
          details?: string;
        }>;
      }>(`/api/gdpr/audit/${userId}`);

      return response.data.data;
    } catch {
      return [];
    }
  }

  /**
   * Map response to standard format
   */
  private mapConsent(data: GDPRConsentResponse): UserConsent {
    return {
      consentType: data.consentType as ConsentType,
      status: this.mapStatus(data.status),
      grantedAt: data.grantedAt,
      expiresAt: data.expiresAt,
    };
  }

  /**
   * Map status string to ConsentStatus
   */
  private mapStatus(status: string): ConsentStatus {
    const statusMap: Record<string, ConsentStatus> = {
      granted: 'granted',
      denied: 'denied',
      withdrawn: 'withdrawn',
      pending: 'pending',
    };
    return statusMap[status] || 'pending';
  }
}

// Singleton export
export const consentIntegration = new ConsentIntegration();
export default consentIntegration;
