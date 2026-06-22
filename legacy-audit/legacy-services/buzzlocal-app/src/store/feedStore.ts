import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Post, AICard } from '@/types';

interface FeedItem {
  type: 'post' | 'ai_card';
  data: Post | AICard;
  timestamp: string;
}

interface FeedState {
  feed: FeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  page: number;

  // Actions
  setFeed: (feed: FeedItem[]) => void;
  appendFeed: (items: FeedItem[]) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;

  // Post actions
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
  savePost: (postId: string) => void;
  unsavePost: (postId: string) => void;
  incrementComment: (postId: string) => void;
  addPost: (post: Post) => void;

  // AI Card
  addAICard: (card: AICard) => void;
  removeAICard: (cardId: string) => void;
}

export const useFeedStore = create<FeedState>()(
  persist(
    (set) => ({
      feed: [],
      isLoading: false,
      isRefreshing: false,
      hasMore: true,
      page: 1,

      setFeed: (feed) => set({ feed }),

      appendFeed: (items) =>
        set((state) => ({
          feed: [...state.feed, ...items],
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setRefreshing: (isRefreshing) => set({ isRefreshing }),

      setHasMore: (hasMore) => set({ hasMore }),

      setPage: (page) => set({ page }),

      likePost: (postId) =>
        set((state) => ({
          feed: state.feed.map((item) => {
            if (item.type === 'post' && (item.data as Post).id === postId) {
              const post = item.data as Post;
              return {
                ...item,
                data: {
                  ...post,
                  likes: (post.likes || 0) + 1,
                  isLiked: true,
                },
              };
            }
            return item;
          }),
        })),

      unlikePost: (postId) =>
        set((state) => ({
          feed: state.feed.map((item) => {
            if (item.type === 'post' && (item.data as Post).id === postId) {
              const post = item.data as Post;
              return {
                ...item,
                data: {
                  ...post,
                  likes: Math.max(0, (post.likes || 0) - 1),
                  isLiked: false,
                },
              };
            }
            return item;
          }),
        })),

      savePost: (postId) =>
        set((state) => ({
          feed: state.feed.map((item) => {
            if (item.type === 'post' && (item.data as Post).id === postId) {
              const post = item.data as Post;
              return {
                ...item,
                data: {
                  ...post,
                  saves: (post.saves || 0) + 1,
                  isSaved: true,
                },
              };
            }
            return item;
          }),
        })),

      unsavePost: (postId) =>
        set((state) => ({
          feed: state.feed.map((item) => {
            if (item.type === 'post' && (item.data as Post).id === postId) {
              const post = item.data as Post;
              return {
                ...item,
                data: {
                  ...post,
                  saves: Math.max(0, (post.saves || 0) - 1),
                  isSaved: false,
                },
              };
            }
            return item;
          }),
        })),

      incrementComment: (postId) =>
        set((state) => ({
          feed: state.feed.map((item) => {
            if (item.type === 'post' && (item.data as Post).id === postId) {
              const post = item.data as Post;
              return {
                ...item,
                data: {
                  ...post,
                  comments: (post.comments || 0) + 1,
                },
              };
            }
            return item;
          }),
        })),

      addPost: (post) =>
        set((state) => ({
          feed: [
            { type: 'post', data: post, timestamp: new Date().toISOString() },
            ...state.feed,
          ],
        })),

      addAICard: (card) =>
        set((state) => ({
          feed: [
            ...state.feed,
            { type: 'ai_card', data: card, timestamp: new Date().toISOString() },
          ],
        })),

      removeAICard: (cardId) =>
        set((state) => ({
          feed: state.feed.filter(
            (item) => item.type !== 'ai_card' || item.data?.id !== cardId
          ),
        })),
    }),
    {
      name: 'buzzlocal-feed-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        feed: state.feed.slice(0, 20),
        page: state.page,
      }),
    }
  )
);
