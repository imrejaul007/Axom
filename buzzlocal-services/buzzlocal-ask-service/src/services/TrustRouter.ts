import axios from 'axios';

interface TrustProfile {
  userId: string;
  score: number;
  level: string;
  verification: {
    phone: boolean;
    email: boolean;
    address: boolean;
    society: boolean;
    id: boolean;
  };
  badges: string[];
  stats: {
    posts: number;
    answers: number;
    helpfulAnswers: number;
    followers: number;
    alerts: number;
  };
  area?: string;
  neighborhoods: string[];
}

export class TrustRouter {
  private gamificationServiceUrl: string;
  private authServiceUrl: string;

  constructor() {
    this.gamificationServiceUrl = process.env.REZ_GAMIFICATION_SERVICE_URL || 'http://localhost:4041';
    this.authServiceUrl = process.env.REZ_AUTH_SERVICE_URL || 'http://localhost:4002';
  }

  async getUserTrustProfile(userId: string): Promise<TrustProfile | null> {
    try {
      // Try to get from gamification service
      const response = await axios.get(`${this.gamificationServiceUrl}/api/gamification/profile/${userId}`, {
        timeout: 2000,
        headers: {
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
        }
      });

      return response.data;
    } catch (error) {
      // Return default profile for new users
      return {
        userId,
        score: 0,
        level: 'new',
        verification: {
          phone: false,
          email: false,
          address: false,
          society: false,
          id: false
        },
        badges: [],
        stats: {
          posts: 0,
          answers: 0,
          helpfulAnswers: 0,
          followers: 0,
          alerts: 0
        },
        neighborhoods: []
      };
    }
  }

  async verifyAddress(
    userId: string,
    address: {
      street: string;
      area: string;
      city: string;
      pincode: string;
    }
  ): Promise<{ verified: boolean; score: number }> {
    try {
      // In production, this would verify via GPS, utility bill, etc.
      // For now, we'll simulate verification
      const response = await axios.post(
        `${this.authServiceUrl}/api/auth/verify-address`,
        { userId, address },
        {
          timeout: 5000,
          headers: {
            'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
          }
        }
      );

      return {
        verified: response.data.verified,
        score: response.data.score || 25
      };
    } catch (error) {
      // Simulate verification for demo
      return {
        verified: true,
        score: 25
      };
    }
  }

  async verifySociety(
    userId: string,
    societyId: string,
    adminCode: string
  ): Promise<{ verified: boolean; score: number }> {
    try {
      const response = await axios.post(
        `${this.authServiceUrl}/api/auth/verify-society`,
        { userId, societyId, adminCode },
        {
          timeout: 5000,
          headers: {
            'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
          }
        }
      );

      return {
        verified: response.data.verified,
        score: response.data.score || 30
      };
    } catch (error) {
      return {
        verified: false,
        score: 0
      };
    }
  }

  // Route query to appropriate answer priority
  routeAnswerPriority(
    answers: Array<{
      userTrustLevel: string;
      userTrustScore: number;
      helpful: number;
      type: string;
    }>
  ): string[] {
    // Sort by: Verified Expert > Trusted with high helpful > High helpful > New
    return answers
      .map((a, idx) => ({ ...a, idx }))
      .sort((a, b) => {
        // Type priority
        if (a.type === 'verified' && b.type !== 'verified') return -1;
        if (b.type === 'verified' && a.type !== 'verified') return 1;

        // Trust level priority
        const trustOrder = { legend: 6, guardian: 5, expert: 4, trusted: 3, verified: 2, new: 1 };
        const aTrust = trustOrder[a.userTrustLevel as keyof typeof trustOrder] || 1;
        const bTrust = trustOrder[b.userTrustLevel as keyof typeof trustOrder] || 1;
        if (aTrust !== bTrust) return bTrust - aTrust;

        // Trust score
        if (a.userTrustScore !== b.userTrustScore) {
          return b.userTrustScore - a.userTrustScore;
        }

        // Helpful count
        return b.helpful - a.helpful;
      })
      .map(a => String(a.idx));
  }

  // Get trust level display info
  getTrustDisplay(level: string): { badge: string; color: string; abilities: string[] } {
    const displays: Record<string, { badge: string; color: string; abilities: string[] }> = {
      new: {
        badge: '🟢 New',
        color: '#22C55E',
        abilities: ['Basic features', 'Can browse', 'Can ask questions']
      },
      verified: {
        badge: '✅ Verified',
        color: '#3B82F6',
        abilities: ['Can post', 'Can comment', 'Can answer']
      },
      trusted: {
        badge: '⭐ Trusted',
        color: '#F59E0B',
        abilities: ['Can verify alerts', 'Priority in search', 'Featured answers']
      },
      expert: {
        badge: '🏆 Expert',
        color: '#8B5CF6',
        abilities: ['Expert badge', 'Featured slots', 'Boost visibility']
      },
      guardian: {
        badge: '🛡️ Guardian',
        color: '#EF4444',
        abilities: ['Safety authority', 'Emergency access', 'Crisis response']
      },
      legend: {
        badge: '👑 Legend',
        color: '#FFD700',
        abilities: ['Community leader', 'All features', 'Exclusive events']
      }
    };

    return displays[level] || displays.new;
  }
}
