/**
 * Persona Configuration - Define all BuzzLocal personas
 */

import { PersonaType } from '../models/PersonaModels';

export interface PersonaDefinition {
  id: PersonaType;
  name: string;
  icon: string;
  description: string;

  // Detection keywords
  keywords: string[];

  // Context triggers
  contextTriggers: {
    time?: ('morning' | 'afternoon' | 'evening' | 'night' | 'late_night')[];
    location?: ('home' | 'work' | 'commuting' | 'exploring' | 'social')[];
    dayOfWeek?: ('weekday' | 'weekend')[];
  };

  // Feed priorities
  feedPriorities: string[];

  // Badge unlocks
  badgeUnlocks: {
    threshold: number;
    badgeId: string;
    badgeName: string;
  }[];

  // Feature gates
  features: string[];
}

export const PERSONA_DEFINITIONS: Record<PersonaType, PersonaDefinition> = {
  food_scout: {
    id: 'food_scout',
    name: 'Food Scout',
    icon: '🍔',
    description: 'You discover and review the best local food spots',
    keywords: ['restaurant', 'food', 'biryani', 'cafe', 'dining', 'cuisine', 'dish', 'order', 'eat', 'taste'],
    contextTriggers: {
      time: ['morning', 'afternoon', 'evening'],
      location: ['exploring', 'social'],
    },
    feedPriorities: ['offers', 'events', 'vibe_map', 'feed'],
    badgeUnlocks: [
      { threshold: 10, badgeId: 'foodie_newbie', badgeName: 'Foodie Newbie' },
      { threshold: 50, badgeId: 'taste_maker', badgeName: 'Taste Maker' },
      { threshold: 100, badgeId: 'local_gourmet', badgeName: 'Local Gourmet' },
    ],
    features: ['food_recommendations', 'restaurant_reviews', 'deal_notifications'],
  },

  nightlife_hunter: {
    id: 'nightlife_hunter',
    name: 'Nightlife Hunter',
    icon: '🌙',
    description: 'You know where the party is and when',
    keywords: ['pub', 'bar', 'club', 'party', 'night', 'drinks', 'lounge', 'evening', 'weekend'],
    contextTriggers: {
      time: ['evening', 'night', 'late_night'],
      dayOfWeek: ['weekend'],
    },
    feedPriorities: ['events', 'vibe_map', 'offers', 'alerts'],
    badgeUnlocks: [
      { threshold: 10, badgeId: 'night_owl', badgeName: 'Night Owl' },
      { threshold: 50, badgeId: 'party_starter', badgeName: 'Party Starter' },
      { threshold: 100, badgeId: 'social_butterfly', badgeName: 'Social Butterfly' },
    ],
    features: ['event_invites', 'crowd_alerts', 'vibe_updates'],
  },

  fitness_enthusiast: {
    id: 'fitness_enthusiast',
    name: 'Fitness Enthusiast',
    icon: '💪',
    description: 'You live for workouts and healthy living',
    keywords: ['gym', 'fitness', 'workout', 'yoga', 'running', 'exercise', 'health', 'training'],
    contextTriggers: {
      time: ['morning', 'afternoon'],
      location: ['work', 'exploring'],
    },
    feedPriorities: ['services', 'offers', 'events', 'feed'],
    badgeUnlocks: [
      { threshold: 10, badgeId: 'gym_goer', badgeName: 'Gym Goer' },
      { threshold: 50, badgeId: 'fitness_fan', badgeName: 'Fitness Fan' },
      { threshold: 100, badgeId: 'wellness_warrior', badgeName: 'Wellness Warrior' },
    ],
    features: ['fitness_recommendations', 'class_invites', 'health_tips'],
  },

  deal_hunter: {
    id: 'deal_hunter',
    name: 'Deal Hunter',
    icon: '🏷️',
    description: 'You always find the best bargains',
    keywords: ['sale', 'discount', 'offer', 'deal', 'cheap', 'budget', 'save', ' bargain', 'free'],
    contextTriggers: {
      time: ['morning', 'afternoon'],
    },
    feedPriorities: ['offers', 'marketplace', 'services', 'feed'],
    badgeUnlocks: [
      { threshold: 10, badgeId: 'bargain_finder', badgeName: 'Bargain Finder' },
      { threshold: 50, badgeId: 'smart_shopper', badgeName: 'Smart Shopper' },
      { threshold: 100, badgeId: 'deal_master', badgeName: 'Deal Master' },
    ],
    features: ['price_alerts', 'flash_deals', 'cashback_tracking'],
  },

  event_insider: {
    id: 'event_insider',
    name: 'Event Insider',
    icon: '🎭',
    description: 'You never miss what\'s happening in the city',
    keywords: ['event', 'concert', 'festival', 'workshop', 'meetup', 'happening', 'today'],
    contextTriggers: {
      dayOfWeek: ['weekend'],
    },
    feedPriorities: ['events', 'feed', 'offers', 'vibe_map'],
    badgeUnlocks: [
      { threshold: 5, badgeId: 'event_explorer', badgeName: 'Event Explorer' },
      { threshold: 20, badgeId: 'social_star', badgeName: 'Social Star' },
      { threshold: 50, badgeId: 'event_maven', badgeName: 'Event Maven' },
    ],
    features: ['event_invites', 'reminders', 'calendar_sync'],
  },

  society_guardian: {
    id: 'society_guardian',
    name: 'Society Guardian',
    icon: '🏠',
    description: 'You keep your community safe and informed',
    keywords: ['society', 'apartment', 'security', 'safety', 'neighbor', 'community', 'alert'],
    contextTriggers: {
      location: ['home'],
    },
    feedPriorities: ['alerts', 'society', 'safety', 'feed'],
    badgeUnlocks: [
      { threshold: 10, badgeId: 'watchful_eye', badgeName: 'Watchful Eye' },
      { threshold: 50, badgeId: 'guardian_angel', badgeName: 'Guardian Angel' },
      { threshold: 100, badgeId: 'community_hero', badgeName: 'Community Hero' },
    ],
    features: ['safety_alerts', 'visitor_management', 'emergency_sos'],
  },

  startup_insider: {
    id: 'startup_insider',
    name: 'Startup Insider',
    icon: '🚀',
    description: 'You\'re connected to the startup ecosystem',
    keywords: ['startup', 'networking', 'tech', 'business', 'investor', 'founder', 'co-working'],
    contextTriggers: {
      time: ['morning', 'afternoon'],
      location: ['work', 'exploring'],
    },
    feedPriorities: ['events', 'feed', 'offers', 'society'],
    badgeUnlocks: [
      { threshold: 10, badgeId: 'networker', badgeName: 'Networker' },
      { threshold: 50, badgeId: 'ecosystem_builder', badgeName: 'Ecosystem Builder' },
      { threshold: 100, badgeId: 'startup_maven', badgeName: 'Startup Maven' },
    ],
    features: ['event_invites', 'networking_alerts', 'trend_updates'],
  },

  campus_leader: {
    id: 'campus_leader',
    name: 'Campus Leader',
    icon: '🎓',
    description: 'You\'re the go-to person on campus',
    keywords: ['college', 'campus', 'student', 'study', 'exam', 'hostel', 'class'],
    contextTriggers: {
      location: ['work'],
    },
    feedPriorities: ['events', 'feed', 'services', 'offers'],
    badgeUnlocks: [
      { threshold: 10, badgeId: 'freshman', badgeName: 'Freshman' },
      { threshold: 50, badgeId: 'campus_connect', badgeName: 'Campus Connect' },
      { threshold: 100, badgeId: 'senior_leader', badgeName: 'Senior Leader' },
    ],
    features: ['campus_events', 'study_groups', 'local_discounts'],
  },

  safety_first: {
    id: 'safety_first',
    name: 'Safety First',
    icon: '🛡️',
    description: 'Your safety is your top priority',
    keywords: ['safe', 'safety', 'secure', 'route', 'night', 'women'],
    contextTriggers: {
      time: ['night', 'late_night'],
      location: ['commuting', 'exploring'],
    },
    feedPriorities: ['safety', 'alerts', 'society', 'feed'],
    badgeUnlocks: [
      { threshold: 10, badgeId: 'safety_aware', badgeName: 'Safety Aware' },
      { threshold: 50, badgeId: 'safety_champion', badgeName: 'Safety Champion' },
      { threshold: 100, badgeId: 'guardian_spirit', badgeName: 'Guardian Spirit' },
    ],
    features: ['safe_routes', 'sos_button', 'trusted_circle', 'women_safety_mode'],
  },

  commuter: {
    id: 'commuter',
    name: 'Urban Commuter',
    icon: '🚇',
    description: 'You master the city\'s transit',
    keywords: ['metro', 'bus', 'traffic', 'commute', 'route', 'office', 'travel'],
    contextTriggers: {
      time: ['morning', 'afternoon', 'evening'],
      location: ['commuting'],
    },
    feedPriorities: ['alerts', 'offers', 'events', 'vibe_map'],
    badgeUnlocks: [
      { threshold: 10, badgeId: 'daily_commuter', badgeName: 'Daily Commuter' },
      { threshold: 50, badgeId: 'route_master', badgeName: 'Route Master' },
      { threshold: 100, badgeId: 'city_navigator', badgeName: 'City Navigator' },
    ],
    features: ['traffic_alerts', 'route_optimization', 'commute_deals'],
  },

  homebody: {
    id: 'homebody',
    name: 'Home Body',
    icon: '🏡',
    description: 'You love staying in and enjoying home',
    keywords: ['home', 'delivery', 'order', 'cook', 'relax', 'Netflix', 'cozy'],
    contextTriggers: {
      time: ['evening', 'night'],
      location: ['home'],
    },
    feedPriorities: ['offers', 'marketplace', 'services', 'feed'],
    badgeUnlocks: [
      { threshold: 10, badgeId: 'home_haven', badgeName: 'Home Haven' },
      { threshold: 50, badgeId: 'cozy_creator', badgeName: 'Cozy Creator' },
      { threshold: 100, badgeId: 'domestic_deity', badgeName: 'Domestic Deity' },
    ],
    features: ['delivery_deals', 'home_services', 'comfort_recommendations'],
  },

  explorer: {
    id: 'explorer',
    name: 'Local Explorer',
    icon: '🗺️',
    description: 'You\'re always discovering new places',
    keywords: ['explore', 'discover', 'new', 'hidden', 'gem', 'place', 'visit'],
    contextTriggers: {
      time: ['morning', 'afternoon'],
      dayOfWeek: ['weekend'],
    },
    feedPriorities: ['vibe_map', 'events', 'feed', 'offers'],
    badgeUnlocks: [
      { threshold: 10, badgeId: 'wanderer', badgeName: 'Wanderer' },
      { threshold: 50, badgeId: 'local_expert', badgeName: 'Local Expert' },
      { threshold: 100, badgeId: 'city_sage', badgeName: 'City Sage' },
    ],
    features: ['discovery_recommendations', 'hidden_gem_alerts', 'vibe_updates'],
  },

  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    icon: '🐦',
    description: 'You rise with the sun',
    keywords: ['morning', 'breakfast', 'early', 'sunrise', 'exercise', 'yoga', 'walk'],
    contextTriggers: {
      time: ['morning'],
    },
    feedPriorities: ['events', 'offers', 'feed', 'vibe_map'],
    badgeUnlocks: [
      { threshold: 10, badgeId: 'dawn_patrol', badgeName: 'Dawn Patrol' },
      { threshold: 50, badgeId: 'sunrise_seeker', badgeName: 'Sunrise Seeker' },
      { threshold: 100, badgeId: 'morning_master', badgeName: 'Morning Master' },
    ],
    features: ['morning_deals', 'early_access', 'breakfast_recommendations'],
  },

  late_owl: {
    id: 'late_owl',
    name: 'Late Owl',
    icon: '🦉',
    description: 'The night is your domain',
    keywords: ['night', 'late', 'midnight', '2am', 'dark', 'insomnia'],
    contextTriggers: {
      time: ['night', 'late_night'],
    },
    feedPriorities: ['vibe_map', 'events', 'safety', 'offers'],
    badgeUnlocks: [
      { threshold: 10, badgeId: 'night_crawler', badgeName: 'Night Crawler' },
      { threshold: 50, badgeId: 'midnight_explorer', badgeName: 'Midnight Explorer' },
      { threshold: 100, badgeId: 'owl_wisdom', badgeName: 'Owl Wisdom' },
    ],
    features: ['late_night_deals', 'quiet_place_alerts', 'safety_updates'],
  },
};

// ===== CONTEXTUAL SURFACING =====

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

export function getContextualSurface(
  persona: PersonaType,
  context: { time: string; dayOfWeek: string; location: string }
): ContextualSurface {
  const personaDef = PERSONA_DEFINITIONS[persona];

  // Time-based adjustments
  const timeAdjustment: Record<string, string[]> = {
    morning: ['offers', 'events'],
    afternoon: ['feed', 'vibe_map'],
    evening: ['events', 'vibe_map', 'safety'],
    night: ['safety', 'alerts', 'vibe_map'],
    late_night: ['safety', 'trusted_circle'],
  };

  const locationAdjustment: Record<string, string[]> = {
    home: ['offers', 'marketplace', 'services'],
    work: ['events', 'deals', 'feed'],
    commuting: ['alerts', 'offers', 'traffic'],
    exploring: ['vibe_map', 'events', 'discover'],
    social: ['events', 'offers', 'feed'],
  };

  const baseFeatures = personaDef.feedPriorities;
  const timeFeatures = timeAdjustment[context.time] || [];
  const locationFeatures = locationAdjustment[context.location] || [];

  const allFeatures = [...new Set([...baseFeatures, ...timeFeatures, ...locationFeatures])];

  return {
    topFeatures: allFeatures.slice(0, 4),
    hiddenFeatures: personaDef.features.filter(f => !allFeatures.includes(f)).slice(0, 2),
    recommendedContent: personaDef.feedPriorities,
    notificationStrategy: {
      frequency: context.time === 'night' || context.time === 'late_night' ? 'minimal' : 'normal',
      bestTimes: personaDef.id === 'early_bird' ? ['6:00', '7:00', '8:00'] : ['9:00', '12:00', '18:00'],
      excludeTimes: personaDef.id === 'early_bird' ? ['22:00', '23:00', '0:00'] : ['5:00', '6:00'],
    },
    uiOverrides: {
      heroSection: personaDef.id === 'safety_first' ? 'safety_status' : 'discover',
      quickActions: personaDef.id === 'deal_hunter' ? ['scan_deals', 'nearby_offers', 'wishlist'] : ['ask', 'explore', 'checkin'],
      tabOrder: personaDef.feedPriorities.slice(0, 3),
    },
  };
}
