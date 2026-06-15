import logger from './utils/logger';

import { Post, IPost, PostType } from '../models/Post.js';
import mongoose from 'mongoose';
import axios from 'axios';

const COIN_REWARDS: Record<PostType, number> = {
  general: 20,
  event: 50,
  alert: 40,
  place: 30,
  deal: 25,
  poll: 15,
};

interface CreatePostData {
  type: PostType;
  authorId: string;
  content: string;
  media?: { type: 'image' | 'video'; url: string }[];
  location?: { latitude: number; longitude: number; address?: string; area?: string };
  tags?: string[];
  eventDate?: string;
  alertCategory?: string;
  alertSeverity?: 'low' | 'medium' | 'high';
  pollOptions?: string[];
}

interface FeedQuery {
  userId?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in meters
  types?: PostType[];
  tags?: string[];
  page?: number;
  limit?: number;
}

interface FeedItem {
  type: 'post' | 'ai_card';
  data;
  timestamp: string;
}

export class FeedService {
  /**
   * Create a new post
   */
  async createPost(data: CreatePostData): Promise<IPost & { coinReward: number }> {
    const postData: Partial<IPost> = {
      type: data.type,
      authorId: data.authorId,
      content: data.content,
      media: data.media,
      location: data.location,
      tags: data.tags || [],
      coinReward: COIN_REWARDS[data.type],
      likes: [],
      saves: [],
    };

    // Type-specific fields
    if (data.type === 'event' && data.eventDate) {
      postData.eventDate = new Date(data.eventDate);
    }

    if (data.type === 'alert') {
      postData.alertCategory = data.alertCategory as unknown;
      postData.alertSeverity = data.alertSeverity;
    }

    if (data.type === 'deal' && data.tags) {
      // Extract discount from tags like "50% off"
      const discountMatch = data.content.match(/(\d+)%/);
      if (discountMatch) {
        postData.dealDiscount = parseInt(discountMatch[1]);
      }
    }

    if (data.type === 'poll' && data.pollOptions) {
      postData.pollOptions = data.pollOptions.map((text) => ({
        text,
        votes: 0,
        voterIds: [],
      }));
    }

    const post = new Post(postData);
    await post.save();

    // Award coins to author (async, don't block)
    this.awardCoins(data.authorId, post.coinReward, 'post_created', post._id.toString())
      .catch(console.error);

    return post as IPost & { coinReward: number };
  }

  /**
   * Get personalized feed
   */
  async getFeed(query: FeedQuery): Promise<{
    data: FeedItem[];
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: unknown = {
      isActive: true,
      isDeleted: false,
    };

    // Filter by types
    if (query.types && query.types.length > 0) {
      filter.type = { $in: query.types };
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      filter.tags = { $in: query.tags };
    }

    // Location-based filter
    if (query.latitude && query.longitude && query.radius) {
      filter.locationGeo = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [query.longitude, query.latitude],
          },
          $maxDistance: query.radius,
        },
      };
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);

    // Transform to feed items
    const feedItems: FeedItem[] = posts.map((post) => ({
      type: 'post',
      data: this.transformPost(post, query.userId),
      timestamp: post.createdAt.toISOString(),
    }));

    // Insert AI cards every 5 posts (mock for now)
    const aiCards = await this.getAICards(query.latitude, query.longitude);
    aiCards.forEach((card, index) => {
      const insertIndex = (index + 1) * 5;
      feedItems.splice(insertIndex, 0, card);
    });

    return {
      data: feedItems,
      page,
      limit,
      total,
      hasMore: skip + posts.length < total,
    };
  }

  /**
   * Get single post by ID
   */
  async getPost(postId: string, userId?: string): Promise<unknown> {
    const post = await Post.findById(postId).lean();
    if (!post) {
      throw new Error('Post not found');
    }
    return this.transformPost(post, userId);
  }

  /**
   * Like a post
   */
  async likePost(postId: string, userId: string): Promise<{ likes: number }> {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const alreadyLiked = post.likes.includes(userId);
    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter((id) => id !== userId);
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();
    return { likes: post.likes.length };
  }

  /**
   * Save a post
   */
  async savePost(postId: string, userId: string): Promise<{ saved: boolean }> {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const alreadySaved = post.saves.includes(userId);
    if (alreadySaved) {
      post.saves = post.saves.filter((id) => id !== userId);
      await post.save();
      return { saved: false };
    } else {
      post.saves.push(userId);
      await post.save();

      // Award bonus coin for saving
      this.awardCoins(userId, 5, 'post_saved', postId).catch(console.error);

      return { saved: true };
    }
  }

  /**
   * Vote on a poll
   */
  async votePoll(postId: string, optionIndex: number, userId: string): Promise<unknown> {
    const post = await Post.findById(postId);
    if (!post || post.type !== 'poll') {
      throw new Error('Poll not found');
    }

    if (!post.pollOptions || !post.pollOptions[optionIndex]) {
      throw new Error('Invalid option');
    }

    const option = post.pollOptions[optionIndex];
    if (option.voterIds.includes(userId)) {
      throw new Error('Already voted');
    }

    option.voterIds.push(userId);
    option.votes += 1;
    await post.save();

    return {
      options: post.pollOptions.map((opt) => ({
        text: opt.text,
        votes: opt.votes,
      })),
    };
  }

  /**
   * Get AI cards for the feed
   * Calls BuzzLocal Intelligence Service which connects to REZ Intelligence
   */
  async getAICards(latitude?: number, longitude?: number): Promise<FeedItem[]> {
    const cards: FeedItem[] = [];

    try {
      // Call BuzzLocal Intelligence Service
      const response = await axios.get(
        `${process.env.INTELLIGENCE_SERVICE_URL || 'http://localhost:4010'}/ai/cards`,
        {
          params: {
            userId: 'anonymous', // Would be actual user ID from context
            lat: latitude || 12.9716,
            lng: longitude || 77.5946,
          },
          timeout: 3000,
        }
      );

      if (response.data?.cards) {
        return response.data.cards.map((card) => ({
          type: 'ai_card',
          data: card,
          timestamp: new Date().toISOString(),
        }));
      }
    } catch (error) {
      // Fallback to mock data if intelligence service is unavailable
      logger.info('Intelligence service unavailable, using fallback cards');
    }

    // Fallback mock AI cards - STATISTICAL: mock data for resilience
    if (Math.random() > 0.5) {
      cards.push({
        type: 'ai_card',
        data: {
          id: 'ai_trending_' + Date.now(),
          type: 'trending',
          title: 'Koramangala is trending tonight',
          description: 'High activity detected. 47 people checked in recently.',
          icon: '🔥',
          priority: 'medium',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (Math.random() > 0.7) {
      cards.push({
        type: 'ai_card',
        data: {
          id: 'ai_weather_' + Date.now(),
          type: 'alert',
          title: 'Rain expected in 30 mins',
          description: 'Weather alert: Light rain expected nearby.',
          icon: '🌧️',
          priority: 'high',
        },
        timestamp: new Date().toISOString(),
      });
    }

    return cards;
  }

  /**
   * Search posts
   */
  async searchPosts(query: string, filters?: {
    type?: PostType;
    latitude?: number;
    longitude?: number;
    radius?: number;
    limit?: number;
  }): Promise<unknown[]> {
    const filter: unknown = {
      isActive: true,
      isDeleted: false,
      $or: [
        { content: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ],
    };

    if (filters?.type) {
      filter.type = filters.type;
    }

    if (filters?.latitude && filters?.longitude && filters?.radius) {
      filter.locationGeo = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [filters.longitude, filters.latitude],
          },
          $maxDistance: filters.radius,
        },
      };
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(filters?.limit || 20)
      .lean();

    return posts.map((post) => this.transformPost(post));
  }

  /**
   * Award coins to user
   */
  private async awardCoins(
    userId: string,
    amount: number,
    reason: string,
    relatedId?: string
  ): Promise<void> {
    try {
      await axios.post(
        `${process.env.WALLET_SERVICE_URL || 'http://localhost:4002'}/wallet/earn`,
        {
          userId,
          amount,
          reason,
          relatedId,
          source: 'buzzlocal_feed',
        }
      );
    } catch (error) {
      console.error('Failed to award coins:', error);
    }
  }

  /**
   * Transform post for API response
   */
  private transformPost(post, userId?: string): unknown {
    return {
      id: post._id.toString(),
      type: post.type,
      authorId: post.authorId,
      content: post.content,
      media: post.media,
      location: post.location,
      tags: post.tags,
      coinReward: post.coinReward,
      likes: post.likes?.length || 0,
      comments: post.comments || 0,
      saves: post.saves?.length || 0,
      shares: post.shares || 0,
      isLiked: userId ? post.likes?.includes(userId) : false,
      isSaved: userId ? post.saves?.includes(userId) : false,
      createdAt: post.createdAt,
      eventDate: post.eventDate,
      alertCategory: post.alertCategory,
      alertSeverity: post.alertSeverity,
      pollOptions: post.pollOptions,
      dealDiscount: post.dealDiscount,
    };
  }
}

export const feedService = new FeedService();
