/**
 * REZ Life Pattern Engine - Core Service
 *
 * Daily/weekly/seasonal patterns, routine detection, life events
 */
import mongoose, { Document } from 'mongoose';
import type { RoutinePattern, LifeEvent, LifeStageAnalysis, TimePattern, LifestyleProfile, ConsumptionPattern, CyclicalPatterns, PredictedRoutine } from '../types/index.js';
export interface RoutineDocument extends Omit<RoutinePattern, 'id'>, Document {
}
export declare const RoutineModel: mongoose.Model<RoutineDocument, {}, {}, {}, mongoose.Document<unknown, {}, RoutineDocument, {}, {}> & RoutineDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface LifeEventDocument extends Omit<LifeEvent, 'id'>, Document {
}
export declare const LifeEventModel: mongoose.Model<LifeEventDocument, {}, {}, {}, mongoose.Document<unknown, {}, LifeEventDocument, {}, {}> & LifeEventDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface ActivityDocument extends Document {
    userId: string;
    activity: string;
    timestamp: Date;
    duration?: number;
    location?: {
        lat: number;
        lng: number;
        name?: string;
    };
    metadata?: Record<string, unknown>;
}
export declare const ActivityModel: mongoose.Model<ActivityDocument, {}, {}, {}, mongoose.Document<unknown, {}, ActivityDocument, {}, {}> & ActivityDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare function detectRoutines(userId: string, events: any[]): Promise<RoutinePattern[]>;
export declare function analyzeTimePattern(events: any[]): TimePattern;
export declare function analyzeLifestyleProfile(events: any[]): LifestyleProfile;
export declare function analyzeConsumptionPattern(events: any[]): ConsumptionPattern;
export declare function analyzeRhythms(events: any[]): CyclicalPatterns;
export declare function detectLifeStage(events: any[]): LifeStageAnalysis;
export declare function predictNext24hRoutines(userId: string, timePattern: TimePattern, routines: RoutinePattern[]): PredictedRoutine[];
export declare function detectLifeEvents(signals: any[]): Partial<LifeEvent>[];
export declare function generateLifePatternContext(userId: string, events: any[], includePredictions?: boolean): Promise<{
    userId: string;
    timestamp: Date;
    currentRoutine: RoutinePattern[];
    lifestyle: LifestyleProfile;
    consumption: ConsumptionPattern;
    timePattern: TimePattern;
    rhythms: CyclicalPatterns;
    lifeStage: LifeStageAnalysis;
    recentEvents: (mongoose.Document<unknown, {}, LifeEventDocument, {}, {}> & LifeEventDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[];
    upcomingPredictions: any[];
    next24h: PredictedRoutine[];
    routineConsistency: number;
    insights: {
        routineGaps: string[];
        optimizationSuggestions: string[];
        upcomingChanges: string[];
    };
}>;
//# sourceMappingURL=lifePatternService.d.ts.map