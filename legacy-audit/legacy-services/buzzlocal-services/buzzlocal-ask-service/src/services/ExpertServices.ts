import axios from 'axios';

const EXPERT_SERVICES: Record<string, string> = {
  fitness: process.env.REZ_FITNESS_EXPERT_URL || 'http://localhost:3010',
  salon: process.env.REZ_SALON_EXPERT_URL || 'http://localhost:3005',
  travel: process.env.REZ_TRAVEL_EXPERT_URL || 'http://localhost:3003',
  education: process.env.REZ_EDUCATION_EXPERT_URL || 'http://localhost:3006',
  health: process.env.REZ_HEALTH_EXPERT_URL || 'http://localhost:3011',
  hospitality: process.env.REZ_HOSPITALITY_EXPERT_URL || 'http://localhost:3000',
  retail: process.env.REZ_RETAIL_EXPERT_URL || 'http://localhost:3004',
};

interface ExpertResponse {
  answer: string;
  confidence: number;
  sources?: string[];
  suggestions?: string[];
}

export class ExpertServices {
  async query(category: string, question: string, context?: any): Promise<ExpertResponse | null> {
    const expertUrl = EXPERT_SERVICES[category.toLowerCase()];

    if (!expertUrl) {
      return null;
    }

    try {
      const response = await axios.post(`${expertUrl}/api/query`, {
        question,
        context: {
          ...context,
          source: 'buzzlocal-ask',
        },
      }, {
        timeout: 5000,
      });

      return {
        answer: response.data.answer,
        confidence: response.data.confidence || 0.8,
        sources: [category.toUpperCase() + ' Expert'],
        suggestions: response.data.suggestions,
      };
    } catch (error) {
      console.error(`Expert service error for ${category}:`, error);
      return null;
    }
  }

  async getRecommendations(category: string, userPreferences?: any): Promise<any[]> {
    const expertUrl = EXPERT_SERVICES[category.toLowerCase()];

    if (!expertUrl) {
      return [];
    }

    try {
      const response = await axios.post(`${expertUrl}/api/recommendations`, {
        preferences: userPreferences,
      }, {
        timeout: 5000,
      });

      return response.data.recommendations || [];
    } catch (error) {
      console.error(`Expert recommendations error for ${category}:`, error);
      return [];
    }
  }

  async validateAnswer(category: string, answer: string): Promise<{ valid: boolean; score: number }> {
    const expertUrl = EXPERT_SERVICES[category.toLowerCase()];

    if (!expertUrl) {
      return { valid: true, score: 0.5 };
    }

    try {
      const response = await axios.post(`${expertUrl}/api/validate`, {
        answer,
      }, {
        timeout: 3000,
      });

      return {
        valid: response.data.valid,
        score: response.data.score || 0.5,
      };
    } catch (error) {
      return { valid: true, score: 0.5 };
    }
  }

  getCategoryForQuery(query: string): string | null {
    const queryLower = query.toLowerCase();

    const categoryMap: Record<string, string[]> = {
      fitness: ['gym', 'workout', 'fitness', 'exercise', 'trainer', 'yoga'],
      salon: ['salon', 'beauty', 'haircut', 'spa', 'massage', 'makeup'],
      travel: ['travel', 'trip', 'vacation', 'flight', 'hotel', 'tour'],
      education: ['school', 'college', 'course', 'tutor', 'education', 'class'],
      health: ['doctor', 'hospital', 'medicine', 'health', 'medical', 'clinic'],
      hospitality: ['hotel', 'restaurant', 'cafe', 'food', 'dining'],
      retail: ['shop', 'store', 'buy', 'product', 'mall'],
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        return category;
      }
    }

    return null;
  }
}

export const expertServices = new ExpertServices();
