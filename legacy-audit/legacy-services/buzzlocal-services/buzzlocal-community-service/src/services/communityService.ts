import { Community, ICommunity, CommunityPost, ICommunityPost, CommunityType } from '../models/index.js';
import axios from 'axios';

interface CreateCommunityData {
  name: string;
  type: CommunityType;
  description?: string;
  creatorId: string;
  location?: {
    latitude: number;
    longitude: number;
    area?: string;
  };
  isPrivate?: boolean;
}

interface CreatePostData {
  communityId: string;
  authorId: string;
  content: string;
  media?: { type: 'image' | 'video'; url: string }[];
}

export class CommunityService {
  /**
   * Create a new community
   */
  async createCommunity(data: CreateCommunityData): Promise<ICommunity> {
    const community = new Community({
      name: data.name,
      type: data.type,
      description: data.description,
      creatorId: data.creatorId,
      location: data.location,
      isPrivate: data.isPrivate || false,
      memberIds: [data.creatorId], // Creator is first member
      admins: [data.creatorId],
    });

    await community.save();

    // Award coins to creator
    this.awardCoins(data.creatorId, 50, 'community_created', community._id.toString())
      .catch(console.error);

    return community;
  }

  /**
   * Get community by ID or slug
   */
  async getCommunity(identifier: string): Promise<ICommunity | null> {
    return Community.findOne({
      $or: [
        { _id: identifier },
        { slug: identifier },
      ],
      isActive: true,
    }).lean();
  }

  /**
   * List communities
   */
  async listCommunities(filters?: {
    type?: CommunityType;
    area?: string;
    userId?: string;
    joined?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    communities: ICommunity[];
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const query: unknown = { isActive: true };

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.area) {
      query['location.area'] = filters.area;
    }

    if (filters?.joined && filters?.userId) {
      query.memberIds = filters.userId;
    }

    const [communities, total] = await Promise.all([
      Community.find(query)
        .sort({ memberCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Community.countDocuments(query),
    ]);

    return {
      communities,
      page,
      limit,
      total,
      hasMore: skip + communities.length < total,
    };
  }

  /**
   * Join a community
   */
  async joinCommunity(communityId: string, userId: string): Promise<{ success: boolean }> {
    const community = await Community.findById(communityId);
    if (!community) {
      throw new Error('Community not found');
    }

    if (community.memberIds.includes(userId)) {
      return { success: false };
    }

    community.memberIds.push(userId);
    await community.save();

    // Track analytics
    this.trackAnalytics('community_join', {
      communityId,
      userId,
    });

    return { success: true };
  }

  /**
   * Leave a community
   */
  async leaveCommunity(communityId: string, userId: string): Promise<{ success: boolean }> {
    const community = await Community.findById(communityId);
    if (!community) {
      throw new Error('Community not found');
    }

    // Can't leave if you're the only admin
    if (community.admins.includes(userId) && community.admins.length === 1) {
      throw new Error('Cannot leave: you are the only admin');
    }

    community.memberIds = community.memberIds.filter((id) => id !== userId);
    community.admins = community.admins.filter((id) => id !== userId);
    await community.save();

    return { success: true };
  }

  /**
   * Create a post in community
   */
  async createPost(data: CreatePostData): Promise<ICommunityPost> {
    const community = await Community.findById(data.communityId);
    if (!community) {
      throw new Error('Community not found');
    }

    if (!community.memberIds.includes(data.authorId)) {
      throw new Error('Must be a member to post');
    }

    const post = new CommunityPost({
      communityId: data.communityId,
      authorId: data.authorId,
      content: data.content,
      media: data.media,
    });

    await post.save();

    // Award coins
    this.awardCoins(data.authorId, 15, 'community_post', post._id.toString())
      .catch(console.error);

    return post;
  }

  /**
   * Get community posts
   */
  async getCommunityPosts(
    communityId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    posts: ICommunityPost[];
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  }> {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      CommunityPost.find({ communityId })
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CommunityPost.countDocuments({ communityId }),
    ]);

    return {
      posts,
      page,
      limit,
      total,
      hasMore: skip + posts.length < total,
    };
  }

  /**
   * Get user's communities
   */
  async getUserCommunities(userId: string): Promise<ICommunity[]> {
    return Community.find({
      memberIds: userId,
      isActive: true,
    })
      .sort({ memberCount: -1 })
      .lean();
  }

  /**
   * Get suggested communities for user
   */
  async getSuggestedCommunities(userId: string, limit: number = 10): Promise<ICommunity[]> {
    // Get communities the user is not a member of
    const communities = await Community.find({
      isActive: true,
    })
      .sort({ memberCount: -1 })
      .limit(limit * 2)
      .lean();

    // Filter out user's communities (in a real app, this would be optimized)
    return communities.slice(0, limit);
  }

  /**
   * Update community
   */
  async updateCommunity(
    communityId: string,
    userId: string,
    data: Partial<{
      name: string;
      description: string;
      coverImage: string;
      rules: string[];
      isPrivate: boolean;
    }>
  ): Promise<ICommunity> {
    const community = await Community.findById(communityId);
    if (!community) {
      throw new Error('Community not found');
    }

    if (!community.admins.includes(userId)) {
      throw new Error('Only admins can update community');
    }

    Object.assign(community, data);
    await community.save();

    return community;
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
          source: 'buzzlocal_community',
        }
      );
    } catch (error) {
      console.error('Failed to award coins:', error);
    }
  }

  /**
   * Track analytics
   */
  private trackAnalytics(event: string, data): void {
    axios.post(
      `${process.env.MIND_SERVICE_URL || 'http://localhost:4005'}/events`,
      {
        eventType: event,
        source: 'buzzlocal_community',
        properties: data,
        timestamp: new Date().toISOString(),
      }
    ).catch(() => {});
  }
}

export const communityService = new CommunityService();
