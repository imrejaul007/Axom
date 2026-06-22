/**
 * Zustand Store - Global state management
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// User Store
interface UserState {
  id: string | null;
  name: string | null;
  displayName: string | null;
  username: string | null;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  area: string | null;
  trustScore: number;
  reputation: number;
  reputationLevel: string;
  bio: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  coinBalance: number;
  user: {
    id: string | null;
    name: string | null;
    displayName: string | null;
    username: string | null;
    phone: string | null;
    email: string | null;
    avatar: string | null;
    trustScore: number;
    reputation: number;
    reputationLevel: string;
    bio: string;
    postsCount?: number;
    followersCount?: number;
    followingCount?: number;
  } | null;
  selectedInterests: string[];
  isOnboardingCompleted: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  leaderboards: unknown[];
  setUser: (user: Partial<UserState>) => void;
  updateCoinBalance: (balance: number) => void;
  setSelectedInterests: (interests: string[]) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  id: null,
  name: null,
  displayName: null,
  username: null,
  phone: null,
  email: null,
  avatar: null,
  area: null,
  trustScore: 0,
  reputation: 0,
  reputationLevel: '',
  bio: '',
  postsCount: 0,
  followersCount: 0,
  followingCount: 0,
  coinBalance: 0,
  user: null,
  selectedInterests: [],
  isOnboardingCompleted: false,
  isAuthenticated: false,
  isLoading: false,
  leaderboards: [],
  setUser: (user) => set((state) => ({
    ...state,
    ...user,
    user: { ...state.user, ...user } as UserState['user'],
    isAuthenticated: true
  })),
  updateCoinBalance: (balance) => set({ coinBalance: balance }),
  setSelectedInterests: (interests) => set({ selectedInterests: interests }),
  setOnboardingCompleted: (completed) => set({ isOnboardingCompleted: completed }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => set({
    id: null,
    name: null,
    displayName: null,
    username: null,
    phone: null,
    email: null,
    avatar: null,
    area: null,
    trustScore: 0,
    reputation: 0,
    reputationLevel: '',
    bio: '',
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
    coinBalance: 0,
    user: null,
    selectedInterests: [],
    isOnboardingCompleted: false,
    isAuthenticated: false,
    isLoading: false,
    leaderboards: [],
  }),
}));

// Location Store
interface LocationState {
  currentLocation: { lat: number; lng: number } | null;
  selectedArea: string | null;
  locationPermission: string | null;
  setLocation: (location: { lat: number; lng: number }) => void;
  setArea: (area: string) => void;
  setLocationPermission: (permission: string | null) => void;
  setCurrentLocation: (location: { latitude: number; longitude: number }) => void;
  setLoadingLocation: (loading: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  selectedArea: null,
  locationPermission: null,
  setLocation: (location) => set({ currentLocation: location }),
  setArea: (area) => set({ selectedArea: area }),
  setLocationPermission: (permission) => set({ locationPermission: permission }),
  setCurrentLocation: (location) => set({ currentLocation: { lat: location.latitude, lng: location.longitude } }),
  setLoadingLocation: () => {},
}));

// Safety Store
interface SafetyState {
  sosActive: boolean;
  walkWithMeActive: boolean;
  trustedContacts: string[];
  setSOSActive: (active: boolean) => void;
  setWalkWithMeActive: (active: boolean) => void;
  setTrustedContacts: (contacts: string[]) => void;
}

export const useSafetyStore = create<SafetyState>((set) => ({
  sosActive: false,
  walkWithMeActive: false,
  trustedContacts: [],
  setSOSActive: (active) => set({ sosActive: active }),
  setWalkWithMeActive: (active) => set({ walkWithMeActive: active }),
  setTrustedContacts: (contacts) => set({ trustedContacts: contacts }),
}));

// App Store
interface AppState {
  isLoading: boolean;
  notifications: number;
  theme: 'dark' | 'light';
  setLoading: (loading: boolean) => void;
  setNotifications: (count: number) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: false,
  notifications: 0,
  theme: 'dark',
  setLoading: (loading) => set({ isLoading: loading }),
  setNotifications: (count) => set({ notifications: count }),
  setTheme: (theme) => set({ theme }),
}));

// Feed Store
interface FeedState {
  posts: unknown[];
  refreshing: boolean;
  feed: unknown[];
  setPosts: (posts: unknown[]) => void;
  setFeed: (feed: unknown[]) => void;
  addPost: (post) => void;
  setRefreshing: (refreshing: boolean) => void;
  isRefreshing: boolean;
}

export const useFeedStore = create<FeedState>((set) => ({
  posts: [],
  refreshing: false,
  feed: [],
  isRefreshing: false,
  setPosts: (posts) => set({ posts }),
  setFeed: (feed) => set({ feed }),
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  setRefreshing: (refreshing) => set({ refreshing, isRefreshing: refreshing }),
}));

// Aliases for backward compatibility
export const useAuthStore = useUserStore;
export const useGamificationStore = useUserStore;

// Wallet Store
interface WalletState {
  balance: number;
  transactions: Transaction[];
  setBalance: (balance: number) => void;
  setTransactions: (transactions: Transaction[]) => void;
}

interface Transaction {
  id: string;
  type: 'earn' | 'spend' | 'bonus' | 'refund';
  amount: number;
  description: string;
  createdAt: string;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  transactions: [],
  setBalance: (balance) => set({ balance }),
  setTransactions: (transactions) => set({ transactions }),
}));

// Location Store - Extended
interface LocationStateExtended extends LocationState {
  locationPermission: string | null;
  setCurrentLocation: (location: { latitude: number; longitude: number }) => void;
  setLocationPermission: (permission: string | null) => void;
  setLoadingLocation: (loading: boolean) => void;
}

export const useLocationStoreExtended = create<LocationStateExtended>((set) => ({
  currentLocation: null,
  selectedArea: null,
  locationPermission: null,
  setLocation: (location) => set({ currentLocation: { lat: location.lat, lng: location.lng } }),
  setArea: (area) => set({ selectedArea: area }),
  setCurrentLocation: (location) => set({ currentLocation: { lat: location.latitude, lng: location.longitude } }),
  setLocationPermission: (permission) => set({ locationPermission: permission }),
  setLoadingLocation: () => {},
}));

// Persisted Storage Helper
export const storage = {
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },
};
