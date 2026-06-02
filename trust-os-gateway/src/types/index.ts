/**
 * TrustOS Unified Types
 * Central type definitions for all trust, fraud, and identity services
 */

// ============================================
// TRUST SCORE TYPES
// ============================================

export interface TrustScore {
  entityId: string;
  entityType: EntityType;
  overall: number; // 0-1000
  dimensions: TrustDimensions;
  factors: TrustFactor[];
  level: TrustLevel;
  lastUpdated: string;
}

export type EntityType = 'person' | 'merchant' | 'device' | 'company' | 'driver' | 'property';

export type TrustLevel = 'exceptional' | 'excellent' | 'good' | 'fair' | 'poor' | 'new';

export interface TrustDimensions {
  identity: number;
  financial: number;
  behavioral: number;
  reputation: number;
  compliance: number;
}

export interface TrustFactor {
  dimension: keyof TrustDimensions;
  positive: string[];
  negative: string[];
  score: number;
}

// ============================================
// FRAUD DETECTION TYPES
// ============================================

export interface FraudCheckRequest {
  transactionId: string;
  userId?: string;
  accountId?: string;
  orderId?: string;
  amount: number;
  currency: string;
  merchantCategory?: string;
  merchantId?: string;
  deviceFingerprint?: string;
  deviceType?: string;
  ipAddress?: string;
  billingCountry?: string;
  billingCity?: string;
  shippingCountry?: string;
  shippingCity?: string;
  cardLast4?: string;
  cardType?: string;
  isNewPaymentMethod?: boolean;
}

export interface FraudCheckResult {
  decision: FraudDecision;
  riskScore: number;
  riskLevel: RiskLevel;
  detectedPatterns: FraudPattern[];
  riskFactors: string[];
  caseId?: string;
  requiresAction: boolean;
  processingTimeMs: number;
}

export type FraudDecision = 'ALLOW' | 'DENY' | 'CHALLENGE' | 'REVIEW';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface FraudPattern {
  type: FraudPatternType;
  name: string;
  score: number;
  evidence: Record<string, unknown>;
}

export type FraudPatternType =
  | 'VELOCITY_ATTACK'
  | 'GEOGRAPHIC_ANOMALY'
  | 'DEVICE_ANOMALY'
  | 'PAYMENT_FRAUD'
  | 'IDENTITY_MISMATCH'
  | 'BUSINESS_RULE_VIOLATION'
  | 'BLACKLISTED_ENTITY'
  | 'IMPOSSIBLE_TRAVEL'
  | 'CARD_TESTING'
  | 'BOT_BEHAVIOR';

// ============================================
// IDENTITY TYPES
// ============================================

export interface IdentityResolutionRequest {
  type: 'email' | 'phone' | 'device' | 'userId' | 'sessionId';
  value: string;
}

export interface IdentityResolution {
  primaryId: string;
  type: 'user' | 'device' | 'session';
  links: IdentityLink[];
  profile: IdentityProfile;
  platforms: PlatformPresence[];
  relationships: IdentityRelationship[];
  risk: IdentityRisk;
  consent: IdentityConsent;
  confidence: number;
  sources: string[];
}

export interface IdentityLink {
  type: 'email' | 'phone' | 'device' | 'device_id' | 'cookie' | 'social';
  value: string;
  verified: boolean;
  linkedAt: string;
}

export interface IdentityProfile {
  firstSeen: string;
  lastSeen: string;
  totalSessions: number;
  source: string[];
}

export interface PlatformPresence {
  platform: string;
  userId: string;
  linked: boolean;
  lastActive: string;
}

export interface IdentityRelationship {
  relatedId: string;
  relationship: 'household' | 'family' | 'shared_device';
  strength: number;
}

export interface IdentityRisk {
  score: number;
  factors: string[];
  lastAssessed: string;
}

export interface IdentityConsent {
  marketing: boolean;
  analytics: boolean;
  thirdParty: boolean;
  updatedAt: string;
}

// ============================================
// CONSENT TYPES
// ============================================

export type ConsentType =
  | 'marketing'
  | 'analytics'
  | 'thirdParty'
  | 'health'
  | 'location'
  | 'financial'
  | 'commerce';

export type ConsentStatus = 'granted' | 'denied' | 'withdrawn' | 'pending';

export interface ConsentRequest {
  userId: string;
  consentType: ConsentType;
  status: ConsentStatus;
  source?: 'banner' | 'form' | 'api' | 'settings';
}

export interface ConsentResponse {
  userId: string;
  consents: UserConsent[];
}

export interface UserConsent {
  consentType: ConsentType;
  status: ConsentStatus;
  grantedAt: string;
  expiresAt?: string;
}

// ============================================
// SCAM DETECTION TYPES
// ============================================

export interface ScamCheckRequest {
  type: 'sms' | 'call' | 'link' | 'whatsapp';
  content: string;
  sender?: string;
  phone?: string;
  url?: string;
  userId?: string;
}

export interface ScamCheckResult {
  isScam: boolean;
  confidence: number;
  scamType?: ScamType;
  riskScore: number;
  reasons: string[];
  warnings: string[];
  recommendations: string[];
}

export type ScamType =
  | 'phishing'
  | 'bank_scam'
  | 'upi_fraud'
  | 'otp_scam'
  | 'job_scam'
  | 'investment_scam'
  | 'fake_support'
  | 'impersonation';

// ============================================
// BREACH/DARK WEB TYPES
// ============================================

export interface BreachCheckRequest {
  email?: string;
  phone?: string;
  documentType?: 'pan' | 'aadhaar' | 'passport';
  documentNumber?: string;
}

export interface BreachCheckResult {
  breached: boolean;
  breaches: Breach[];
  riskLevel: RiskLevel;
  recommendations: string[];
}

export interface Breach {
  source: string;
  date: string;
  dataTypes: string[];
  description: string;
}

// ============================================
// UNIFIED TRUST RESPONSE
// ============================================

export interface UnifiedTrustResponse {
  entityId: string;
  entityType: EntityType;

  // Trust Score
  trustScore: TrustScore;

  // Fraud Check
  fraudCheck?: FraudCheckResult;

  // Identity
  identity?: IdentityResolution;

  // Breach Status
  breachStatus?: BreachCheckResult;

  // Summary
  summary: TrustSummary;

  // Metadata
  queriedAt: string;
  sources: string[];
  processingTimeMs: number;
}

export interface TrustSummary {
  overallRisk: RiskLevel;
  recommendations: string[];
  alerts: TrustAlert[];
  verified: {
    identity: boolean;
    device: boolean;
    payment: boolean;
  };
}

export interface TrustAlert {
  type: 'warning' | 'danger' | 'info';
  code: string;
  message: string;
  action?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  processingTimeMs: number;
}
