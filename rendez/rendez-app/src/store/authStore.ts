import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface UserProfile {
  id: string;
  name: string;
  photos: string[];
  rezUserId?: string;
  city?: string;
  age?: number;
  gender?: string;
}

interface AuthState {
  token: string | null;
  profile: UserProfile | null;
  isLoading: boolean;
  hasSeenOnboarding: boolean | null;
  setToken: (token: string) => Promise<void>;
  setProfile: (profile: UserProfile) => void;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  markOnboardingDone: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  profile: null,
  isLoading: true,
  hasSeenOnboarding: null,

  setToken: async (token) => {
    await SecureStore.setItemAsync('rendez_token', token);
    set({ token });
  },

  setProfile: (profile: UserProfile) => set({ profile }),

  logout: async () => {
    await SecureStore.deleteItemAsync('rendez_token');
    set({ token: null, profile: null });
  },

  loadToken: async () => {
    const [token, onboarded] = await Promise.all([
      SecureStore.getItemAsync('rendez_token'),
      SecureStore.getItemAsync('rendez_onboarded'),
    ]);
    set({ token, isLoading: false, hasSeenOnboarding: onboarded === '1' });
  },

  markOnboardingDone: async () => {
    await SecureStore.setItemAsync('rendez_onboarded', '1');
    set({ hasSeenOnboarding: true });
  },
}));
