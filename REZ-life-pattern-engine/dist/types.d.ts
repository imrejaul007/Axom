/**
 * REZ Life Pattern Engine - Type Definitions
 * Defines core types for behavior pattern analysis and prediction
 */
import { z } from "zod";
/**
 * Enumeration of pattern types based on temporal and contextual characteristics
 */
export declare enum PatternType {
    /** Patterns that occur every day */
    DAILY = "DAILY",
    /** Weekly recurring patterns */
    WEEKLY = "WEEKLY",
    /** Monthly patterns */
    MONTHLY = "MONTHLY",
    /** Seasonal patterns */
    SEASONAL = "SEASONAL",
    /** Patterns based on context triggers */
    CONTEXTUAL = "CONTEXTUAL",
    /** Complex behavioral patterns */
    BEHAVIORAL = "BEHAVIORAL",
    /** Social interaction patterns */
    SOCIAL = "SOCIAL"
}
/**
 * Status of a detected pattern indicating its current state
 */
export declare enum PatternStatus {
    /** Pattern is being detected and validated */
    DETECTING = "DETECTING",
    /** Pattern is confirmed with high confidence */
    CONFIRMED = "CONFIRMED",
    /** Pattern is weakening over time */
    WEAKENING = "WEAKENING",
    /** Pattern no longer exists */
    DISSOLVED = "DISSOLVED"
}
/**
 * Core entity representing a detected life pattern
 */
export interface LifePattern {
    /** Unique identifier for the pattern */
    id: string;
    /** User ID this pattern belongs to */
    userId: string;
    /** Type of pattern */
    type: PatternType;
    /** Human-readable name for the pattern */
    name: string;
    /** Detailed description of the pattern */
    description: string;
    /** Confidence score (0-1) */
    confidence: number;
    /** Number of data points supporting this pattern */
    dataPoints: number;
    /** Total number of occurrences */
    occurrences: number;
    /** Frequency in milliseconds (e.g., 86400000 for daily) */
    frequency: number;
    /** Average time of occurrence (hour of day, 0-23) */
    avgTime: number;
    /** Contextual factors associated with this pattern */
    context: Record<string, unknown>;
    /** Current status of the pattern */
    status: PatternStatus;
    /** When the pattern was first detected */
    detectedAt: Date;
    /** When the pattern was last observed */
    lastObserved: Date;
}
/**
 * Represents a prediction made based on a pattern
 */
export interface PatternPrediction {
    /** Unique identifier for the prediction */
    id: string;
    /** Associated pattern ID */
    patternId: string;
    /** User ID this prediction belongs to */
    userId: string;
    /** When the prediction was made */
    predictedAt: Date;
    /** When the prediction is for */
    predictedFor: Date;
    /** The predicted action or behavior */
    prediction: string;
    /** Confidence score for the prediction */
    confidence: number;
    /** Factors influencing this prediction */
    factors: string[];
    /** Actual outcome once observed (optional) */
    actualOutcome?: string;
    /** Accuracy of the prediction (0-1) */
    accuracy?: number;
}
/**
 * Represents a single behavior event
 */
export interface BehaviorEvent {
    /** Unique identifier for the event */
    id: string;
    /** User ID this event belongs to */
    userId: string;
    /** Type of event */
    type: string;
    /** When the event occurred */
    timestamp: Date;
    /** Location of the event */
    location?: string;
    /** Contextual information */
    context?: Record<string, unknown>;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Summary statistics for user behavior
 */
export interface BehaviorSummary {
    /** Total number of events recorded */
    totalEvents: number;
    /** Number of patterns detected */
    patternsFound: number;
    /** Most common times of activity */
    topTimes: Array<{
        hour: number;
        count: number;
    }>;
    /** Most common locations */
    topLocations: Array<{
        location: string;
        count: number;
    }>;
}
/**
 * Zod schema for recording a behavior event
 */
export declare const RecordEventSchema: z.ZodObject<{
    userId: z.ZodString;
    type: z.ZodString;
    location: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    type: string;
    userId: string;
    location?: string | undefined;
    context?: Record<string, unknown> | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    type: string;
    userId: string;
    location?: string | undefined;
    context?: Record<string, unknown> | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * Type for validated record event request
 */
export type RecordEventInput = z.infer<typeof RecordEventSchema>;
/**
 * Zod schema for making a prediction
 */
export declare const MakePredictionSchema: z.ZodObject<{
    userId: z.ZodString;
    patternId: z.ZodString;
    predictedFor: z.ZodString;
    prediction: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    patternId: string;
    predictedFor: string;
    prediction: string;
}, {
    userId: string;
    patternId: string;
    predictedFor: string;
    prediction: string;
}>;
/**
 * Type for validated prediction request
 */
export type MakePredictionInput = z.infer<typeof MakePredictionSchema>;
/**
 * Zod schema for recording an outcome
 */
export declare const RecordOutcomeSchema: z.ZodObject<{
    predictionId: z.ZodString;
    actualOutcome: z.ZodString;
}, "strip", z.ZodTypeAny, {
    predictionId: string;
    actualOutcome: string;
}, {
    predictionId: string;
    actualOutcome: string;
}>;
/**
 * Type for validated outcome request
 */
export type RecordOutcomeInput = z.infer<typeof RecordOutcomeSchema>;
/**
 * Zod schema for updating a pattern
 */
export declare const UpdatePatternSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    context?: Record<string, unknown> | undefined;
    name?: string | undefined;
    description?: string | undefined;
}, {
    context?: Record<string, unknown> | undefined;
    name?: string | undefined;
    description?: string | undefined;
}>;
/**
 * Type for validated pattern update request
 */
export type UpdatePatternInput = z.infer<typeof UpdatePatternSchema>;
//# sourceMappingURL=types.d.ts.map