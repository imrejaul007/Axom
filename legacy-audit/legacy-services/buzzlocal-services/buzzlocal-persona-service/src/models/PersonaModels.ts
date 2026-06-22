import mongoose, { Document, Schema } from 'mongoose';

// ===== PERSONA TYPES =====

export type PersonaType =
  | 'food_scout'
  | 'nightlife_hunter'
  | 'fitness_enthusiast'
  | 'deal_hunter'
  | 'event_insider'
  | 'society_guardian'
  | 'startup_insider'
  | 'campus_leader'
  | 'safety_first'
  | 'commuter'
  | 'homebody'
  | 'explorer'
  | 'early_bird'
  | 'late_owl';

export type PersonaStatus = 'active' | 'inactive' | 'developing';

// ===== PERSONA INTERFACES =====

export interface IPersona extends Document {
  userId: string;
  primaryPersona: PersonaType;
  secondaryPersonas: PersonaType[];
  status: PersonaStatus;
  confidence: number; // 0-1
  traits: PersonaTraits;
  activityScore: number;
  lastActive: Date;
  earnedBadges: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonaTraits {
  // Behavior
  isNightOwl: boolean;
  isEarlyBird: boolean;
  isHomebody: boolean;
  isExplorer: boolean;

  // Commerce
  isPriceSensitive: boolean;
  isQualitySeeker: boolean;
  isImpulseBuyer: boolean;

  // Social
  isCommunityFocused: boolean;
  isTrendFollower: boolean;
  isInfluencer: boolean;

  // Safety
  safetyPriority: number; // 0-10
  isSafetyConscious: boolean;

  // Activity
  activityLevel: 'low' | 'medium' | 'high';
  socialLevel: 'low' | 'medium' | 'high';
}

export interface IActivityLog extends Document {
  userId: string;
  persona: PersonaType;
  action: string;
  context: {
    time: Date;
    location?: { lat: number; lng: number; area: string };
    mood?: 'productive' | 'relaxed' | 'social' | 'adventurous';
  };
  metadata: Record<string, any>;
}

export interface IStreak extends Document {
  userId: string;
  persona: PersonaType;
  currentStreak: number;
  longestStreak: number;
  lastActivity: Date;
  milestones: number[];
}

// ===== BEHAVIORAL SIGNALS =====

export interface BehavioralSignal {
  type: string;
  weight: number;
  value: number;
  lastUpdated: Date;
}

export interface IUserBehavioralProfile extends Document {
  userId: string;
  signals: BehavioralSignal[];
  timePreferences: {
    peakActivityHours: number[];
    preferredDays: string[];
    seasonal: Record<string, number>;
  };
  locationPatterns: {
    frequentAreas: string[];
    commuteRoute?: string;
    homeArea: string;
    workArea?: string;
  };
  interactionPatterns: {
    avgSessionDuration: number;
    sessionsPerDay: number;
    avgResponseTime: number;
    engagementRate: number;
  };
  categoryAffinities: Record<string, number>; // category -> score
  merchantAffinities: Record<string, number>; // merchant -> score
  updatedAt: Date;
}

// ===== CONTEXTUAL CONTEXT =====

export interface ContextState {
  time: 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night';
  dayOfWeek: 'weekday' | 'weekend';
  location: 'home' | 'work' | 'commuting' | 'exploring' | 'social';
  mood?: 'productive' | 'relaxed' | 'social' | 'adventurous';
  isHoliday: boolean;
  isRushHour: boolean;
}

// ===== SCHEMAS =====

const personaSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  primaryPersona: {
    type: String,
    enum: [
      'food_scout',
      'nightlife_hunter',
      'fitness_enthusiast',
      'deal_hunter',
      'event_insider',
      'society_guardian',
      'startup_insider',
      'campus_leader',
      'safety_first',
      'commuter',
      'homebody',
      'explorer',
      'early_bird',
      'late_owl',
    ],
    required: true,
  },
  secondaryPersonas: [{
    type: String,
    enum: ['food_scout', 'nightlife_hunter', 'fitness_enthusiast', 'deal_hunter', 'event_insider', 'society_guardian', 'startup_insider', 'campus_leader', 'safety_first', 'commuter', 'homebody', 'explorer', 'early_bird', 'late_owl'],
  }],
  status: { type: String, enum: ['active', 'inactive', 'developing'], default: 'active' },
  confidence: { type: Number, default: 0, min: 0, max: 1 },
  traits: {
    isNightOwl: { type: Boolean, default: false },
    isEarlyBird: { type: Boolean, default: false },
    isHomebody: { type: Boolean, default: false },
    isExplorer: { type: Boolean, default: false },
    isPriceSensitive: { type: Boolean, default: false },
    isQualitySeeker: { type: Boolean, default: false },
    isImpulseBuyer: { type: Boolean, default: false },
    isCommunityFocused: { type: Boolean, default: false },
    isTrendFollower: { type: Boolean, default: false },
    isInfluencer: { type: Boolean, default: false },
    safetyPriority: { type: Number, default: 5, min: 0, max: 10 },
    isSafetyConscious: { type: Boolean, default: false },
    activityLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    socialLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  },
  activityScore: { type: Number, default: 0 },
  earnedBadges: [String],
}, { timestamps: true });

personaSchema.index({ primaryPersona: 1 });
personaSchema.index({ status: 1 });

const activityLogSchema = new Schema({
  userId: { type: String, required: true, index: true },
  persona: String,
  action: String,
  context: {
    time: Date,
    location: {
      lat: Number,
      lng: Number,
      area: String,
    },
    mood: String,
  },
  metadata: Schema.Types.Mixed,
}, { timestamps: true });

activityLogSchema.index({ userId: 1, createdAt: -1 });

const streakSchema = new Schema({
  userId: String,
  persona: String,
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActivity: Date,
  milestones: [Number],
});

streakSchema.index({ userId: 1, persona: 1 }, { unique: true });

const behavioralProfileSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  signals: [{
    type: String,
    weight: Number,
    value: Number,
    lastUpdated: Date,
  }],
  timePreferences: {
    peakActivityHours: [Number],
    preferredDays: [String],
    seasonal: Schema.Types.Mixed,
  },
  locationPatterns: {
    frequentAreas: [String],
    commuteRoute: String,
    homeArea: String,
    workArea: String,
  },
  interactionPatterns: {
    avgSessionDuration: Number,
    sessionsPerDay: Number,
    avgResponseTime: Number,
    engagementRate: Number,
  },
  categoryAffinities: Schema.Types.Mixed,
  merchantAffinities: Schema.Types.Mixed,
}, { timestamps: true });

// ===== EXPORT MODELS =====

export const Persona = mongoose.model<IPersona>('Persona', personaSchema);
export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
export const Streak = mongoose.model<IStreak>('Streak', streakSchema);
export const UserBehavioralProfile = mongoose.model<IUserBehavioralProfile>('UserBehavioralProfile', behavioralProfileSchema);
