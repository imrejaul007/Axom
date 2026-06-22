import { v4 as uuidv4 } from 'uuid';
import {
  ContentAnalysisResult,
  ModerationResult,
  SentimentResult,
  SpamResult,
  ToxicityResult,
} from '../types/index.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

// Simulated AI analysis - In production, this would connect to HOJAI AI services
export class AIAnalysisService {
  private toxicityKeywords = [
    'hate', 'kill', 'attack', 'violent', 'abuse', 'harass', 'threat',
    'spam', 'scam', 'fake', 'fraud', 'click here', 'free money',
  ];

  private spamPatterns = [
    /http[s]?:\/\/[^\s]+/gi, // URLs
    /[A-Z]{10,}/g, // ALL CAPS
    /\b(buy|cheap|offer|discount|winner|congratulations)\b/gi,
    /[!?]{3,}/g, // Multiple exclamation marks
    /(.)\1{4,}/g, // Repeated characters
  ];

  private negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'angry',
    'sad', 'disappointed', 'frustrated', 'annoyed', 'upset',
  ];

  private positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'happy',
    'joy', 'excited', 'fantastic', 'awesome', 'beautiful',
  ];

  async analyzeContent(
    contentId: string,
    userId: string,
    text: string,
    context?: 'post' | 'comment' | 'message' | 'profile'
  ): Promise<ContentAnalysisResult> {
    logger.info('Analyzing content', { contentId, userId, context });

    const [moderation, sentiment, spam, toxicity] = await Promise.all([
      this.analyzeModeration(text),
      this.analyzeSentiment(text),
      this.analyzeSpam(text),
      this.analyzeToxicity(text),
    ]);

    const flagged = !moderation.passed || spam.isSpam || toxicity.isToxic;

    return {
      contentId,
      userId,
      moderation,
      sentiment,
      spam,
      toxicity,
      flagged,
      createdAt: new Date(),
    };
  }

  async analyzeModeration(text: string): Promise<ModerationResult> {
    const categories: ModerationResult['categories'] = [];
    let highestConfidence = 0;
    let action: 'allow' | 'warn' | 'block' = 'allow';

    // Check for prohibited content patterns
    const prohibitedPatterns = [
      { name: 'violence', pattern: /\b(kill|murder|attack|harm|destroy)\b/gi },
      { name: 'adult', pattern: /\b(adult|nsfw|explicit)\b/gi },
      { name: 'hate_speech', pattern: /\b(hate|racist|sexist|discriminat)\b/gi },
      { name: 'harassment', pattern: /\b(harass|stalk|bully|intimidat)\b/gi },
    ];

    for (const { name, pattern } of prohibitedPatterns) {
      const matches = text.match(pattern);
      const confidence = matches ? Math.min(matches.length * 0.3, 1) : 0;
      categories.push({ category: name, confidence, matched: confidence > 0.5 });

      if (confidence > highestConfidence) {
        highestConfidence = confidence;
      }
    }

    if (highestConfidence > 0.8) {
      action = 'block';
    } else if (highestConfidence > 0.5) {
      action = 'warn';
    }

    return {
      passed: action === 'allow',
      categories,
      confidence: highestConfidence,
      action,
    };
  }

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;

    for (const word of words) {
      if (this.positiveWords.includes(word)) positiveScore++;
      if (this.negativeWords.includes(word)) negativeScore++;
    }

    const total = words.length || 1;
    const sentimentScore = (positiveScore - negativeScore) / total;
    const normalizedScore = Math.max(-1, Math.min(1, sentimentScore * 2));

    let label: 'positive' | 'negative' | 'neutral';
    if (normalizedScore > config.ai.sentimentThreshold) {
      label = 'positive';
    } else if (normalizedScore < -config.ai.sentimentThreshold) {
      label = 'negative';
    } else {
      label = 'neutral';
    }

    // Basic emotion detection
    const emotions = {
      joy: normalizedScore > 0 ? Math.abs(normalizedScore) * 0.8 : 0,
      anger: text.match(/angry|rage|hate|kill/gi) ? 0.7 : 0,
      sadness: text.match(/sad|depressed|cry|unhappy/gi) ? 0.6 : 0,
      fear: text.match(/afraid|scared|terrified/gi) ? 0.5 : 0,
      surprise: text.match(/wow|amazing|shocked/gi) ? 0.4 : 0,
    };

    return {
      score: normalizedScore,
      label,
      confidence: Math.min(0.5 + Math.abs(normalizedScore) * 0.5, 1),
      emotions,
    };
  }

  async analyzeSpam(text: string): Promise<SpamResult> {
    const reasons: string[] = [];
    let spamScore = 0;

    // Check spam patterns
    for (const pattern of this.spamPatterns) {
      if (pattern.test(text)) {
        reasons.push(`Matched spam pattern: ${pattern.toString()}`);
        spamScore += 0.3;
      }
    }

    // Check for excessive caps
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.5 && text.length > 20) {
      reasons.push('Excessive capitalization');
      spamScore += 0.2;
    }

    // Check for repeated content
    const words = text.split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    if (uniqueWords.size / words.length < 0.3 && words.length > 10) {
      reasons.push('High repetition detected');
      spamScore += 0.3;
    }

    // Check for suspicious keywords
    const suspiciousKeywords = this.toxicityKeywords;
    for (const keyword of suspiciousKeywords) {
      if (text.toLowerCase().includes(keyword)) {
        reasons.push(`Suspicious keyword: ${keyword}`);
        spamScore += 0.2;
      }
    }

    const normalizedScore = Math.min(spamScore, 1);

    return {
      isSpam: normalizedScore > config.ai.spamThreshold,
      score: normalizedScore,
      reasons,
      confidence: Math.min(0.5 + normalizedScore * 0.5, 1),
    };
  }

  async analyzeToxicity(text: string): Promise<ToxicityResult> {
    const categories: ToxicityResult['categories'] = [];
    let maxScore = 0;

    const toxicityPatterns = [
      { type: 'severe_toxic', pattern: /\b(kill|die|death|violent)\b/gi },
      { type: 'obscene', pattern: /\b(shit|damn|hell|crap)\b/gi },
      { type: 'threat', pattern: /\b(threat|warn|caution|danger)\b/gi },
      { type: 'insult', pattern: /\b(stupid|idiot|dumb|loser)\b/gi },
      { type: 'identity_attack', pattern: /\b(racist|sexist|homophobic)\b/gi },
    ];

    for (const { type, pattern } of toxicityPatterns) {
      const matches = text.match(pattern);
      const score = matches ? Math.min(matches.length * 0.4, 1) : 0;
      categories.push({ type, score });

      if (score > maxScore) {
        maxScore = score;
      }
    }

    return {
      isToxic: maxScore > config.ai.toxicityThreshold,
      score: maxScore,
      categories,
      confidence: Math.min(0.5 + maxScore * 0.5, 1),
    };
  }

  async batchAnalyze(
    items: Array<{ contentId: string; userId: string; text: string; context?: string }>
  ): Promise<ContentAnalysisResult[]> {
    logger.info('Starting batch analysis', { count: items.length });

    const results = await Promise.all(
      items.map(item =>
        this.analyzeContent(
          item.contentId,
          item.userId,
          item.text,
          item.context as 'post' | 'comment' | 'message' | 'profile'
        )
      )
    );

    return results;
  }
}

export const aiAnalysisService = new AIAnalysisService();
