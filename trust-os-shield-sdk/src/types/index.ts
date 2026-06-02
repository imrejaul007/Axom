/**
 * TrustOS Shield SDK - Type Definitions
 */

// ============================================
// TRUST SCORE TYPES
// ============================================

export interface TrustScore {
  overall: number; // 0-1000
  level: TrustLevel;
  dimensions: TrustDimensions;
  lastUpdated: string;
}

export type TrustLevel = 'exceptional' | 'excellent' | 'good' | 'fair' | 'poor' | 'new';

export interface TrustDimensions {
  identity: number;    // 0-100
  financial: number;  // 0-100
  behavioral: number; // 0-100
  reputation: number;  // 0-100
  compliance: number; // 0-100
}

// ============================================
// SCAM DETECTION TYPES
// ============================================

export interface ScamCheckResult {
  isScam: boolean;
  confidence: number;
  riskScore: number; // 0-100
  scamType?: ScamType;
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
// BREACH TYPES
// ============================================

export interface BreachAlert {
  breached: boolean;
  breaches: Breach[];
  riskLevel: RiskLevel;
}

export interface Breach {
  source: string;
  date: string;
  dataTypes: string[];
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// ============================================
// USER TYPES
// ============================================

export interface ShieldUser {
  userId: string;
  trustScore: TrustScore;
  breachStatus?: BreachAlert;
  protectedItems: ProtectedItem[];
  lastSync: string;
}

export interface ProtectedItem {
  type: 'email' | 'phone' | 'aadhaar' | 'pan' | 'passport';
  value: string;
  addedAt: string;
  breachCount: number;
}

// ============================================
// SDK CONFIG
// ============================================

export interface TrustOSShieldConfig {
  apiKey: string;
  apiBaseUrl: string;
  userId?: string;
  enableBackgroundSync?: boolean;
  syncIntervalMs?: number;
  enableNotifications?: boolean;
  onThreatDetected?: (threat: ScamCheckResult) => void;
  onBreachDetected?: (breach: Breach) => void;
}

// ============================================
// SDK RESPONSE
// ============================================

export interface SDKResponse<T> {
  success: boolean;
  data?: T;
  error?: SDKError;
}

export interface SDKError {
  code: string;
  message: string;
}

// ============================================
// UI TYPES
// ============================================

export interface ShieldBannerProps {
  threatLevel: RiskLevel;
  onDismiss: () => void;
  onViewDetails: () => void;
}

export interface TrustScoreDisplayProps {
  score: TrustScore;
  compact?: boolean;
  showDimensions?: boolean;
}

export interface ScamAlertProps {
  result: ScamCheckResult;
  onShare?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
}
