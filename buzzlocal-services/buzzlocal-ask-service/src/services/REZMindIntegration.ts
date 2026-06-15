import axios from 'axios';

const REZ_MIND_URL = process.env.REZ_MIND_ENDPOINT || 'https://rezmind.rezapp.com';
const REZ_MIND_API_KEY = process.env.REZ_MIND_API_KEY;

interface IntentPrediction {
  category: string;
  subcategory?: string;
  confidence: number;
  entities?: Record<string, any>;
}

interface ContentModeration {
  safe: boolean;
  categories: string[];
  score: number;
}

export class REZMindIntegration {
  async predictIntent(query: string, context?: any): Promise<IntentPrediction> {
    try {
      const response = await axios.post(`${REZ_MIND_URL}/api/intent/predict`, {
        query,
        context: {
          ...context,
          source: 'buzzlocal-ask',
        },
      }, {
        headers: {
          'Authorization': `Bearer ${REZ_MIND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      return {
        category: response.data.category,
        subcategory: response.data.subcategory,
        confidence: response.data.confidence || 0.8,
        entities: response.data.entities,
      };
    } catch (error) {
      // Fallback to local categorization
      return this.localIntentPrediction(query);
    }
  }

  async generateAnswer(query: string, context: any): Promise<string> {
    try {
      const response = await axios.post(`${REZ_MIND_URL}/api/generate`, {
        prompt: this.buildPrompt(query, context),
        context: {
          ...context,
          source: 'buzzlocal-ask',
        },
      }, {
        headers: {
          'Authorization': `Bearer ${REZ_MIND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      return response.data.answer;
    } catch (error) {
      console.error('REZ Mind generation error:', error);
      throw new Error('AI generation failed');
    }
  }

  async moderateContent(content: string): Promise<ContentModeration> {
    try {
      const response = await axios.post(`${REZ_MIND_URL}/api/moderate`, {
        content,
      }, {
        headers: {
          'Authorization': `Bearer ${REZ_MIND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 3000,
      });

      return {
        safe: response.data.safe,
        categories: response.data.categories || [],
        score: response.data.score || 1,
      };
    } catch (error) {
      // Default to safe if moderation fails
      return { safe: true, categories: [], score: 1 };
    }
  }

  async trackEvent(event: string, data: Record<string, any>): Promise<void> {
    try {
      await axios.post(`${REZ_MIND_URL}/api/events`, {
        event,
        data: {
          ...data,
          source: 'buzzlocal-ask',
          timestamp: new Date().toISOString(),
        },
      }, {
        headers: {
          'Authorization': `Bearer ${REZ_MIND_API_KEY}`,
        },
        timeout: 2000,
      });
    } catch (error) {
      // Silent fail for analytics
      console.log('Event tracking failed:', error);
    }
  }

  private buildPrompt(query: string, context: any): string {
    const area = context.area || 'your area';

    return `You are a helpful local assistant for someone in ${area}. Answer the following question concisely and helpfully.

Question: ${query}

Guidelines:
- Be specific and local (mention areas, places if relevant)
- Be concise (2-4 sentences)
- Prioritize verified information
- If unsure, say you don't know
- Format with bullet points if multiple items
- Include approximate prices/distances if relevant`;
  }

  private localIntentPrediction(query: string): IntentPrediction {
    const queryLower = query.toLowerCase();

    const categories: Record<string, { keywords: string[]; subcategories?: Record<string, string[]> }> = {
      food: {
        keywords: ['restaurant', 'food', 'eat', 'biryani', 'pizza', 'coffee', 'cafe', 'dinner', 'lunch', 'breakfast'],
        subcategories: {
          cuisine: ['indian', 'chinese', 'italian', 'continental', 'thai', 'japanese'],
          type: ['veg', 'non-veg', 'vegan', 'street food'],
        },
      },
      safety: {
        keywords: ['safe', 'safety', 'danger', 'alert', 'police', 'crime', 'emergency', 'sos'],
      },
      transport: {
        keywords: ['bus', 'metro', 'auto', 'cab', 'taxi', 'parking', 'traffic', 'route', 'direction'],
        subcategories: {
          mode: ['bus stop', 'metro station', 'parking'],
        },
      },
      events: {
        keywords: ['event', 'happening', 'party', 'concert', 'festival', 'market'],
      },
      shopping: {
        keywords: ['buy', 'shop', 'store', 'mall', 'market', 'grocery'],
      },
      services: {
        keywords: ['plumber', 'electrician', 'cleaning', 'repair', 'service', 'help'],
      },
      housing: {
        keywords: ['rent', 'pg', 'apartment', 'flat', 'house', 'room', 'lease'],
      },
      health: {
        keywords: ['doctor', 'hospital', 'pharmacy', 'clinic', 'medicine', 'health'],
      },
      general: {
        keywords: [],
      },
    };

    let bestMatch = { category: 'general', confidence: 0.3 };

    for (const [category, config] of Object.entries(categories)) {
      const matchCount = config.keywords.filter(k => queryLower.includes(k)).length;
      if (matchCount > 0) {
        const confidence = Math.min(0.95, 0.3 + (matchCount * 0.2));
        if (confidence > bestMatch.confidence) {
          bestMatch = { category, confidence };
        }
      }
    }

    return bestMatch;
  }
}

export const rezMind = new REZMindIntegration();
