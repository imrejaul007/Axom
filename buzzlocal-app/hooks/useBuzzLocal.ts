/**
 * BuzzLocal Data Hooks - Cost-optimized polling
 *
 * Based on architecture:
 * - Feed: 30s refresh
 * - Vibe Map: 60s refresh
 * - Density: 5min batch
 * - Events: 2min refresh
 * - Safety: Real-time only for alerts
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_BUZZLOCAL_API || 'http://localhost:4020';

// API Client
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Types
export interface FeedPost {
  id: string;
  type: 'deal' | 'event' | 'safety' | 'area' | 'review';
  title: string;
  description?: string;
  author: string;
  authorAvatar?: string;
  area: string;
  engagement: number;
  timestamp: number;
  coins: number;
  images?: string[];
}

export interface VibeArea {
  id: string;
  name: string;
  lat: number;
  lng: number;
  mood: 'busy' | 'party' | 'chill' | 'family';
  crowdLevel: number;
  users: number;
  trending: boolean;
}

export interface DensityData {
  name: string;
  density: number;
  trend: 'rising' | 'stable' | 'falling';
  peakHour: string;
  predicted: number;
}

export interface SafetyAlert {
  id: string;
  type: 'roadwork' | 'traffic' | 'crime' | 'weather' | 'emergency';
  area: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
}

export interface Event {
  id: string;
  title: string;
  venue: string;
  date: string;
  time: string;
  attendees: number;
  category: string;
}

export interface Creator {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  area: string;
  followers: number;
  tier: 'rising' | 'local' | 'expert' | 'authority';
  verified: boolean;
  badges: string[];
}

export interface TrustProfile {
  userId: string;
  karma: number;
  level: string;
  trustScore: number;
  verification: string[];
  badges: string[];
  personas: string[];
  stats: {
    posts: number;
    helpful: number;
    reports: number;
    verifications: number;
  };
  streak: number;
}

export interface Offer {
  id: string;
  merchant: string;
  title: string;
  discount: string;
  distance: string;
  expires?: string;
  coins: number;
  type: 'flash' | 'density' | 'location' | 'event';
}

export interface MovementPattern {
  commute: {
    home: string;
    work: string;
    departure: string;
    arrival: string;
    confidence: number;
  };
  frequentAreas: {
    name: string;
    visits: number;
    lastVisit: string;
  }[];
  peakHours: {
    morning: string;
    evening: string;
    night: string;
  };
}

export interface CityStats {
  activeUsers: number;
  postsToday: number;
  eventsActive: number;
  safetyScore: number;
  checkIns: number;
}

// Generic data fetching hook
function useFetch<T>(queryKey: (string | number | boolean | undefined)[], queryFn: () => Promise<T>, options?: {
  staleTime?: number;
  refetchInterval?: number;
  enabled?: boolean;
}): {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [data, setData] = useState<T | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Filter out undefined values from query key for display
  const stableKey = queryKey.filter((k): k is string | number | boolean => k !== undefined);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await queryFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [queryFn]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (options?.enabled === false) return;
    fetchData();

    if (options?.refetchInterval) {
      intervalRef.current = setInterval(fetchData, options.refetchInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, options?.refetchInterval, options?.enabled]);

  return { data, isLoading, error, refetch };
}

// ===== POLL-OPTIMIZED HOOKS =====

/**
 * Feed Hook - 30s refresh interval
 * Most common user action, optimized for speed
 */
export function useFeed(area?: string) {
  const queryFn = useCallback(async () => {
    const { data } = await api.get('/api/feed', { params: { area } });
    return data as { posts: FeedPost[]; pagination: { limit: number; offset: number; hasMore: boolean } };
  }, [area]);

  return useFetch(['feed', area], queryFn, {
    refetchInterval: 30 * 1000,
  });
}

/**
 * Vibe Map Hook - 60s refresh interval
 * User checks periodically, not constantly
 */
export function useVibeMap(lat?: number, lng?: number) {
  const queryFn = useCallback(async () => {
    const { data } = await api.get('/api/vibe-map', { params: { lat, lng } });
    return data as { areas: VibeArea[]; overlays: unknown };
  }, [lat, lng]);

  return useFetch(['vibe-map', lat, lng], queryFn, {
    refetchInterval: 60 * 1000,
  });
}

/**
 * Density Hook - 5min refresh (batched)
 * Density doesn't change rapidly, 5min is acceptable
 */
export function useDensity(area?: string) {
  const queryFn = useCallback(async () => {
    const { data } = await api.get('/api/density', { params: { area } });
    return data as { lastUpdated: number; areas: DensityData[]; hotspots: unknown[] };
  }, [area]);

  return useFetch(['density', area], queryFn, {
    refetchInterval: 5 * 60 * 1000,
  });
}

/**
 * Events Hook - 2min refresh
 * Events don't change often, 2min is fine
 */
export function useEvents(area?: string) {
  const queryFn = useCallback(async () => {
    const { data } = await api.get('/api/events', { params: { area } });
    return data as { upcoming: Event[]; happeningNow: Event[] };
  }, [area]);

  return useFetch(['events', area], queryFn, {
    refetchInterval: 2 * 60 * 1000,
  });
}

/**
 * Safety Alerts Hook - No automatic polling
 * Alerts are rare, fetch on mount + manual refresh
 * Critical alerts use push notifications instead
 */
export function useSafetyAlerts(area?: string) {
  const queryFn = useCallback(async () => {
    const { data } = await api.get('/api/safety/alerts', { params: { area } });
    return data as { active: SafetyAlert[]; safetyScore: number; safeZones: unknown[] };
  }, [area]);

  return useFetch(['safety-alerts', area], queryFn, {
    refetchInterval: 60 * 1000,
  });
}

/**
 * Trust Profile Hook - 60s refresh
 * Profile changes infrequently
 */
export function useTrustProfile(userId: string) {
  const queryFn = useCallback(async () => {
    const { data } = await api.get(`/api/trust/${userId}`);
    return data as TrustProfile;
  }, [userId]);

  return useFetch(['trust-profile', userId], queryFn, {
    refetchInterval: 60 * 1000,
    enabled: !!userId,
  });
}

/**
 * Creators Hook - 60s refresh
 * Creator rankings change slowly
 */
export function useCreators(area?: string, role?: string) {
  const queryFn = useCallback(async () => {
    const { data } = await api.get('/api/creators', { params: { area, role } });
    return data as { top: Creator[]; local: Creator[] };
  }, [area, role]);

  return useFetch(['creators', area, role], queryFn, {
    refetchInterval: 60 * 1000,
  });
}

/**
 * Offers Hook - 2min refresh
 * Flash deals expire, but not every second
 */
export function useOffers(area?: string) {
  const queryFn = useCallback(async () => {
    const { data } = await api.get('/api/offers', { params: { area } });
    return data as { flash: Offer[]; nearby: Offer[] };
  }, [area]);

  return useFetch(['offers', area], queryFn, {
    refetchInterval: 2 * 60 * 1000,
  });
}

/**
 * Movement Patterns Hook - 5min refresh
 * Patterns are stable, no need for frequent updates
 */
export function useMovementPatterns(userId?: string) {
  const queryFn = useCallback(async () => {
    const { data } = await api.get('/api/movement/patterns', { params: { userId } });
    return data as MovementPattern;
  }, [userId]);

  return useFetch(['movement-patterns', userId], queryFn, {
    refetchInterval: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

/**
 * City Stats Hook - No polling (manual refresh)
 * Stats are shown on dashboard, fetch when needed
 */
export function useCityStats() {
  const queryFn = useCallback(async () => {
    const { data } = await api.get('/api/stats/city');
    return data as CityStats;
  }, []);

  return useFetch(['city-stats'], queryFn, {
    refetchInterval: 60 * 1000,
  });
}

// ===== MUTATIONS =====

/**
 * Post creation mutation
 */
export function useCreatePost() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (post: Partial<FeedPost>) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/api/feed', post);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading, error };
}

/**
 * Check-in mutation
 */
export function useCheckIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (params: { area: string; lat: number; lng: number }) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/api/movement/checkin', params);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading, error };
}

/**
 * Safety alert mutation
 */
export function useReportSafetyAlert() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (alert: Partial<SafetyAlert>) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/api/safety/report', alert);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading, error };
}

/**
 * Follow creator mutation
 */
export function useFollowCreator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (creatorId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post(`/api/creators/${creatorId}/follow`);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading, error };
}

/**
 * Claim offer mutation
 */
export function useClaimOffer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (offerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post(`/api/offers/${offerId}/claim`);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading, error };
}

// ===== UTILITY HOOKS =====

/**
 * Prefetch feed data
 * Call on app launch or tab focus
 */
export function usePrefetchFeed() {
  return useCallback((area?: string) => {
    api.get('/api/feed', { params: { area } }).catch(console.error);
  }, []);
}

/**
 * Optimistic update for likes
 */
export function useOptimisticLike(postId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (liked: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post(`/api/feed/${postId}/like`, { liked });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  return { mutate, isLoading, error };
}
