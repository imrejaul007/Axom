/**
 * Persona Service - Contextual surfacing for BuzzLocal
 */

import { feedApi } from './api';

export interface Persona {
  userId: string;
  primaryPersona: string;
  secondaryPersonas: string[];
  status: 'active' | 'inactive' | 'developing';
  confidence: number;
  traits: PersonaTraits;
  activityScore: number;
  earnedBadges: string[];
}

export interface PersonaTraits {
  isNightOwl: boolean;
  isEarlyBird: boolean;
  isHomebody: boolean;
  isExplorer: boolean;
  isPriceSensitive: boolean;
  isQualitySeeker: boolean;
  isCommunityFocused: boolean;
  safetyPriority: number;
  activityLevel: 'low' | 'medium' | 'high';
  socialLevel: 'low' | 'medium' | 'high';
}

export interface ContextualSurface {
  topFeatures: string[];
  hiddenFeatures: string[];
  recommendedContent: string[];
  notificationStrategy: {
    frequency: 'minimal' | 'normal' | 'frequent';
    bestTimes: string[];
    excludeTimes: string[];
  };
  uiOverrides: {
    heroSection: string;
    quickActions: string[];
    tabOrder: string[];
  };
}

export interface PersonaDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  features: string[];
  contextTriggers: {
    time?: string[];
    location?: string[];
    dayOfWeek?: string[];
  };
}

const PERSONA_SERVICE_URL = process.env.PERSONA_SERVICE_URL || 'http://localhost:4025';

/**
 * Get current user's persona
 */
export async function getMyPersona(): Promise<Persona | null> {
  try {
    const response = await feedApi.get<Persona>(`${PERSONA_SERVICE_URL}/api/personas/me`);
    return response.data || null;
  } catch {
    return null;
  }
}

/**
 * Get contextual surface for current user
 */
export async function getContextualSurface(
  context: { time?: string; location?: string; dayOfWeek?: string }
): Promise<ContextualSurface | null> {
  try {
    const params = new URLSearchParams();
    if (context.time) params.set('time', context.time);
    if (context.location) params.set('location', context.location);
    if (context.dayOfWeek) params.set('dayOfWeek', context.dayOfWeek);

    const response = await feedApi.get<ContextualSurface>(
      `${PERSONA_SERVICE_URL}/api/personas/contextual?${params.toString()}`
    );
    return response.data || null;
  } catch {
    return null;
  }
}

/**
 * Get all persona definitions
 */
export async function getPersonaDefinitions(): Promise<PersonaDefinition[]> {
  try {
    const response = await feedApi.get<{ personas: PersonaDefinition[] }>(
      `${PERSONA_SERVICE_URL}/api/personas/definitions`
    );
    return response.data?.personas || [];
  } catch {
    return [];
  }
}

/**
 * Detect persona from actions
 */
export async function detectPersona(
  actions: string[],
  context?: { time?: string; location?: string; dayOfWeek?: string }
): Promise<{ primary: string; scores: Record<string, number> } | null> {
  try {
    const response = await feedApi.post(`${PERSONA_SERVICE_URL}/api/personas/detect`, {
      actions,
      context,
    });
    return response.data;
  } catch {
    return null;
  }
}

/**
 * Claim a specific persona
 */
export async function claimPersona(personaType: string): Promise<boolean> {
  try {
    await feedApi.post(`${PERSONA_SERVICE_URL}/api/personas/claim/${personaType}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get persona leaderboard
 */
export async function getPersonaLeaderboard(
  personaType: string,
  limit = 10
): Promise<{ userId: string; activityScore: number; earnedBadges: string[] }[]> {
  try {
    const response = await feedApi.get(
      `${PERSONA_SERVICE_URL}/api/personas/leaderboard/${personaType}?limit=${limit}`
    );
    return response.data?.leaderboard || [];
  } catch {
    return [];
  }
}

/**
 * Get persona streaks
 */
export async function getPersonaStreaks(): Promise<{ persona: string; currentStreak: number; longestStreak: number }[]> {
  try {
    const response = await feedApi.get(`${PERSONA_SERVICE_URL}/api/personas/streaks`);
    return response.data?.streaks || [];
  } catch {
    return [];
  }
}

/**
 * Log persona activity
 */
export async function logPersonaActivity(
  action: string,
  context?: { time?: Date; location?: { lat: number; lng: number; area: string }; mood?: string },
  metadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    await feedApi.post(`${PERSONA_SERVICE_URL}/api/personas/activity`, {
      action,
      context,
      metadata,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get persona stats
 */
export async function getPersonaStats(): Promise<Record<string, { count: number; avgConfidence: number }>> {
  try {
    const response = await feedApi.get(`${PERSONA_SERVICE_URL}/api/personas/stats`);
    return response.data?.stats || {};
  } catch {
    return {};
  }
}

// ===== CONTEXT UTILITIES =====

/**
 * Get current time context
 */
export function getTimeContext(): 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  if (hour >= 21 && hour < 24) return 'night';
  return 'late_night';
}

/**
 * Get day context
 */
export function getDayContext(): 'weekday' | 'weekend' {
  const day = new Date().getDay();
  return day === 0 || day === 6 ? 'weekend' : 'weekday';
}

/**
 * Get location context (would use actual location in production)
 */
export async function getLocationContext(): Promise<'home' | 'work' | 'commuting' | 'exploring' | 'social'> {
  // Placeholder - would use geofencing in production
  return 'exploring';
}

/**
 * Apply contextual surface to app state
 */
export async function getContextualConfig(): Promise<{
  surface: ContextualSurface | null;
  persona: Persona | null;
}> {
  const [surface, persona] = await Promise.all([
    getContextualSurface({
      time: getTimeContext(),
      dayOfWeek: getDayContext(),
    }),
    getMyPersona(),
  ]);

  return { surface, persona };
}

// ===== DEFAULT PERSONA =====

export const DEFAULT_SURFACE: ContextualSurface = {
  topFeatures: ['feed', 'events', 'offers', 'vibe_map'],
  hiddenFeatures: ['society', 'crisis'],
  recommendedContent: ['feed'],
  notificationStrategy: {
    frequency: 'normal',
    bestTimes: ['9:00', '12:00', '18:00'],
    excludeTimes: ['22:00', '23:00', '0:00'],
  },
  uiOverrides: {
    heroSection: 'discover',
    quickActions: ['ask', 'explore', 'checkin'],
    tabOrder: ['discover', 'ask', 'safe', 'society', 'profile'],
  },
};

// ===== FEATURE FLAGS BY PERSONA =====

export const PERSONA_FEATURES: Record<string, string[]> = {
  food_scout: ['food_recommendations', 'restaurant_reviews', 'deal_notifications'],
  nightlife_hunter: ['event_invites', 'crowd_alerts', 'vibe_updates'],
  fitness_enthusiast: ['fitness_recommendations', 'class_invites', 'health_tips'],
  deal_hunter: ['price_alerts', 'flash_deals', 'cashback_tracking'],
  event_insider: ['event_invites', 'reminders', 'calendar_sync'],
  society_guardian: ['safety_alerts', 'visitor_management', 'emergency_sos'],
  startup_insider: ['event_invites', 'networking_alerts', 'trend_updates'],
  campus_leader: ['campus_events', 'study_groups', 'local_discounts'],
  safety_first: ['safe_routes', 'sos_button', 'trusted_circle', 'women_safety_mode'],
  commuter: ['traffic_alerts', 'route_optimization', 'commute_deals'],
  homebody: ['delivery_deals', 'home_services', 'comfort_recommendations'],
  explorer: ['discovery_recommendations', 'hidden_gem_alerts', 'vibe_updates'],
  early_bird: ['morning_deals', 'early_access', 'breakfast_recommendations'],
  late_owl: ['late_night_deals', 'quiet_place_alerts', 'safety_updates'],
};
