interface IntentClassification {
  category: string;
  intentType: string;
  entities: Record<string, string>;
  confidence: number;
}

interface ExpertAnswer {
  expertId: string;
  name: string;
  domain: string;
  answer: string;
  confidence: number;
}

interface CommunityAnswer {
  _id: string;
  userId: string;
  userTrustLevel: string;
  userTrustScore: number;
  userArea?: string;
  content: string;
  type: string;
  helpful: number;
}

interface SynthesizedResponse {
  answer: string;
  sources: {
    type: string;
    name?: string;
    badge?: string;
    confidence?: number;
  }[];
  suggestedFollowUps: string[];
}

export class ResponseSynthesizer {
  synthesize(
    query: string,
    intent: IntentClassification,
    aiResponse: string,
    expertAnswers: ExpertAnswer[],
    communityAnswers: CommunityAnswer[],
    previousQuery?: string
  ): SynthesizedResponse {
    const sources: SynthesizedResponse['sources'] = [];
    let answer = '';

    // Add context if this is a follow-up
    if (previousQuery) {
      answer += `Based on your earlier question about "${previousQuery}"...\n\n`;
    }

    // Priority: Expert > Verified Community > AI > General Community
    if (expertAnswers.length > 0) {
      const expert = expertAnswers[0];
      answer += `**Expert Insight:** ${expert.answer}\n\n`;
      sources.push({
        type: 'expert',
        name: expert.name,
        badge: '🏆 Expert'
      });
    }

    // Add AI response
    if (aiResponse) {
      answer += aiResponse;
      sources.push({
        type: 'ai',
        badge: '🤖 AI'
      });
    }

    // Add top verified community answers
    if (communityAnswers.length > 0) {
      const verifiedAnswers = communityAnswers.filter(a => a.type === 'verified' || a.helpful >= 3);
      if (verifiedAnswers.length > 0) {
        answer += `\n\n**From the Community:**\n`;
        verifiedAnswers.slice(0, 2).forEach((ans, idx) => {
          const trustBadge = this.getTrustBadge(ans.userTrustLevel);
          answer += `\n${idx + 1}. ${ans.content}\n   — ${trustBadge} • ${ans.helpful} people found this helpful\n`;
          sources.push({
            type: 'community',
            name: ans.userArea || 'Local',
            badge: trustBadge
          });
        });
      }
    }

    // Generate follow-up suggestions based on category
    const followUps = this.generateFollowUps(intent);
    answer += `\n\n**Quick follow-ups:**`;
    followUps.forEach(f => {
      answer += `\n• ${f}`;
    });

    return {
      answer,
      sources: sources.slice(0, 5),
      suggestedFollowUps: followUps
    };
  }

  private getTrustBadge(level: string): string {
    const badges: Record<string, string> = {
      new: '🟢 New',
      verified: '✅ Verified',
      trusted: '⭐ Trusted',
      expert: '🏆 Expert',
      guardian: '🛡️ Guardian',
      legend: '👑 Legend'
    };
    return badges[level] || '🟢 New';
  }

  private generateFollowUps(intent: IntentClassification): string[] {
    const { category, intentType } = intent;

    const followUps: Record<string, string[]> = {
      food_drink: [
        'Show me places with 4+ stars',
        'Find open restaurants now',
        'Best budget-friendly options',
        'Late-night food spots'
      ],
      safety: [
        'Show me well-lit areas',
        'Find safe routes',
        'Check crowd density',
        'Nearby police station'
      ],
      services: [
        'Show verified providers',
        'Find 24hr services',
        'Compare prices',
        'Read reviews'
      ],
      housing: [
        'Show PGs under ₹10K',
        'Find furnished rooms',
        'Family-friendly options',
        'Near metro/BTM'
      ],
      events: [
        'Free events today',
        'Networking meetups',
        'This weekend',
        'Near my location'
      ],
      health: [
        '24hr pharmacies',
        'Nearest hospital',
        'Book appointment',
        ' specialists nearby'
      ],
      transport: [
        'Current traffic',
        'Metro timing',
        'Bus routes',
        'Nearest metro'
      ],
      commerce: [
        'Best deals nearby',
        'Compare prices',
        'Read reviews',
        'Store locations'
      ],
      general: [
        'Trending near me',
        'What's popular',
        'Events today',
        'Ask about safety'
      ]
    };

    return followUps[category] || followUps.general;
  }

  // Synthesize multiple answers into a coherent response
  synthesizeMultiple(
    answers: string[],
    format: 'list' | 'summary' | 'comparison' = 'summary'
  ): string {
    if (answers.length === 0) {
      return 'No answers available.';
    }

    if (answers.length === 1) {
      return answers[0];
    }

    switch (format) {
      case 'list':
        return answers.map((a, i) => `${i + 1}. ${a}`).join('\n');

      case 'comparison':
        return `**Comparing options:**\n\n${answers.map(a => `- ${a}`).join('\n')}`;

      case 'summary':
      default:
        return `Based on multiple sources:\n\n${answers.slice(0, 3).map(a => `• ${a}`).join('\n')}`;
    }
  }
}
