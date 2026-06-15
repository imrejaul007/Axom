/**
 * Crisis Hooks - API calls for crisis management
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CrisisZone, CrisisResource, Shelter, Volunteer } from '@/types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4021';

// Generic data fetching hook
function useFetch<T>(queryKey: unknown[], queryFn: () => Promise<T>, options?: {
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

    let interval: ReturnType<typeof setInterval> | null = null;
    if (options?.refetchInterval) {
      interval = setInterval(fetchData, options.refetchInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchData, options?.refetchInterval, options?.enabled]);

  return { data, isLoading, error, refetch };
}

// Crisis Zone API
export function useCrisisZones(status?: string) {
  const queryFn = useCallback(async () => {
    const { data } = await axios.get(`${API_BASE}/api/crisis/incidents`, {
      params: { status },
    });
    return data.incidents as CrisisZone[];
  }, [status]);

  return useFetch(['crisis', 'zones', status], queryFn, {
    refetchInterval: 60 * 1000, // Poll every minute during crisis
  });
}

// Shelters API
export function useShelters() {
  const queryFn = useCallback(async () => {
    const { data } = await axios.get(`${API_BASE}/api/crisis/shelters`);
    return data.shelters as Shelter[];
  }, []);

  return useFetch(['crisis', 'shelters'], queryFn, {
    refetchInterval: 5 * 60 * 1000,
  });
}

// Resources API
export function useCrisisResources(type?: string) {
  const queryFn = useCallback(async () => {
    const { data } = await axios.get(`${API_BASE}/api/crisis/resources`, {
      params: { type },
    });
    return data.resources as CrisisResource[];
  }, [type]);

  return useFetch(['crisis', 'resources', type], queryFn, {
    refetchInterval: 2 * 60 * 1000,
  });
}

// Volunteer Registration
export function useRegisterVolunteer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (volunteer: Omit<Volunteer, 'id' | 'status'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(`${API_BASE}/api/crisis/volunteer`, volunteer);
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

// Safety Check-In
export function useSafetyCheckIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (checkIn: { status: string; note?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(`${API_BASE}/api/crisis/checkin`, checkIn);
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

// Get resources by category
export function useMedicalResources() {
  return useCrisisResources('medical');
}

export function useFoodResources() {
  return useCrisisResources('food');
}

export function useShelterResources() {
  return useCrisisResources('shelter');
}

export function useTransportResources() {
  return useCrisisResources('transport');
}
