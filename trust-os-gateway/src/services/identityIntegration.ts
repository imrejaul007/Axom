/**
 * Identity Service Integration
 * Connects to existing REZ-unified-identity and REZ-identity-service
 */

import axios, { AxiosInstance } from 'axios';

// Service URLs
const UNIFIED_IDENTITY_URL = process.env.UNIFIED_IDENTITY_URL || 'http://localhost:4060';
const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || 'http://localhost:4000';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'trust-os-internal-token';

import type {
  IdentityResolutionRequest,
  IdentityResolution,
  IdentityLink,
  IdentityProfile,
  PlatformPresence,
  IdentityRelationship,
  IdentityRisk,
  IdentityConsent,
  EntityType,
} from '../types/index.js';

interface UnifiedIdentityResponse {
  primaryId: string;
  type: 'user' | 'device' | 'session';
  links: Array<{
    type: string;
    value: string;
    verified: boolean;
    linkedAt: string;
  }>;
  profile: {
    firstSeen: string;
    lastSeen: string;
    totalSessions: number;
    source: string[];
  };
  platforms: Array<{
    platform: string;
    userId: string;
    linked: boolean;
    lastActive: string;
  }>;
  relationships: Array<{
    relatedId: string;
    relationship: 'household' | 'family' | 'shared_device';
    strength: number;
  }>;
  risk: {
    score: number;
    factors: string[];
    lastAssessed: string;
  };
  consent: {
    marketing: boolean;
    analytics: boolean;
    thirdParty: boolean;
    updatedAt: string;
  };
}

interface IdentityServiceResponse {
  identityId: string;
  userId: string;
  provider: string;
  email?: string;
  phone?: string;
  linkedAt: string;
  confidence: number;
}

export class IdentityIntegration {
  private unifiedIdentity: AxiosInstance;
  private identityService: AxiosInstance;

  constructor() {
    this.unifiedIdentity = axios.create({
      baseURL: UNIFIED_IDENTITY_URL,
      timeout: 5000,
      headers: {
        'X-Internal-Token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    this.identityService = axios.create({
      baseURL: IDENTITY_SERVICE_URL,
      timeout: 5000,
      headers: {
        'X-Internal-Token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Resolve identity from any identifier
   */
  async resolve(request: IdentityResolutionRequest): Promise<IdentityResolution | null> {
    try {
      // Try unified identity first
      const response = await this.unifiedIdentity.post<UnifiedIdentityResponse>(
        '/api/identity/resolve',
        {
          type: request.type,
          value: request.value,
        }
      );

      return this.mapResponse(response.data);
    } catch (unifiedError) {
      console.warn('Unified identity unavailable, trying identity service:', unifiedError);

      // Fallback to identity service
      try {
        return await this.resolveFromIdentityService(request);
      } catch {
        console.error('Identity services unavailable');
        return null;
      }
    }
  }

  /**
   * Resolve from identity service
   */
  private async resolveFromIdentityService(
    request: IdentityResolutionRequest
  ): Promise<IdentityResolution | null> {
    try {
      const response = await this.identityService.get<IdentityServiceResponse>(
        `/identities/${request.type}/${request.value}`
      );

      const data = response.data;
      return {
        primaryId: data.identityId,
        type: 'user',
        links: [
          {
            type: request.type as IdentityLink['type'],
            value: request.value,
            verified: true,
            linkedAt: data.linkedAt,
          },
        ],
        profile: {
          firstSeen: data.linkedAt,
          lastSeen: data.linkedAt,
          totalSessions: 0,
          source: [data.provider],
        },
        platforms: [
          {
            platform: data.provider,
            userId: data.userId,
            linked: true,
            lastActive: data.linkedAt,
          },
        ],
        relationships: [],
        risk: {
          score: 0.5,
          factors: [],
          lastAssessed: new Date().toISOString(),
        },
        consent: {
          marketing: false,
          analytics: true,
          thirdParty: false,
          updatedAt: new Date().toISOString(),
        },
        confidence: data.confidence,
        sources: [data.provider],
      };
    } catch {
      return null;
    }
  }

  /**
   * Link two identities
   */
  async link(
    sourceId: string,
    targetId: string,
    linkType: 'email' | 'phone' | 'device' | 'social',
    value: string
  ): Promise<boolean> {
    try {
      await this.unifiedIdentity.post('/api/identity/link', {
        sourceId,
        targetId,
        type: linkType,
        value,
      });
      return true;
    } catch (error) {
      console.error('Failed to link identities:', error);
      return false;
    }
  }

  /**
   * Unlink identities
   */
  async unlink(sourceId: string, targetId: string): Promise<boolean> {
    try {
      await this.unifiedIdentity.delete(`/api/identity/link/${sourceId}/${targetId}`);
      return true;
    } catch (error) {
      console.error('Failed to unlink identities:', error);
      return false;
    }
  }

  /**
   * Get unified profile
   */
  async getProfile(request: IdentityResolutionRequest): Promise<IdentityResolution | null> {
    return this.resolve(request);
  }

  /**
   * Add device to identity
   */
  async addDevice(
    userId: string,
    deviceId: string,
    deviceInfo: {
      type: 'ios' | 'android' | 'web' | 'kiosk';
      fingerprint?: string;
    }
  ): Promise<boolean> {
    try {
      await this.unifiedIdentity.post('/api/identity/device', {
        userId,
        deviceId,
        ...deviceInfo,
      });
      return true;
    } catch (error) {
      console.error('Failed to add device:', error);
      return false;
    }
  }

  /**
   * Get all devices for user
   */
  async getDevices(userId: string): Promise<string[]> {
    try {
      const response = await this.unifiedIdentity.get<{ devices: string[] }>(
        `/api/identity/${userId}/devices`
      );
      return response.data.devices || [];
    } catch {
      return [];
    }
  }

  /**
   * Get risk score for identity
   */
  async getRiskScore(request: IdentityResolutionRequest): Promise<{
    score: number;
    factors: string[];
  }> {
    try {
      const response = await this.unifiedIdentity.get<{ score: number; factors: string[] }>(
        `/api/risk/${request.type}/${request.value}`
      );
      return response.data;
    } catch {
      return { score: 0.5, factors: ['unknown'] };
    }
  }

  /**
   * Export all data for user (GDPR)
   */
  async exportData(userId: string): Promise<Record<string, unknown>> {
    try {
      const response = await this.unifiedIdentity.get<Record<string, unknown>>(
        `/api/export/${userId}`
      );
      return response.data;
    } catch {
      return {};
    }
  }

  /**
   * Delete all data for user (GDPR Right to Erasure)
   */
  async deleteData(userId: string): Promise<boolean> {
    try {
      await this.unifiedIdentity.delete(`/api/identity/${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete identity data:', error);
      return false;
    }
  }

  /**
   * Get entity type from resolution
   */
  getEntityType(identity: IdentityResolution): EntityType {
    if (identity.type === 'device') return 'device';
    if (identity.platforms.length > 0) return 'person';
    return 'person';
  }

  /**
   * Map response to standard format
   */
  private mapResponse(data: UnifiedIdentityResponse): IdentityResolution {
    return {
      primaryId: data.primaryId,
      type: data.type as 'user' | 'device' | 'session',
      links: data.links.map((link) => ({
        type: link.type as IdentityLink['type'],
        value: link.value,
        verified: link.verified,
        linkedAt: link.linkedAt,
      })),
      profile: {
        firstSeen: data.profile.firstSeen,
        lastSeen: data.profile.lastSeen,
        totalSessions: data.profile.totalSessions,
        source: data.profile.source,
      },
      platforms: data.platforms.map((p) => ({
        platform: p.platform,
        userId: p.userId,
        linked: p.linked,
        lastActive: p.lastActive,
      })),
      relationships: data.relationships.map((r) => ({
        relatedId: r.relatedId,
        relationship: r.relationship,
        strength: r.strength,
      })),
      risk: {
        score: data.risk.score,
        factors: data.risk.factors,
        lastAssessed: data.risk.lastAssessed,
      },
      consent: {
        marketing: data.consent.marketing,
        analytics: data.consent.analytics,
        thirdParty: data.consent.thirdParty,
        updatedAt: data.consent.updatedAt,
      },
      confidence: 0.95,
      sources: ['unified-identity'],
    };
  }
}

// Singleton export
export const identityIntegration = new IdentityIntegration();
export default identityIntegration;
