/**
 * REZ Life Pattern Engine - Pattern Service
 * Core business logic for behavior pattern analysis and prediction
 */

import { v4 as uuidv4 } from "uuid";
import {
  BehaviorEvent,
  LifePattern,
  PatternPrediction,
  PatternStatus,
  PatternType,
  BehaviorSummary,
} from "../types.js";

/**
 * Time constants for pattern frequency calculations
 */
const MS_PER_DAY = 86400000;
const MS_PER_WEEK = 7 * MS_PER_DAY;
const MS_PER_MONTH = 30 * MS_PER_DAY;

/**
 * Minimum data points required to confirm a pattern
 */
const MIN_DATA_POINTS_FOR_CONFIRMATION = 3;

/**
 * Confidence thresholds for pattern status
 */
const CONFIDENCE_THRESHOLDS = {
  DETECTING: 0.3,
  CONFIRMED: 0.7,
  WEAKENING: 0.4,
};

/**
 * PatternService handles all pattern-related operations
 * Uses in-memory Map storage for development and small-scale deployments
 */
export class PatternService {
  /** In-memory storage for behavior events */
  private events: Map<string, BehaviorEvent> = new Map();

  /** In-memory storage for patterns */
  private patterns: Map<string, LifePattern> = new Map();

  /** In-memory storage for predictions */
  private predictions: Map<string, PatternPrediction> = new Map();

  /**
   * Records a new behavior event
   * @param userId - The user ID
   * @param type - Event type
   * @param location - Optional location
   * @param context - Optional context data
   * @param metadata - Optional metadata
   * @returns The created behavior event
   */
  async recordEvent(
    userId: string,
    type: string,
    location?: string,
    context?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<BehaviorEvent> {
    const event: BehaviorEvent = {
      id: uuidv4(),
      userId,
      type,
      timestamp: new Date(),
      location,
      context,
      metadata,
    };

    this.events.set(event.id, event);
    return event;
  }

  /**
   * Detects patterns from user's behavior events
   * @param userId - The user ID to analyze
   * @returns Array of detected patterns
   */
  async detectPatterns(userId: string): Promise<LifePattern[]> {
    const userEvents = this.getUserEvents(userId);
    const detectedPatterns: LifePattern[] = [];

    // Group events by type
    const eventsByType = this.groupEventsByType(userEvents);

    for (const [eventType, events] of Object.entries(eventsByType)) {
      if (events.length >= MIN_DATA_POINTS_FOR_CONFIRMATION) {
        const pattern = this.analyzeEventSequence(events, eventType);
        if (pattern) {
          this.patterns.set(pattern.id, pattern);
          detectedPatterns.push(pattern);
        }
      }
    }

    return detectedPatterns;
  }

  /**
   * Gets all patterns for a user
   * @param userId - The user ID
   * @returns Array of user's patterns
   */
  async getPatterns(userId: string): Promise<LifePattern[]> {
    return Array.from(this.patterns.values()).filter(
      (p) => p.userId === userId
    );
  }

  /**
   * Gets a specific pattern by ID
   * @param patternId - The pattern ID
   * @returns The pattern or null if not found
   */
  async getPattern(patternId: string): Promise<LifePattern | null> {
    return this.patterns.get(patternId) ?? null;
  }

  /**
   * Updates a pattern by re-evaluating its confidence
   * @param patternId - The pattern ID to update
   * @returns The updated pattern
   */
  async updatePattern(patternId: string): Promise<LifePattern> {
    const pattern = this.patterns.get(patternId);
    if (!pattern) {
      throw new Error(`Pattern not found: ${patternId}`);
    }

    const userEvents = this.getUserEvents(pattern.userId);
    const recentEvents = this.filterRecentEvents(
      userEvents,
      pattern.type,
      pattern.lastObserved
    );

    // Recalculate confidence based on recent data
    const newDataPoints = recentEvents.length;
    const newConfidence = this.calculateConfidence(
      newDataPoints,
      pattern.occurrences
    );

    // Update status based on new confidence
    let newStatus = pattern.status;
    if (newConfidence >= CONFIDENCE_THRESHOLDS.CONFIRMED) {
      newStatus = PatternStatus.CONFIRMED;
    } else if (newConfidence >= CONFIDENCE_THRESHOLDS.WEAKENING) {
      newStatus = PatternStatus.WEAKENING;
    } else {
      newStatus = PatternStatus.DETECTING;
    }

    // Check if pattern has dissolved
    const daysSinceLastObserved = Math.floor(
      (Date.now() - pattern.lastObserved.getTime()) / MS_PER_DAY
    );
    if (daysSinceLastObserved > 30) {
      newStatus = PatternStatus.DISSOLVED;
    }

    const updatedPattern: LifePattern = {
      ...pattern,
      dataPoints: newDataPoints,
      confidence: newConfidence,
      status: newStatus,
      lastObserved: recentEvents[0]?.timestamp ?? pattern.lastObserved,
    };

    this.patterns.set(patternId, updatedPattern);
    return updatedPattern;
  }

  /**
   * Gets all predictions for a user
   * @param userId - The user ID
   * @returns Array of user's predictions
   */
  async getPredictions(userId: string): Promise<PatternPrediction[]> {
    return Array.from(this.predictions.values()).filter(
      (p) => p.userId === userId
    );
  }

  /**
   * Makes a prediction based on a pattern
   * @param userId - The user ID
   * @param patternId - The pattern ID to base prediction on
   * @param predictedFor - When the prediction is for
   * @param prediction - The predicted action
   * @returns The created prediction
   */
  async makePrediction(
    userId: string,
    patternId: string,
    predictedFor: Date,
    prediction: string
  ): Promise<PatternPrediction> {
    const pattern = this.patterns.get(patternId);
    if (!pattern) {
      throw new Error(`Pattern not found: ${patternId}`);
    }

    const factors: string[] = [
      `Based on ${pattern.type} pattern`,
      `Confidence: ${(pattern.confidence * 100).toFixed(1)}%`,
      `Occurrences: ${pattern.occurrences}`,
    ];

    if (pattern.context && Object.keys(pattern.context).length > 0) {
      factors.push(`Context: ${JSON.stringify(pattern.context)}`);
    }

    const pred: PatternPrediction = {
      id: uuidv4(),
      patternId,
      userId,
      predictedAt: new Date(),
      predictedFor,
      prediction,
      confidence: pattern.confidence,
      factors,
    };

    this.predictions.set(pred.id, pred);
    return pred;
  }

  /**
   * Records the actual outcome for a prediction
   * @param predictionId - The prediction ID
   * @param actualOutcome - The actual outcome observed
   * @returns The updated prediction with accuracy
   */
  async recordOutcome(
    predictionId: string,
    actualOutcome: string
  ): Promise<PatternPrediction> {
    const prediction = this.predictions.get(predictionId);
    if (!prediction) {
      throw new Error(`Prediction not found: ${predictionId}`);
    }

    // Calculate accuracy (simple match for now)
    const predicted = prediction.prediction.toLowerCase().trim();
    const actual = actualOutcome.toLowerCase().trim();
    const accuracy = predicted === actual ? 1.0 : this.calculatePartialMatch(predicted, actual);

    const updatedPrediction: PatternPrediction = {
      ...prediction,
      actualOutcome,
      accuracy,
    };

    this.predictions.set(predictionId, updatedPrediction);
    return updatedPrediction;
  }

  /**
   * Calculates prediction accuracy for a user
   * @param userId - The user ID
   * @returns Accuracy percentage (0-100)
   */
  async getAccuracy(userId: string): Promise<number> {
    const userPredictions = await this.getPredictions(userId);
    const completedPredictions = userPredictions.filter(
      (p) => p.accuracy !== undefined
    );

    if (completedPredictions.length === 0) {
      return 0;
    }

    const totalAccuracy = completedPredictions.reduce(
      (sum, p) => sum + (p.accuracy ?? 0),
      0
    );

    return (totalAccuracy / completedPredictions.length) * 100;
  }

  /**
   * Gets a summary of user behavior
   * @param userId - The user ID
   * @param days - Number of days to look back (default: 30)
   * @returns Behavior summary object
   */
  async getBehaviorSummary(
    userId: string,
    days: number = 30
  ): Promise<BehaviorSummary> {
    const cutoffDate = new Date(Date.now() - days * MS_PER_DAY);
    const userEvents = this.getUserEvents(userId).filter(
      (e) => e.timestamp >= cutoffDate
    );

    const patterns = await this.getPatterns(userId);

    // Calculate top times
    const timeCounts = new Map<number, number>();
    for (const event of userEvents) {
      const hour = event.timestamp.getHours();
      timeCounts.set(hour, (timeCounts.get(hour) ?? 0) + 1);
    }
    const topTimes = Array.from(timeCounts.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate top locations
    const locationCounts = new Map<string, number>();
    for (const event of userEvents) {
      if (event.location) {
        locationCounts.set(
          event.location,
          (locationCounts.get(event.location) ?? 0) + 1
        );
      }
    }
    const topLocations = Array.from(locationCounts.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalEvents: userEvents.length,
      patternsFound: patterns.length,
      topTimes,
      topLocations,
    };
  }

  /**
   * Gets all events for a user
   * @param userId - The user ID
   * @returns Array of user's events
   */
  private getUserEvents(userId: string): BehaviorEvent[] {
    return Array.from(this.events.values()).filter(
      (e) => e.userId === userId
    );
  }

  /**
   * Groups events by type
   * @param events - Array of events
   * @returns Events grouped by type
   */
  private groupEventsByType(
    events: BehaviorEvent[]
  ): Record<string, BehaviorEvent[]> {
    return events.reduce(
      (acc, event) => {
        if (!acc[event.type]) {
          acc[event.type] = [];
        }
        acc[event.type]!.push(event);
        return acc;
      },
      {} as Record<string, BehaviorEvent[]>
    );
  }

  /**
   * Analyzes event sequence to detect patterns
   * @param events - Events of the same type
   * @param eventType - The event type
   * @returns Detected pattern or null
   */
  private analyzeEventSequence(
    events: BehaviorEvent[],
    eventType: string
  ): LifePattern | null {
    // Sort by timestamp
    const sortedEvents = [...events].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    if (sortedEvents.length < MIN_DATA_POINTS_FOR_CONFIRMATION) {
      return null;
    }

    // Calculate intervals between events
    const intervals: number[] = [];
    for (let i = 1; i < sortedEvents.length; i++) {
      intervals.push(
        sortedEvents[i]!.timestamp.getTime() -
          sortedEvents[i - 1]!.timestamp.getTime()
      );
    }

    // Determine pattern type based on intervals
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const patternType = this.determinePatternType(avgInterval);

    // Calculate average time of day
    const avgTime = this.calculateAverageTime(sortedEvents);

    // Determine context (most common location)
    const context = this.extractContext(sortedEvents);

    // Calculate confidence
    const confidence = this.calculateConfidence(
      sortedEvents.length,
      sortedEvents.length
    );

    // Determine status
    let status = PatternStatus.DETECTING;
    if (confidence >= CONFIDENCE_THRESHOLDS.CONFIRMED) {
      status = PatternStatus.CONFIRMED;
    }

    return {
      id: uuidv4(),
      userId: sortedEvents[0]!.userId,
      type: patternType,
      name: `${eventType} ${patternType.toLowerCase()} pattern`,
      description: `Detected ${eventType} pattern occurring ${this.describeFrequency(avgInterval)}`,
      confidence,
      dataPoints: sortedEvents.length,
      occurrences: sortedEvents.length,
      frequency: avgInterval,
      avgTime,
      context,
      status,
      detectedAt: sortedEvents[0]!.timestamp,
      lastObserved: sortedEvents[sortedEvents.length - 1]!.timestamp,
    };
  }

  /**
   * Determines pattern type based on average interval
   * @param avgInterval - Average interval in milliseconds
   * @returns Pattern type
   */
  private determinePatternType(avgInterval: number): PatternType {
    if (avgInterval <= MS_PER_DAY * 1.5) {
      return PatternType.DAILY;
    }
    if (avgInterval <= MS_PER_WEEK * 1.5) {
      return PatternType.WEEKLY;
    }
    if (avgInterval <= MS_PER_MONTH * 1.5) {
      return PatternType.MONTHLY;
    }
    return PatternType.SEASONAL;
  }

  /**
   * Calculates average time of day for events
   * @param events - Sorted events
   * @returns Average hour (0-23)
   */
  private calculateAverageTime(events: BehaviorEvent[]): number {
    const totalHour = events.reduce(
      (sum, e) => sum + e.timestamp.getHours(),
      0
    );
    return Math.round(totalHour / events.length);
  }

  /**
   * Extracts context from events (most common location)
   * @param events - Events to analyze
   * @returns Context object
   */
  private extractContext(events: BehaviorEvent[]): Record<string, unknown> {
    const locationCounts = new Map<string, number>();
    for (const event of events) {
      if (event.location) {
        locationCounts.set(
          event.location,
          (locationCounts.get(event.location) ?? 0) + 1
        );
      }
    }

    let mostCommonLocation: string | undefined;
    let maxCount = 0;
    for (const [location, count] of locationCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonLocation = location;
      }
    }

    return {
      primaryLocation: mostCommonLocation,
      locationVariety: locationCounts.size,
    };
  }

  /**
   * Calculates confidence score
   * @param dataPoints - Number of data points
   * @param occurrences - Number of occurrences
   * @returns Confidence score (0-1)
   */
  private calculateConfidence(dataPoints: number, occurrences: number): number {
    // Simple confidence calculation
    const baseConfidence = Math.min(dataPoints / 10, 1);
    const occurrenceBonus = Math.min(occurrences / 20, 0.2);
    return Math.min(baseConfidence + occurrenceBonus, 1);
  }

  /**
   * Describes frequency in human-readable format
   * @param interval - Interval in milliseconds
   * @returns Human-readable frequency description
   */
  private describeFrequency(interval: number): string {
    if (interval <= MS_PER_DAY * 1.5) {
      return "daily";
    }
    if (interval <= MS_PER_WEEK * 1.5) {
      return "weekly";
    }
    if (interval <= MS_PER_MONTH * 1.5) {
      return "monthly";
    }
    return "seasonally";
  }

  /**
   * Filters recent events of a specific type
   * @param events - Events to filter
   * @param type - Pattern type
   * @param since - Filter events after this date
   * @returns Filtered events
   */
  private filterRecentEvents(
    events: BehaviorEvent[],
    type: PatternType,
    since: Date
  ): BehaviorEvent[] {
    return events.filter((e) => e.timestamp >= since);
  }

  /**
   * Calculates partial match score between two strings
   * @param predicted - Predicted string
   * @param actual - Actual string
   * @returns Match score (0-1)
   */
  private calculatePartialMatch(predicted: string, actual: string): number {
    if (predicted.length === 0 || actual.length === 0) {
      return 0;
    }

    // Normalize strings: replace underscores with spaces and lowercase
    const normalizeText = (s: string): string => s.replace(/_/g, " ").toLowerCase();

    const normalizedPredicted = normalizeText(predicted);
    const normalizedActual = normalizeText(actual);

    // Simple word overlap calculation
    const predictedWords = new Set(normalizedPredicted.split(/\s+/).filter(w => w.length > 0));
    const actualWords = new Set(normalizedActual.split(/\s+/).filter(w => w.length > 0));

    let matches = 0;
    for (const word of predictedWords) {
      if (actualWords.has(word)) {
        matches++;
      }
    }

    const unionSize = Math.max(predictedWords.size, actualWords.size);
    if (unionSize === 0) return 0;

    return matches / unionSize;
  }
}

/** Default singleton instance */
export const patternService = new PatternService();
