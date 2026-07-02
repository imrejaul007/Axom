import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Post, FeedItem, PaginatedResponse } from '@/types';

// Service URLs
const FEED_URL = process.env.EXPO_PUBLIC_FEED_SERVICE_URL || 'http://localhost:4000';
const MIND_URL = process.env.EXPO_PUBLIC_MIND_URL || 'http://localhost:4001';

// API instance
const api = axios.create({
  baseURL: FEED_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-App-Id'] = 'buzzlocal';
  return config;
});

// Track to REZ Mind
const trackToMind = async (eventType: string, data) => {
  try {
    await axios.post(`${MIND_URL}/events`, {
      type: eventType,
      data,
      source: 'buzzlocal',
      timestamp: Date.now(),
    }, { timeout: 5000 });
  } catch (error) {
    console.log('REZ Mind tracking failed (non-critical):', eventType);
  }
};

interface CreatePostData {
  type: Post['type'];
  content: string;
  media?: { type: 'image' | 'video'; url: string }[];
  location?: { latitude: number; longitude: number; area?: string };
  tags?: string[];
  eventDate?: string;
  alertCategory?: string;
  alertSeverity?: 'low' | 'medium' | 'high';
  pollOptions?: string[];
}

class FeedService {
  /**
   * Get personalized feed
   */
  async getFeed(
    page: number = 1,
    limit: number = 20,
    location?: { latitude: number; longitude: number }
  ): Promise<PaginatedResponse<FeedItem>> {
    try {
      const response = await api.get('/feed', {
        params: { page, limit, ...location },
      });

      // Track feed view to REZ Mind
      await trackToMind('feed_view', {
        page,
        limit,
        location,
        timestamp: Date.now(),
      });

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch feed';
      throw new Error(message);
    }
  }

  /**
   * Get a single post
   */
  async getPost(postId: string): Promise<Post> {
    try {
      const response = await api.get(`/posts/${postId}`);

      // Track post view
      await trackToMind('post_view', {
        postId,
        type: response.data.type,
        timestamp: Date.now(),
      });

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch post';
      throw new Error(message);
    }
  }

  /**
   * Create a new post
   */
  async createPost(data: CreatePostData): Promise<Post & { coinReward: number }> {
    try {
      const response = await api.post('/posts', data);
      const post = response.data;

      // Track post creation to REZ Mind
      await trackToMind('post_create', {
        postId: post.id,
        type: data.type,
        category: data.tags?.[0],
        location: data.location,
        hasMedia: !!data.media?.length,
        timestamp: Date.now(),
      });

      return post;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create post';
      throw new Error(message);
    }
  }

  /**
   * Like a post
   */
  async likePost(postId: string): Promise<{ likes: number; liked: boolean }> {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      const result = response.data;

      // Track to REZ Mind
      await trackToMind('post_like', {
        postId,
        liked: result.liked,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to like post';
      throw new Error(message);
    }
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: string): Promise<{ likes: number }> {
    try {
      const response = await api.delete(`/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to unlike post';
      throw new Error(message);
    }
  }

  /**
   * Save a post
   */
  async savePost(postId: string): Promise<{ saved: boolean }> {
    try {
      const response = await api.post(`/posts/${postId}/save`);
      const result = response.data;

      // Track to REZ Mind
      await trackToMind('post_save', {
        postId,
        saved: result.saved,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save post';
      throw new Error(message);
    }
  }

  /**
   * Share a post
   */
  async sharePost(postId: string): Promise<void> {
    try {
      await api.post(`/posts/${postId}/share`);

      // Track to REZ Mind
      await trackToMind('post_share', {
        postId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Share tracking failed:', error);
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<void> {
    try {
      await api.delete(`/posts/${postId}`);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete post';
      throw new Error(message);
    }
  }

  /**
   * Get AI cards for feed
   */
  async getAICards(location?: { latitude: number; longitude: number }): Promise<unknown[]> {
    try {
      const response = await api.get('/feed/ai-cards', { params: location });
      return response.data.cards;
    } catch (error) {
      // Return empty on error
      return [];
    }
  }

  /**
   * Search posts
   */
  async searchPosts(
    query: string,
    filters?: {
      type?: Post['type'];
      location?: { latitude: number; longitude: number; radius: number };
    }
  ): Promise<Post[]> {
    try {
      const response = await api.get('/posts/search', {
        params: { q: query, ...filters },
      });

      // Track search to REZ Mind
      await trackToMind('search', {
        query,
        filters,
        resultCount: response.data.posts?.length || 0,
        timestamp: Date.now(),
      });

      return response.data.posts;
    } catch (error) {
      const message = error.response?.data?.message || 'Search failed';
      throw new Error(message);
    }
  }

  /**
   * Get user's posts
   */
  async getUserPosts(userId: string, page: number = 1): Promise<PaginatedResponse<Post>> {
    try {
      const response = await api.get(`/posts/user/${userId}`, {
        params: { page },
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch posts';
      throw new Error(message);
    }
  }

  /**
   * Get saved posts
   */
  async getSavedPosts(page: number = 1): Promise<PaginatedResponse<Post>> {
    try {
      const response = await api.get('/posts/saved', {
        params: { page },
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch saved posts';
      throw new Error(message);
    }
  }

  /**
   * Report a post
   */
  async reportPost(postId: string, reason: string): Promise<void> {
    try {
      await api.post(`/posts/${postId}/report`, { reason });

      // Track to REZ Mind
      await trackToMind('post_reported', {
        postId,
        reason,
        timestamp: Date.now(),
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to report post';
      throw new Error(message);
    }
  }

  /**
   * Get post comments
   */
  async getComments(postId: string, page: number = 1): Promise<unknown[]> {
    try {
      const response = await api.get(`/posts/${postId}/comments`, {
        params: { page },
      });
      return response.data.comments;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch comments';
      throw new Error(message);
    }
  }

  /**
   * Add comment
   */
  async addComment(postId: string, content: string): Promise<unknown> {
    try {
      const response = await api.post(`/posts/${postId}/comments`, { content });

      // Track to REZ Mind
      await trackToMind('post_comment', {
        postId,
        timestamp: Date.now(),
      });

      return response.data.comment;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add comment';
      throw new Error(message);
    }
  }

  /**
   * Cache post locally
   */
  async cachePost(post: Post): Promise<void> {
    try {
      const key = `post_${post.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(post));
    } catch (error) {
      console.error('Failed to cache post:', error);
    }
  }

  /**
   * Get cached post
   */
  async getCachedPost(postId: string): Promise<Post | null> {
    try {
      const data = await AsyncStorage.getItem(`post_${postId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }
}

export const feedService = new FeedService();
