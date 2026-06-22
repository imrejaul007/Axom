import axios from 'axios';

interface IntentClassification {
  category: string;
  intentType: string;
  entities: {
    location?: string;
    service?: string;
    time?: string;
    price?: string;
  };
  confidence: number;
}

interface Location {
  lat: number;
  lng: number;
  area?: string;
}

interface TrustProfile {
  userId: string;
  score: number;
  level: string;
  area?: string;
}

interface ExpertAnswer {
  expertId: string;
  name: string;
  domain: string;
  answer: string;
  confidence: number;
}

export class IntentRouter {
  private intentPredictorUrl: string;
  private expertServices: Record<string, string>;

  constructor() {
    this.intentPredictorUrl = process.env.REZ_INTENT_PREDICTOR_URL || 'http://localhost:4018';
    this.expertServices = {
      health: process.env.EXPERT_HEALTH_URL || 'http://localhost:3011',
      hospitality: process.env.EXPERT_HOSPITALITY_URL || 'http://localhost:3000',
      retail: process.env.EXPERT_RETAIL_URL || 'http://localhost:3004',
      fitness: process.env.EXPERT_FITNESS_URL || 'http://localhost:3010',
      education: process.env.EXPERT_EDUCATION_URL || 'http://localhost:3006'
    };
  }

  async classifyIntent(
    query: string,
    location?: Location
  ): Promise<IntentClassification> {
    try {
      // Try REZ Intent Predictor first
      const response = await axios.post(`${this.intentPredictorUrl}/api/intent/predict`, {
        text: query,
        context: {
          location: location ? { lat: location.lat, lng: location.lng } : undefined,
          domain: 'buzzlocal'
        }
      }, {
        timeout: 3000
      });

      return {
        category: response.data.category || this.ruleBasedCategory(query),
        intentType: response.data.intentType || this.ruleBasedIntent(query),
        entities: response.data.entities || {},
        confidence: response.data.confidence || 0.7
      };
    } catch (error) {
      // Fallback to rule-based classification
      return {
        category: this.ruleBasedCategory(query),
        intentType: this.ruleBasedIntent(query),
        entities: this.extractEntities(query),
        confidence: 0.6
      };
    }
  }

  private ruleBasedCategory(query: string): string {
    const lowerQuery = query.toLowerCase();

    // Safety queries
    if (lowerQuery.match(/\b(safe|safety|route|walk|night|women|girl|harassment|police|crime|alert)\b/)) {
      return 'safety';
    }

    // Food & Drink
    if (lowerQuery.match(/\b(restaurant|cafe|coffee|food|biryani|pizza|burger|dinner|lunch|breakfast|late night|open now)\b/)) {
      return 'food_drink';
    }

    // Services
    if (lowerQuery.match(/\b(repair|plumber|electrician|carpenter|painter|cleaning|service)\b/)) {
      return 'services';
    }

    // Housing
    if (lowerQuery.match(/\b(pg|room|flat|apartment|rent|house|roommate|flatmate|society|apartment)\b/)) {
      return 'housing';
    }

    // Events
    if (lowerQuery.match(/\b(event|concert|meetup|networking|party|workshop|conference| happening|today|tonight)\b/)) {
      return 'events';
    }

    // Commerce / Shopping
    if (lowerQuery.match(/\b(buy|sell|price|shop|store|market|discount|offer|deal)\b/)) {
      return 'commerce';
    }

    // Health
    if (lowerQuery.match(/\b(doctor|hospital|clinic|pharmacy|medicine|health|medical|dentist|therapist)\b/)) {
      return 'health';
    }

    // Transport
    if (lowerQuery.match(/\b(metro|bus|traffic|road|route|drive|uber|auto|taxi|train)\b/)) {
      return 'transport';
    }

    return 'general';
  }

  private ruleBasedIntent(query: string): string {
    const lowerQuery = query.toLowerCase();

    // Recommendation intent
    if (lowerQuery.match(/\b(best|good|top|recommend|suggest|where should|which)\b/)) {
      return 'recommendation';
    }

    // Search/Find intent
    if (lowerQuery.match(/\b(find|looking for|search|need|want|anyone know|any)\b/)) {
      return 'search';
    }

    // Question intent
    if (lowerQuery.match(/\b(is there|are there|does|can you|tell me|what|how|why|when)\b/)) {
      return 'question';
    }

    // Comparison intent
    if (lowerQuery.match(/\b(better|vs|versus|compare|difference|instead|or)\b/)) {
      return 'comparison';
    }

    // Price intent
    if (lowerQuery.match(/\b(cheap|affordable|expensive|price|cost|rate|charge)\b/)) {
      return 'price_inquiry';
    }

    // Availability intent
    if (lowerQuery.match(/\b(open|closed|available|busy|crowded|wait|appointment)\b/)) {
      return 'availability';
    }

    return 'general';
  }

  private extractEntities(query: string): { location?: string; service?: string; time?: string; price?: string } {
    const entities: { location?: string; service?: string; time?: string; price?: string } = {};

    // Extract location patterns
    const locationMatch = query.match(/(?:near|around|in|at)\s+([A-Za-z0-9\s]+?)(?:\?|$|,)/i);
    if (locationMatch) {
      entities.location = locationMatch[1].trim();
    }

    // Extract service patterns
    const serviceMatch = query.match(/\b(plumber|electrician|carpenter|doctor|restaurant|cafe|pharmacy|gym)\b/i);
    if (serviceMatch) {
      entities.service = serviceMatch[0];
    }

    // Extract time patterns
    const timeMatch = query.match(/(?:open|available|crowded|busy)\s+(?:now|today|tonight|tomorrow|\d+\s*(?:min|hour|hrs))/i);
    if (timeMatch) {
      entities.time = timeMatch[0];
    }

    // Extract price patterns
    const priceMatch = query.match(/(?:under|below|around|less than|about|approximately)\s*(?:₹|rs\.?\s*)?(\d+)/i);
    if (priceMatch) {
      entities.price = priceMatch[0];
    }

    return entities;
  }

  async getAIResponse(
    query: string,
    intent: IntentClassification,
    location?: Location,
    trustProfile?: TrustProfile | null,
    previousQuery?: string
  ): Promise<string> {
    try {
      // Build context for AI
      const context = {
        query,
        category: intent.category,
        intent: intent.intentType,
        entities: intent.entities,
        location: location ? {
          lat: location.lat,
          lng: location.lng,
          area: location.area
        } : undefined,
        trustLevel: trustProfile?.level || 'new',
        area: trustProfile?.area,
        previousQuery,
        useVerifiedOnly: trustProfile?.level === 'trusted' || trustProfile?.level === 'expert'
      };

      // Call REZ Mind or Intent Predictor
      const response = await axios.post(`${this.intentPredictorUrl}/api/intent/respond`, {
        ...context,
        prompt: this.buildPrompt(context)
      }, {
        timeout: 5000
      });

      return response.data.response || this.generateFallbackResponse(intent, location);
    } catch (error) {
      return this.generateFallbackResponse(intent, location);
    }
  }

  private buildPrompt(context: Record<string, unknown>): string {
    const { query, category, location, trustLevel, area } = context;

    return `You are BuzzLocal's local AI assistant. A user is asking:

"${query}"

Category: ${category}
${location ? `Location: Near ${(location as { area?: string }).area || 'their current location'}` : ''}
User trust level: ${trustLevel}
${area ? `User's area: ${area}` : ''}

Provide a helpful, accurate response based on:
1. The query category and intent
2. Location context
3. Trust level (trusted users' answers are more reliable)
4. Be concise, friendly, and actionable

Respond in the user's language (English with Hindi/Hinglish hints if appropriate for Indian users).`;
  }

  private generateFallbackResponse(intent: IntentClassification, location?: Location): string {
    const areaName = location?.area || 'your area';

    switch (intent.category) {
      case 'food_drink':
        return `Looking for food & drink options in ${areaName}? Here's what I found:\n\n🍔 **Trending in your area:**\n- Local cafes with great reviews\n- Late-night food spots\n- Popular brunch places\n\nWant me to search more specifically? Try:\n• "Best biryani near me"\n• "Late night café for working"\n• "Restaurant that's not crowded now"`;

      case 'safety':
        return `Safety is important! In ${areaName}:\n\n🛡️ **Safety Tips:**\n- Well-lit, busy areas are generally safer\n- Share your location with trusted contacts\n- Check the BuzzLocal Safety Map for crowd density\n\nNeed specific help? Try:\n• "Safe route to [destination]"\n• "Crowd density near me"\n• "Nearby safe places open now"`;

      case 'services':
        return `Looking for services in ${areaName}?\n\n🔧 **Available services:**\n- Home repairs (plumber, electrician)\n- Beauty services (salon, spa)\n- Professional services\n\nWant me to find specific services? Try:\n• "Best AC repair near me"\n• "Verified electricians in [area]"\n• "24hr plumber nearby"`;

      case 'housing':
        return `Looking for housing in ${areaName}?\n\n🏠 **Options to explore:**\n- PGs and shared rooms\n- Studio apartments\n- Flats for families\n\nTry these specific searches:\n• "PG for girls near [location]"\n• "1BHK under ₹20K"\n• "Flats with good ventilation"`;

      case 'health':
        return `Looking for health services in ${areaName}?\n\n🏥 **Health resources:**\n- 24hr pharmacies\n- Nearby hospitals\n- Clinics and specialists\n\nTry:\n• "24hr pharmacy near me"\n• "Good dentist in [area]"\n• "Hospital with ICU beds"`;

      case 'events':
        return `Events in ${areaName} today!\n\n🎉 **Trending events:**\n- Networking meetups\n- Food festivals\n- Cultural events\n\nWant more details?\n• "Networking events tonight"\n• "Concerts this weekend"\n• "Tech meetups near me"`;

      case 'transport':
        return `Transport info for ${areaName}:\n\n🚇 **Options:**\n- Metro stations nearby\n- Traffic conditions\n- Bus routes\n\nTry:\n• "Metro delay updates"\n• "Traffic near [location]"\n• "Route to [destination]"`;

      default:
        return `I'm here to help! In ${areaName}, you can ask me about:\n\n🔍 **What I can help with:**\n• Places to eat, drink, explore\n• Local services and recommendations\n• Safety and crowd info\n• Events and activities\n• Housing and PGs\n• Transport and routes\n\nJust ask naturally - like "Best biryani near Koramangala" or "Safe route to Indiranagar"`;
    }
  }

  async getExpertAnswers(
    intent: IntentClassification,
    location?: Location
  ): Promise<ExpertAnswer[]> {
    const expertAnswers: ExpertAnswer[] = [];

    try {
      // Map categories to expert services
      const categoryToExpert: Record<string, string> = {
        health: 'health',
        food_drink: 'retail',
        housing: 'hospitality',
        services: 'hospitality',
        fitness: 'fitness',
        commerce: 'retail',
        education: 'education'
      };

      const expertKey = categoryToExpert[intent.category];
      if (!expertKey || !this.expertServices[expertKey]) {
        return expertAnswers;
      }

      const expertUrl = this.expertServices[expertKey];

      const response = await axios.post(`${expertUrl}/api/expert/query`, {
        query: intent.intentType,
        context: {
          location: location ? { lat: location.lat, lng: location.lng } : undefined
        }
      }, {
        timeout: 3000
      });

      if (response.data.answer) {
        expertAnswers.push({
          expertId: response.data.expertId || 'system',
          name: `${expertKey.charAt(0).toUpperCase() + expertKey.slice(1)} Expert`,
          domain: expertKey,
          answer: response.data.answer,
          confidence: response.data.confidence || 0.8
        });
      }
    } catch (error) {
      // Expert not available, continue without
    }

    return expertAnswers;
  }

  async getUserTrustProfile(userId: string): Promise<TrustProfile | null> {
    try {
      const gamificationUrl = process.env.REZ_GAMIFICATION_SERVICE_URL || 'http://localhost:4041';
      const response = await axios.get(`${gamificationUrl}/api/gamification/profile/${userId}`, {
        timeout: 2000
      });

      return {
        userId,
        score: response.data.score || 0,
        level: response.data.level || 'new',
        area: response.data.area
      };
    } catch (error) {
      return null;
    }
  }
}
