import { CreatorProfile, CreatorContent, CreatorProgram, CreatorEarning, CreatorRole } from '../models/CreatorModels';
import axios from 'axios';

// Service URLs
const CREATOR_QR_URL = process.env.CREATOR_QR_URL || 'http://localhost:3005';
const REZ_PRIVE_URL = process.env.REZ_PRIVE_URL || 'http://localhost:4070';
const MERCHANT_INTEL_URL = process.env.MERCHANT_INTEL_URL || 'http://localhost:4012';
const WALLET_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:4004';

const HEADERS = {
  'Content-Type': 'application/json',
  'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
};

export class CreatorService {
  /**
   * Create or update creator profile
   */
  async upsertProfile(data: {
    userId: string;
    displayName: string;
    avatar?: string;
    bio?: string;
    locality: { areaId: string; areaName: string };
    specialization?: string[];
  }) {
    const profile = await CreatorProfile.findOneAndUpdate(
      { userId: data.userId },
      {
        $set: {
          displayName: data.displayName,
          avatar: data.avatar,
          bio: data.bio,
          locality: data.locality,
          specialization: data.specialization || [],
        },
        $setOnInsert: {
          userId: data.userId,
          roles: [],
          tier: 'rising',
          stats: { followers: 0, following: 0, posts: 0, totalViews: 0, engagement: 0 },
          earnings: { totalEarned: 0, pending: 0, withdrawn: 0 },
          badges: [],
          verified: false,
        },
      },
      { upsert: true, new: true }
    );

    return profile;
  }

  /**
   * Get creator profile
   */
  async getProfile(userId: string) {
    const profile = await CreatorProfile.findOne({ userId });
    if (!profile) return null;

    // Get recent content
    const recentContent = await CreatorContent.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    return { profile, recentContent };
  }

  /**
   * Get top creators by area
   */
  async getTopCreators(areaId: string, options: { role?: CreatorRole; limit?: number } = {}) {
    const query: any = { 'locality.areaId': areaId };
    if (options.role) {
      query.roles = options.role;
    }

    const creators = await CreatorProfile.find(query)
      .sort({ 'stats.followers': -1, 'stats.engagement': -1 })
      .limit(options.limit || 10);

    return creators;
  }

  /**
   * Get creators by category
   */
  async getCreatorsByCategory(category: string, limit = 20) {
    const creators = await CreatorProfile.find({
      specialization: category,
    })
      .sort({ 'stats.followers': -1, 'stats.engagement': -1 })
      .limit(limit);

    return creators;
  }

  /**
   * Follow a creator
   */
  async followCreator(followerId: string, creatorId: string) {
    const creator = await CreatorProfile.findOne({ userId: creatorId });
    if (!creator) throw new Error('Creator not found');

    // Update creator's follower count
    creator.stats.followers += 1;
    await creator.save();

    // Update follower's following count
    const follower = await CreatorProfile.findOne({ userId: followerId });
    if (follower) {
      follower.stats.following += 1;
      await follower.save();
    }

    return { success: true, followers: creator.stats.followers };
  }

  /**
   * Unfollow a creator
   */
  async unfollowCreator(followerId: string, creatorId: string) {
    const creator = await CreatorProfile.findOne({ userId: creatorId });
    if (!creator) throw new Error('Creator not found');

    creator.stats.followers = Math.max(0, creator.stats.followers - 1);
    await creator.save();

    const follower = await CreatorProfile.findOne({ userId: followerId });
    if (follower) {
      follower.stats.following = Math.max(0, follower.stats.following - 1);
      await follower.save();
    }

    return { success: true, followers: creator.stats.followers };
  }

  /**
   * Create content (post/review/recommendation)
   */
  async createContent(data: {
    userId: string;
    creatorId: string;
    type: 'post' | 'review' | 'recommendation' | 'alert' | 'deal';
    title: string;
    content: string;
    media?: { type: 'image' | 'video'; url: string }[];
    locality: { areaId: string; areaName: string };
    category: string;
    tags?: string[];
  }) {
    const content = new CreatorContent({
      ...data,
      stats: { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 },
      reach: { organic: 0, amplified: 0, total: 0 },
      engagement: 0,
      tags: data.tags || [],
    });

    await content.save();

    // Update creator's post count
    await CreatorProfile.findOneAndUpdate(
      { userId: data.creatorId },
      { $inc: { 'stats.posts': 1 } }
    );

    // Award coins for content creation
    await this.awardCoins(data.creatorId, 5, 'post', { contentId: content._id.toString() });

    return content;
  }

  /**
   * Update content stats
   */
  async updateContentStats(contentId: string, action: 'view' | 'like' | 'comment' | 'share' | 'save') {
    const updateField: Record<string, number> = {};
    updateField[`stats.${action}s`] = 1;

    const content = await CreatorContent.findByIdAndUpdate(
      contentId,
      { $inc: updateField },
      { new: true }
    );

    if (!content) return null;

    // Recalculate engagement
    content.engagement = this.calculateEngagement(content.stats);
    await content.save();

    return content;
  }

  /**
   * Get content by category/area
   */
  async getContent(options: {
    areaId?: string;
    category?: string;
    type?: string;
    creatorId?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const query: any = {};
    if (options.areaId) query['locality.areaId'] = options.areaId;
    if (options.category) query.category = options.category;
    if (options.type) query.type = options.type;
    if (options.creatorId) query.creatorId = options.creatorId;

    const content = await CreatorContent.find(query)
      .sort({ engagement: -1, createdAt: -1 })
      .skip(options.offset || 0)
      .limit(options.limit || 20);

    return content;
  }

  /**
   * Get programs and check eligibility
   */
  async getPrograms(userId: string) {
    const profile = await CreatorProfile.findOne({ userId });
    const programs = await CreatorProgram.find({ active: true });

    const programsWithEligibility = programs.map(program => {
      const eligible = this.checkProgramEligibility(profile, program);
      return {
        ...program.toObject(),
        eligible,
        progress: this.getProgramProgress(profile, program),
      };
    });

    return programsWithEligibility;
  }

  /**
   * Join a program
   */
  async joinProgram(userId: string, programType: CreatorRole) {
    const profile = await CreatorProfile.findOne({ userId });
    if (!profile) throw new Error('Profile not found');

    const program = await CreatorProgram.findOne({ type: programType, active: true });
    if (!program) throw new Error('Program not found');

    if (!this.checkProgramEligibility(profile, program)) {
      throw new Error('Not eligible for this program');
    }

    // Add role if not already present
    if (!profile.roles.includes(programType)) {
      profile.roles.push(programType);
      await profile.save();

      // Award program badges
      await this.awardCoins(userId, program.benefits.coins, 'bonus');

      // Add badges
      for (const badge of program.benefits.badges) {
        if (!profile.badges.includes(badge)) {
          profile.badges.push(badge);
        }
      }
      await profile.save();
    }

    return { success: true, roles: profile.roles };
  }

  /**
   * Award coins to creator
   */
  async awardCoins(userId: string, amount: number, type: string, source?: { contentId?: string; type?: string }) {
    const earning = new CreatorEarning({
      creatorId: userId,
      userId,
      type: type as any,
      amount,
      status: 'approved',
      source,
      processedAt: new Date(),
    });

    await earning.save();

    // Update creator's earnings
    await CreatorProfile.findOneAndUpdate(
      { userId },
      {
        $inc: {
          'earnings.totalEarned': amount,
          'earnings.pending': amount,
        },
      }
    );

    return earning;
  }

  /**
   * Get creator earnings
   */
  async getEarnings(userId: string, options: { status?: string; limit?: number } = {}) {
    const query: any = { creatorId: userId };
    if (options.status) query.status = options.status;

    const earnings = await CreatorEarning.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit || 50);

    const totals = await CreatorEarning.aggregate([
      { $match: { creatorId: userId } },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
        },
      },
    ]);

    return { earnings, totals };
  }

  /**
   * Request withdrawal
   */
  async requestWithdrawal(userId: string, amount: number) {
    const profile = await CreatorProfile.findOne({ userId });
    if (!profile) throw new Error('Profile not found');

    if (profile.earnings.pending < amount) {
      throw new Error('Insufficient balance');
    }

    // Move from pending to withdrawal request
    await CreatorEarning.create({
      creatorId: userId,
      userId,
      type: 'withdrawal',
      amount: -amount,
      status: 'pending',
    });

    return { success: true, pending: profile.earnings.pending - amount };
  }

  /**
   * Amplify content (boost visibility)
   */
  async amplifyContent(contentId: string, boostAmount: number) {
    const content = await CreatorContent.findById(contentId);
    if (!content) throw new Error('Content not found');

    // Add amplified reach based on boost
    const amplifiedReach = Math.floor(boostAmount * 10);
    content.reach.amplified += amplifiedReach;
    content.reach.total = content.reach.organic + content.reach.amplified;
    await content.save();

    return content;
  }

  /**
   * Private helpers
   */
  private calculateEngagement(stats: any): number {
    if (stats.views === 0) return 0;
    const engagement = ((stats.likes + stats.comments + stats.shares) / stats.views) * 100;
    return Math.round(engagement * 100) / 100;
  }

  private checkProgramEligibility(profile: any, program: any): boolean {
    if (!profile) return false;

    const reqs = program.requirements;
    if (profile.stats.followers < reqs.minFollowers) return false;
    if (profile.stats.posts < reqs.minPosts) return false;

    // Check required badges
    for (const badge of reqs.requiredBadges) {
      if (!profile.badges.includes(badge)) return false;
    }

    return true;
  }

  private getProgramProgress(profile: any, program: any): any {
    if (!profile) return null;

    return {
      followers: { current: profile.stats.followers, required: program.requirements.minFollowers },
      posts: { current: profile.stats.posts, required: program.requirements.minPosts },
      badges: { earned: profile.badges.filter((b: string) => program.requirements.requiredBadges.includes(b)).length, required: program.requirements.requiredBadges.length },
    };
  }

  // ===== CROSS-ECOSYSTEM INTEGRATIONS =====

  /**
   * Register creator on Creator QR Service
   */
  async registerOnCreatorQR(userId: string, creatorData: any): Promise<any> {
    try {
      const response = await axios.post(
        `${CREATOR_QR_URL}/api/merchant/register-creator`,
        { userId, ...creatorData },
        { headers: HEADERS, timeout: 5000 }
      );
      return { success: true, qrData: response.data };
    } catch (error: any) {
      console.error('Creator QR registration failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Creator QR dashboard data
   */
  async getCreatorQRDashboard(userId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${CREATOR_QR_URL}/api/analytics/creator/${userId}`,
        { headers: HEADERS, timeout: 5000 }
      );
      return { success: true, analytics: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync creator stats with REZ Prive for elite tier
   */
  async syncWithRezPrive(userId: string): Promise<any> {
    try {
      const profile = await CreatorProfile.findOne({ userId });
      if (!profile) return { success: false, error: 'Profile not found' };

      // Get unified score from Prive
      const priveResponse = await axios.get(
        `${REZ_PRIVE_URL}/api/ecosystem/unified-score?userId=${userId}`,
        { headers: HEADERS, timeout: 5000 }
      );

      // Record engagement signals
      await axios.post(
        `${REZ_PRIVE_URL}/api/engagement/signal`,
        {
          userId,
          source: 'buzzlocal_creator',
          type: 'content_creation',
          data: {
            followers: profile.stats.followers,
            posts: profile.stats.posts,
            engagement: profile.stats.engagement,
            tier: profile.tier,
          },
        },
        { headers: HEADERS, timeout: 5000 }
      );

      return {
        success: true,
        priveTier: priveResponse.data?.tier,
        unifiedScore: priveResponse.data?.unifiedScore,
      };
    } catch (error: any) {
      console.error('REZ Prive sync failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Prive eligibility for exclusive creator features
   */
  async checkPriveEligibility(userId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${REZ_PRIVE_URL}/api/eligibility?userId=${userId}`,
        { headers: HEADERS, timeout: 5000 }
      );
      return {
        success: true,
        eligible: response.data?.eligible,
        tier: response.data?.tier,
        pillars: response.data?.pillars,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get merchant insights from REZ Merchant Intelligence
   */
  async getMerchantInsights(creatorId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${MERCHANT_INTEL_URL}/api/v1/merchant/${creatorId}/insights`,
        { headers: HEADERS, timeout: 5000 }
      );
      return { success: true, insights: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Transfer earnings to wallet
   */
  async transferToWallet(userId: string, amount: number): Promise<any> {
    try {
      const response = await axios.post(
        `${WALLET_URL}/api/coins/add`,
        {
          userId,
          amount,
          type: 'BRANDED',
          reason: 'creator_earnings',
        },
        { headers: HEADERS, timeout: 5000 }
      );
      return { success: true, transaction: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get unified creator dashboard (BuzzLocal + Creator QR + REZ Prive)
   */
  async getUnifiedDashboard(userId: string): Promise<any> {
    try {
      // Parallel fetch all data
      const [profile, qrDashboard, priveStatus, walletData] = await Promise.all([
        this.getProfile(userId),
        this.getCreatorQRDashboard(userId),
        this.checkPriveEligibility(userId),
        axios.get(`${WALLET_URL}/api/wallet/${userId}`, { headers: HEADERS, timeout: 5000 }).catch(() => ({ data: null })),
      ]);

      return {
        success: true,
        profile: profile?.profile,
        recentContent: profile?.recentContent,
        qrAnalytics: qrDashboard.success ? qrDashboard.analytics : null,
        priveStatus: priveStatus,
        wallet: walletData.data || null,
        programs: await this.getPrograms(userId),
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const creatorService = new CreatorService();
