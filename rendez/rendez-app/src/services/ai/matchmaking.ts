/**
 * AI Matchmaking Service
 * Connects to Genie AI for personality analysis, compatibility scoring, and recommendations
 */

import axios from 'axios';

const GENIE_GATEWAY_URL = process.env.EXPO_PUBLIC_GENIE_URL || 'http://localhost:4701';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

// ============================================
// Compatibility Types
// ============================================

export interface CompatibilityScore {
  overall: number; // 0-100
  breakdown: {
    personality: number;
    interests: number;
    lifestyle: number;
    values: number;
    communication: number;
  };
  reasons: string[];
  strengths: string[];
  challenges: string[];
  aiSummary: string;
}

export interface AIPersonalityProfile {
  personalityType: string;
  loveLanguage: string[];
  attachmentStyle: string;
  communicationStyle: string;
  emotionalIntelligence: number;
  relationshipGoals: string[];
  compatibilityTraits: string[];
  riskFactors: string[];
  idealPartnerTraits: string[];
}

export interface AIDateSuggestion {
  type: 'restaurant' | 'activity' | 'event' | 'outdoor' | 'cultural';
  title: string;
  description: string;
  reason: string;
  budget: 'low' | 'medium' | 'high';
  location?: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  bookingUrl?: string;
  price?: number;
  rating?: number;
}

export interface AIConversationInsight {
  responseSuggestions: string[];
  iceBreakers: string[];
  dateIdeas: AIDateSuggestion[];
  conversationStarters: {
    topic: string;
    questions: string[];
  }[];
  warnings?: {
    type: 'red_flag' | 'sensitivity' | 'incompatible';
    message: string;
  }[];
}

// ============================================
// AI Matchmaking Service
// ============================================

class AIMatchmakingService {
  private client: axios.AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: GENIE_GATEWAY_URL,
      timeout: 10000,
      headers: {
        'x-internal-token': INTERNAL_TOKEN || '',
      },
    });
  }

  /**
   * Get compatibility score between two users
   */
  async getCompatibilityScore(
    userId: string,
    matchId: string
  ): Promise<CompatibilityScore> {
    try {
      const response = await this.client.post('/api/ai/compatibility', {
        userId,
        matchId,
        source: 'rendez',
      });

      return response.data;
    } catch (error) {
      // Fallback to mock data for demo
      return this.getMockCompatibilityScore();
    }
  }

  /**
   * Get AI personality profile for user
   */
  async getPersonalityProfile(userId: string): Promise<AIPersonalityProfile> {
    try {
      const response = await this.client.get(`/api/ai/personality/${userId}`, {
        headers: { 'x-internal-token': INTERNAL_TOKEN || '' },
      });

      return response.data;
    } catch (error) {
      return this.getMockPersonalityProfile();
    }
  }

  /**
   * Get AI match recommendations
   */
  async getMatchRecommendations(
    userId: string,
    limit = 10
  ): Promise<{ profiles: any[]; reason: string }> {
    try {
      const response = await this.client.get('/api/ai/recommendations', {
        params: { userId, limit, source: 'rendez' },
      });

      return response.data;
    } catch (error) {
      return { profiles: [], reason: 'AI recommendations unavailable' };
    }
  }

  /**
   * Get conversation insights for a match
   */
  async getConversationInsights(
    userId: string,
    matchId: string,
    conversationHistory?: string[]
  ): Promise<AIConversationInsight> {
    try {
      const response = await this.client.post('/api/ai/conversation-insights', {
        userId,
        matchId,
        conversationHistory,
        source: 'rendez',
      });

      return response.data;
    } catch (error) {
      return this.getMockConversationInsights();
    }
  }

  /**
   * Get date suggestions based on both profiles
   */
  async getDateSuggestions(
    userId: string,
    matchId: string,
    budget?: 'low' | 'medium' | 'high'
  ): Promise<AIDateSuggestion[]> {
    try {
      const response = await this.client.post('/api/ai/date-suggestions', {
        userId,
        matchId,
        budget,
        source: 'rendez',
      });

      return response.data.suggestions;
    } catch (error) {
      return this.getMockDateSuggestions();
    }
  }

  /**
   * Analyze profile for red flags
   */
  async analyzeProfileSafety(profileData: any): Promise<{
    isSafe: boolean;
    flags: { type: string; severity: 'low' | 'medium' | 'high'; message: string }[];
  }> {
    try {
      const response = await this.client.post('/api/ai/safety-analysis', {
        profileData,
        source: 'rendez',
      });

      return response.data;
    } catch (error) {
      return { isSafe: true, flags: [] };
    }
  }

  // ============================================
  // Mock Data for Demo
  // ============================================

  private getMockCompatibilityScore(): CompatibilityScore {
    const overall = Math.floor(Math.random() * 30) + 70; // 70-100
    return {
      overall,
      breakdown: {
        personality: Math.floor(Math.random() * 30) + 60,
        interests: Math.floor(Math.random() * 30) + 65,
        lifestyle: Math.floor(Math.random() * 25) + 70,
        values: Math.floor(Math.random() * 20) + 75,
        communication: Math.floor(Math.random() * 35) + 60,
      },
      reasons: [
        'You both enjoy outdoor activities and nature',
        'Similar sense of humor and communication style',
        'Shared interest in technology and innovation',
        'Both value family and close friendships',
      ],
      strengths: [
        'Complementary communication styles',
        'Shared sense of adventure',
        'Similar long-term life goals',
      ],
      challenges: [
        'Different preferred activity levels',
        'May have varying approaches to conflict resolution',
      ],
      aiSummary: `Your compatibility score is ${overall}%. You share strong alignment in personality and lifestyle preferences. The AI has identified several shared interests that could form the foundation of a meaningful connection.`,
    };
  }

  private getMockPersonalityProfile(): AIPersonalityProfile {
    const types = ['INTJ', 'ENFP', 'INFJ', 'ENTP', 'ISFP', 'ESFJ'];
    const loveLanguages = [
      ['Words of Affirmation', 'Quality Time'],
      ['Acts of Service', 'Physical Touch'],
      ['Receiving Gifts', 'Quality Time'],
    ];
    const styles = ['Analytical', 'Expressive', 'Supportive', 'Adventurous'];

    return {
      personalityType: types[Math.floor(Math.random() * types.length)],
      loveLanguage: loveLanguages[Math.floor(Math.random() * loveLanguages.length)],
      attachmentStyle: ['Secure', 'Anxious', 'Avoidant'][Math.floor(Math.random() * 3)],
      communicationStyle: styles[Math.floor(Math.random() * styles.length)],
      emotionalIntelligence: Math.floor(Math.random() * 30) + 70,
      relationshipGoals: [
        'Long-term partnership',
        'Shared adventures',
        'Emotional connection',
      ],
      compatibilityTraits: [
        'Emotionally intelligent',
        'Open to communication',
        'Values honesty',
      ],
      riskFactors: [],
      idealPartnerTraits: [
        'Similar values',
        'Good communicator',
        'Adventurous spirit',
      ],
    };
  }

  private getMockConversationInsights(): AIConversationInsight {
    return {
      responseSuggestions: [
        "That's really interesting! I'd love to hear more about that.",
        "I noticed we have similar interests. What's your favorite memory related to that?",
        'That sounds amazing! Have you done anything similar recently?',
      ],
      iceBreakers: [
        "What's the most adventurous thing you've done recently?",
        'If you could travel anywhere right now, where would you go?',
        "What's something you're passionate about?",
      ],
      dateIdeas: this.getMockDateSuggestions(),
      conversationStarters: [
        {
          topic: 'Travel',
          questions: [
            'What was your most memorable trip?',
            'Is there a place you want to visit badly?',
            'Beach or mountains?',
          ],
        },
        {
          topic: 'Food',
          questions: [
            'What cuisine do you enjoy cooking the most?',
            'Any food you absolutely refuse to eat?',
            'Favorite restaurant in your city?',
          ],
        },
      ],
    };
  }

  private getMockDateSuggestions(): AIDateSuggestion[] {
    return [
      {
        type: 'restaurant',
        title: 'Rooftop dinner with sunset view',
        description: 'Intimate rooftop restaurant with panoramic city views',
        reason: 'Both of you enjoy atmospheric dining experiences',
        budget: 'high',
        price: 2500,
        rating: 4.8,
      },
      {
        type: 'activity',
        title: 'Art workshop together',
        description: 'Couples pottery or painting class',
        reason: 'Creative activity that encourages conversation',
        budget: 'medium',
        price: 1500,
        rating: 4.6,
      },
      {
        type: 'outdoor',
        title: 'Morning trek or nature walk',
        description: 'Start the day with adventure and fresh air',
        reason: 'You both value active lifestyles',
        budget: 'low',
        rating: 4.9,
      },
      {
        type: 'event',
        title: 'Live music or comedy show',
        description: 'Check out a local event happening this weekend',
        reason: 'Shared interest in entertainment',
        budget: 'medium',
        price: 800,
        rating: 4.5,
      },
    ];
  }
}

export const aiMatchmakingService = new AIMatchmakingService();
export default aiMatchmakingService;
