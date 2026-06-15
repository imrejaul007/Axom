/**
 * Fraud Service Integration
 * Connects to existing rez-fraud-service and rez-fraud-agent
 */

import axios, { AxiosInstance } from 'axios';

// Service URLs (configurable via environment)
const FRAUD_SERVICE_URL = process.env.FRAUD_SERVICE_URL || 'http://localhost:3001';
const FRAUD_AGENT_URL = process.env.FRAUD_AGENT_URL || 'http://localhost:3007';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'trust-os-internal-token';

import type {
  FraudCheckRequest,
  FraudCheckResult,
  FraudDecision,
  RiskLevel,
  FraudPattern,
} from '../types/index.js';

interface FraudServiceResponse {
  orderId: string;
  customerId: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  action: 'allow' | 'review' | 'block';
}

interface FraudAgentResponse {
  decision: 'ALLOW' | 'DENY' | 'CHALLENGE' | 'REVIEW';
  riskScore: number;
  riskLevel: RiskLevel;
  detectedPatterns: Array<{
    type: string;
    name: string;
    score: number;
    evidence: Record<string, unknown>;
  }>;
  riskFactors: string[];
  caseId?: string;
  requiresAction: boolean;
  processingTimeMs: number;
}

export class FraudIntegration {
  private fraudService: AxiosInstance;
  private fraudAgent: AxiosInstance;

  constructor() {
    this.fraudService = axios.create({
      baseURL: FRAUD_SERVICE_URL,
      timeout: 5000,
      headers: {
        'X-Internal-Token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    this.fraudAgent = axios.create({
      baseURL: FRAUD_AGENT_URL,
      timeout: 5000,
      headers: {
        'X-Internal-Token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Check transaction for fraud
   */
  async checkFraud(request: FraudCheckRequest): Promise<FraudCheckResult> {
    const startTime = Date.now();

    try {
      // Try fraud agent first (more advanced)
      const agentResult = await this.checkWithFraudAgent(request);

      return {
        decision: agentResult.decision,
        riskScore: agentResult.riskScore,
        riskLevel: agentResult.riskLevel,
        detectedPatterns: agentResult.detectedPatterns.map((p) => ({
          type: p.type as FraudPattern['type'],
          name: p.name,
          score: p.score,
          evidence: p.evidence,
        })),
        riskFactors: agentResult.riskFactors,
        caseId: agentResult.caseId,
        requiresAction: agentResult.requiresAction,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (agentError) {
      console.warn('Fraud agent unavailable, falling back to fraud service:', agentError);

      // Fallback to basic fraud service
      try {
        const serviceResult = await this.checkWithFraudService(request);
        return this.mapServiceResult(serviceResult, startTime);
      } catch (serviceError) {
        console.error('Both fraud services unavailable:', serviceError);
        // Return safe default
        return {
          decision: 'REVIEW',
          riskScore: 50,
          riskLevel: 'medium',
          detectedPatterns: [],
          riskFactors: ['Fraud service unavailable - manual review required'],
          requiresAction: true,
          processingTimeMs: Date.now() - startTime,
        };
      }
    }
  }

  /**
   * Check with advanced fraud agent
   */
  private async checkWithFraudAgent(
    request: FraudCheckRequest
  ): Promise<FraudAgentResponse> {
    const response = await this.fraudAgent.post<FraudAgentResponse>(
      '/api/fraud/check',
      {
        transactionId: request.transactionId,
        userId: request.userId,
        accountId: request.accountId,
        amount: request.amount,
        currency: request.currency,
        merchantCategory: request.merchantCategory,
        deviceFingerprint: request.deviceFingerprint,
        deviceType: request.deviceType,
        ipAddress: request.ipAddress,
        billingCountry: request.billingCountry,
        billingCity: request.billingCity,
        cardLast4: request.cardLast4,
        cardType: request.cardType,
        isNewPaymentMethod: request.isNewPaymentMethod,
      }
    );

    return response.data;
  }

  /**
   * Check with basic fraud service
   */
  private async checkWithFraudService(
    request: FraudCheckRequest
  ): Promise<FraudServiceResponse> {
    const response = await this.fraudService.post<FraudServiceResponse>(
      '/api/fraud/check',
      {
        orderId: request.orderId || request.transactionId,
        customerId: request.userId,
        amount: request.amount,
        deviceFingerprint: {
          fingerprintId: request.deviceFingerprint || 'unknown',
          userAgent: request.ipAddress || 'unknown',
          screenResolution: 'unknown',
          timezone: 'unknown',
          language: 'unknown',
          platform: 'unknown',
        },
        ipAddress: request.ipAddress,
        paymentMethod: {
          type: request.cardLast4 ? 'card' : 'upi',
          cardLast4: request.cardLast4,
        },
      }
    );

    return response.data;
  }

  /**
   * Map service result to standard format
   */
  private mapServiceResult(
    result: FraudServiceResponse,
    startTime: number
  ): FraudCheckResult {
    const riskScoreMap: Record<string, number> = {
      low: 20,
      medium: 50,
      high: 75,
      critical: 95,
    };

    const decisionMap: Record<string, FraudDecision> = {
      allow: 'ALLOW',
      review: 'REVIEW',
      block: 'DENY',
    };

    return {
      decision: decisionMap[result.action] || 'REVIEW',
      riskScore: riskScoreMap[result.risk] || 50,
      riskLevel: result.risk as RiskLevel,
      detectedPatterns: result.reasons.map((reason) => ({
        type: 'BUSINESS_RULE_VIOLATION' as const,
        name: reason,
        score: riskScoreMap[result.risk] || 50,
        evidence: { reason },
      })),
      riskFactors: result.reasons,
      requiresAction: result.action !== 'allow',
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Check if entity is blacklisted
   */
  async isBlacklisted(
    type: 'ip' | 'device' | 'user' | 'account',
    value: string
  ): Promise<{ blacklisted: boolean; reason?: string }> {
    try {
      const response = await this.fraudAgent.get<{
        isBlacklisted: boolean;
        reason?: string;
      }>(`/api/blacklist/check/${type}/${value}`);

      return {
        blacklisted: response.data.isBlacklisted,
        reason: response.data.reason,
      };
    } catch {
      return { blacklisted: false };
    }
  }

  /**
   * Get fraud case details
   */
  async getFraudCase(caseId: string): Promise<{
    caseId: string;
    status: string;
    severity: string;
    riskScore: number;
    createdAt: string;
  } | null> {
    try {
      const response = await this.fraudAgent.get(`/api/cases/${caseId}`);
      return response.data;
    } catch {
      return null;
    }
  }

  /**
   * Report confirmed fraud
   */
  async reportFraud(data: {
    transactionId: string;
    userId?: string;
    type: string;
    severity: string;
    details: string;
  }): Promise<void> {
    try {
      await this.fraudAgent.post('/api/cases/report', data);
    } catch (error) {
      console.error('Failed to report fraud:', error);
    }
  }
}

// Singleton export
export const fraudIntegration = new FraudIntegration();
export default fraudIntegration;
