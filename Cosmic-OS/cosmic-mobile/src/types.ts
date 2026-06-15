/**
 * Cosmic OS - Type Definitions
 */

// ============================================
// COSMIC CONTEXT
// ============================================

export interface PlanetPosition {
  planet: string;
  sign: string;
  degree: number;
  house: number;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  type: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';
  orb: number;
}

export interface CosmicState {
  planets: PlanetPosition[];
  aspects: Aspect[];
  moonPhase: string;
  retrograde: string[];
}

export interface DailyReading {
  date: string;
  overview: string;
  luckyNumber: number;
  luckyColor: string;
  compatibleSign: string;
  mantra: string;
  affirmations: string[];
  warnings: string[];
  cosmicTip: string;
}

export interface CosmicContextResponse {
  userId: string;
  cosmic: CosmicState;
  birthChart: {
    sunSign: string;
    moonSign: string;
    risingSign: string;
    planets: PlanetPosition[];
  };
  currentTransits: {
    active: string[];
    dominant: string;
    challenging: string[];
  };
}

// ============================================
// COUNCIL OF AGENTS
// ============================================

export interface AgentInsight {
  agent: string;
  domain: string;
  advice: string;
  confidence: number;
}

export interface CouncilResponse {
  council: AgentInsight[];
  consensus: string;
  actionItems: string[];
}

// ============================================
// MOOD CHECK-IN
// ============================================

export interface MoodCheckIn {
  userId: string;
  mood: 'excellent' | 'good' | 'neutral' | 'low' | 'bad';
  energy: number; // 1-10
  stress: number; // 1-10
  notes?: string;
  domain?: 'career' | 'health' | 'relationships' | 'finance' | 'spiritual';
}

export interface MoodResponse {
  success: boolean;
  moodId: string;
  streak: WellnessStreak;
  insights: {
    pattern: string;
    recommendation: string;
  };
}

export interface WellnessStreak {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckIn: string;
  weeklyGoal: number;
  weeklyProgress: number;
}

// ============================================
// DOMAIN GUIDANCE
// ============================================

export type Domain = 'career' | 'health' | 'relationships' | 'finance' | 'spiritual';

export interface DomainGuidance {
  domain: Domain;
  title: string;
  overview: string;
  actionItems: string[];
  warnings: string[];
  affirmations: string[];
  luckyElement: string;
  bestTime: string;
}

// ============================================
// AI LIFE AGENTS
// ============================================

export interface Agent {
  id: string;
  name: string;
  domain: Domain;
  avatar: string;
  expertise: string[];
  personality: string;
  description: string;
  availability: 'online' | 'busy' | 'offline';
}

// ============================================
// USER
// ============================================

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthDate: string;
  birthTime?: string;
  birthPlace?: string;
  avatar?: string;
  createdAt: string;
  preferences: {
    theme: 'dark' | 'light';
    notifications: boolean;
    language: string;
  };
}

export interface UserWallet {
  coins: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  transactions: {
    id: string;
    type: 'earned' | 'spent';
    amount: number;
    description: string;
    timestamp: string;
  }[];
}

// ============================================
// REWARDS
// ============================================

export interface RewardsResponse {
  coinsEarned: number;
  newBalance: number;
  achievements: {
    id: string;
    name: string;
    description: string;
    icon: string;
  }[];
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
