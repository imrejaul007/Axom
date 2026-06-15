/**
 * REZ Trust OS - Types
 * @module types
 */

export interface TrustScore {
  userId: string;
  overall: number;
  components: {
    identity: number;
    behavior: number;
    activity: number;
    verification: number;
    history: number;
  };
  lastUpdated: Date;
  tier: TrustTier;
}

export enum TrustTier {
  UNVERIFIED = 'unverified',
  BASIC = 'basic',
  VERIFIED = 'verified',
  TRUSTED = 'trusted',
  PREMIUM = 'premium',
}

export interface TrustHistory {
  userId: string;
  changes: TrustChange[];
}

export interface TrustChange {
  timestamp: Date;
  previousScore: number;
  newScore: number;
  reason: string;
  component: keyof TrustScore['components'];
}

export interface IdentityVerification {
  userId: string;
  status: IdentityStatus;
  kycLevel: KycLevel;
  verifiedAt?: Date;
  documents?: string[];
}

export enum IdentityStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum KycLevel {
  NONE = 0,
  BASIC = 1,
  STANDARD = 2,
  ENHANCED = 3,
}

export interface FraudCheck {
  userId: string;
  risk: FraudRisk;
  flags: FraudFlag[];
  checkedAt: Date;
}

export enum FraudRisk {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum FraudFlag {
  UNUSUAL_LOCATION = 'unusual_location',
  RAPID_ACTIVITY = 'rapid_activity',
  PATTERN_ANOMALY = 'pattern_anomaly',
  SUSPICIOUS_DEVICE = 'suspicious_device',
  VELOCITY_CHECK = 'velocity_check',
}

export interface ReputationScore {
  userId: string;
  score: number;
  reviews: number;
  avgRating: number;
  badges: string[];
  level: ReputationLevel;
}

export enum ReputationLevel {
  NEW = 'new',
  ACTIVE = 'active',
  CONTRIBUTOR = 'contributor',
  EXPERT = 'expert',
  ELITE = 'elite',
}

export interface TrustRequest {
  userId: string;
  action: TrustAction;
  metadata?: Record<string, unknown>;
}

export enum TrustAction {
  LOGIN = 'login',
  TRANSACTION = 'transaction',
  REVIEW = 'review',
  VERIFICATION = 'verification',
  REPORT = 'report',
  APPEAL = 'appeal',
}

export interface TrustResponse {
  success: boolean;
  trustScore?: TrustScore;
  message?: string;
  errors?: string[];
}