/**
 * REZ Life Pattern Engine - Pattern Service
 * Core business logic for behavior pattern analysis and prediction
 */
import { BehaviorEvent, LifePattern, PatternPrediction, BehaviorSummary } from "../types.js";
/**
 * PatternService handles all pattern-related operations
 * Uses in-memory Map storage for development and small-scale deployments
 */
export declare class PatternService {
    /** In-memory storage for behavior events */
    private events;
    /** In-memory storage for patterns */
    private patterns;
    /** In-memory storage for predictions */
    private predictions;
    /**
     * Records a new behavior event
     * @param userId - The user ID
     * @param type - Event type
     * @param location - Optional location
     * @param context - Optional context data
     * @param metadata - Optional metadata
     * @returns The created behavior event
     */
    recordEvent(userId: string, type: string, location?: string, context?: Record<string, unknown>, metadata?: Record<string, unknown>): Promise<BehaviorEvent>;
    /**
     * Detects patterns from user's behavior events
     * @param userId - The user ID to analyze
     * @returns Array of detected patterns
     */
    detectPatterns(userId: string): Promise<LifePattern[]>;
    /**
     * Gets all patterns for a user
     * @param userId - The user ID
     * @returns Array of user's patterns
     */
    getPatterns(userId: string): Promise<LifePattern[]>;
    /**
     * Gets a specific pattern by ID
     * @param patternId - The pattern ID
     * @returns The pattern or null if not found
     */
    getPattern(patternId: string): Promise<LifePattern | null>;
    /**
     * Updates a pattern by re-evaluating its confidence
     * @param patternId - The pattern ID to update
     * @returns The updated pattern
     */
    updatePattern(patternId: string): Promise<LifePattern>;
    /**
     * Gets all predictions for a user
     * @param userId - The user ID
     * @returns Array of user's predictions
     */
    getPredictions(userId: string): Promise<PatternPrediction[]>;
    /**
     * Makes a prediction based on a pattern
     * @param userId - The user ID
     * @param patternId - The pattern ID to base prediction on
     * @param predictedFor - When the prediction is for
     * @param prediction - The predicted action
     * @returns The created prediction
     */
    makePrediction(userId: string, patternId: string, predictedFor: Date, prediction: string): Promise<PatternPrediction>;
    /**
     * Records the actual outcome for a prediction
     * @param predictionId - The prediction ID
     * @param actualOutcome - The actual outcome observed
     * @returns The updated prediction with accuracy
     */
    recordOutcome(predictionId: string, actualOutcome: string): Promise<PatternPrediction>;
    /**
     * Calculates prediction accuracy for a user
     * @param userId - The user ID
     * @returns Accuracy percentage (0-100)
     */
    getAccuracy(userId: string): Promise<number>;
    /**
     * Gets a summary of user behavior
     * @param userId - The user ID
     * @param days - Number of days to look back (default: 30)
     * @returns Behavior summary object
     */
    getBehaviorSummary(userId: string, days?: number): Promise<BehaviorSummary>;
    /**
     * Gets all events for a user
     * @param userId - The user ID
     * @returns Array of user's events
     */
    private getUserEvents;
    /**
     * Groups events by type
     * @param events - Array of events
     * @returns Events grouped by type
     */
    private groupEventsByType;
    /**
     * Analyzes event sequence to detect patterns
     * @param events - Events of the same type
     * @param eventType - The event type
     * @returns Detected pattern or null
     */
    private analyzeEventSequence;
    /**
     * Determines pattern type based on average interval
     * @param avgInterval - Average interval in milliseconds
     * @returns Pattern type
     */
    private determinePatternType;
    /**
     * Calculates average time of day for events
     * @param events - Sorted events
     * @returns Average hour (0-23)
     */
    private calculateAverageTime;
    /**
     * Extracts context from events (most common location)
     * @param events - Events to analyze
     * @returns Context object
     */
    private extractContext;
    /**
     * Calculates confidence score
     * @param dataPoints - Number of data points
     * @param occurrences - Number of occurrences
     * @returns Confidence score (0-1)
     */
    private calculateConfidence;
    /**
     * Describes frequency in human-readable format
     * @param interval - Interval in milliseconds
     * @returns Human-readable frequency description
     */
    private describeFrequency;
    /**
     * Filters recent events of a specific type
     * @param events - Events to filter
     * @param type - Pattern type
     * @param since - Filter events after this date
     * @returns Filtered events
     */
    private filterRecentEvents;
    /**
     * Calculates partial match score between two strings
     * @param predicted - Predicted string
     * @param actual - Actual string
     * @returns Match score (0-1)
     */
    private calculatePartialMatch;
}
/** Default singleton instance */
export declare const patternService: PatternService;
//# sourceMappingURL=patternService.d.ts.map