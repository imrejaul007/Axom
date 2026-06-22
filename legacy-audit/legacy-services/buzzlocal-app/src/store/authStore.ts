import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingCompleted: boolean;
  selectedInterests: string[];

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setSelectedInterests: (interests: string[]) => void;
  addInterest: (interest: string) => void;
  removeInterest: (interest: string) => void;
  logout: () => void;
  updateCoinBalance: (amount: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      onboardingCompleted: false,
      selectedInterests: [],

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setOnboardingCompleted: (onboardingCompleted) => set({ onboardingCompleted }),

      setSelectedInterests: (interests) => set({ selectedInterests: interests }),

      addInterest: (interest) =>
        set((state) => ({
          selectedInterests: [...state.selectedInterests, interest],
        })),

      removeInterest: (interest) =>
        set((state) => ({
          selectedInterests: state.selectedInterests.filter((i) => i !== interest),
        })),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),

      updateCoinBalance: (amount) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, coinBalance: (state.user.coinBalance || 0) + amount }
            : null,
        })),
    }),
    {
      name: 'buzzlocal-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        onboardingCompleted: state.onboardingCompleted,
        selectedInterests: state.selectedInterests,
      }),
    }
  )
);
