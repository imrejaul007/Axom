import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Gamification types
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: string;
  progress?: number;
}

export interface Streak {
  id: string;
  type: 'check_in' | 'post' | 'event' | 'review' | 'helpful';
  current: number;
  longest: number;
  lastActivity?: string;
  isActive?: boolean;
  best?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  score: number;
  trend: 'up' | 'down' | 'same';
}

interface GamificationState {
  badges: Badge[];
  streaks: Streak[];
  leaderboards: {
    creators: LeaderboardEntry[];
    explorers: LeaderboardEntry[];
    helpful: LeaderboardEntry[];
  };
  isLoading: boolean;

  // Actions
  setBadges: (badges: Badge[]) => void;
  earnBadge: (badge: Badge) => void;
  updateBadgeProgress: (badgeId: string, progress: number) => void;

  setStreaks: (streaks: Streak[]) => void;
  updateStreak: (type: Streak['type'], current: number) => void;
  breakStreak: (type: Streak['type']) => void;

  setLeaderboards: (leaderboards: GamificationState['leaderboards']) => void;

  setLoading: (loading: boolean) => void;
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set) => ({
      badges: [],
      streaks: [],
      leaderboards: {
        creators: [],
        explorers: [],
        helpful: [],
      },
      isLoading: false,

      setBadges: (badges) => set({ badges }),

      earnBadge: (badge) =>
        set((state) => ({
          badges: [
            ...state.badges.filter((b) => b.id !== badge.id),
            { ...badge, earnedAt: new Date().toISOString() },
          ],
        })),

      updateBadgeProgress: (badgeId, progress) =>
        set((state) => ({
          badges: state.badges.map((b) =>
            b.id === badgeId ? { ...b, progress } : b
          ),
        })),

      setStreaks: (streaks) => set({ streaks }),

      updateStreak: (type, current) =>
        set((state) => ({
          streaks: state.streaks.map((s) =>
            s.type === type
              ? {
                  ...s,
                  current,
                  lastActivity: new Date().toISOString(),
                  isActive: true,
                  best: Math.max(s.best || 0, current),
                }
              : s
          ),
        })),

      breakStreak: (type) =>
        set((state) => ({
          streaks: state.streaks.map((s) =>
            s.type === type ? { ...s, current: 0, isActive: false } : s
          ),
        })),

      setLeaderboards: (leaderboards) => set({ leaderboards }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'buzzlocal-gamification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        badges: state.badges,
        streaks: state.streaks,
      }),
    }
  )
);
