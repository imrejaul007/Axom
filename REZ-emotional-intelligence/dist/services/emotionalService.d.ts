/**
 * REZ Emotional Intelligence - Core Service
 *
 * Handles mood tracking, sentiment analysis, wellness scoring
 */
import mongoose, { Document } from 'mongoose';
import type { MoodEntry, MoodState, EmotionType, MoodTrend, MoodPattern, WellnessScore, WellnessDimensions, SentimentAnalysis, EmotionalSignals, EmotionalContext, CosmicMoodOutput } from '../types/index.js';
export interface MoodEntryDocument extends Document {
    userId: string;
    timestamp: Date;
    mood: MoodState;
    primaryEmotion: EmotionType;
    secondaryEmotions: EmotionType[];
    intensity: number;
    energy: number;
    arousal: number;
    triggers: string[];
    notes?: string;
    location?: {
        lat: number;
        lng: number;
        place?: string;
    };
    context?: {
        activity?: string;
        weather?: string;
        social?: boolean;
        timeOfDay?: string;
    };
}
export declare const MoodEntryModel: mongoose.Model<MoodEntryDocument, {}, {}, {}, mongoose.Document<unknown, {}, MoodEntryDocument, {}, {}> & MoodEntryDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface WellnessDocument extends Document {
    userId: string;
    date: Date;
    scores: WellnessScore;
    dimensions: WellnessDimensions;
    riskFactors: string[];
    protectiveFactors: string[];
    lastUpdated: Date;
}
export declare const WellnessModel: mongoose.Model<WellnessDocument, {}, {}, {}, mongoose.Document<unknown, {}, WellnessDocument, {}, {}> & WellnessDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface EmotionalSignalDocument extends Document {
    userId: string;
    timestamp: Date;
    signals: EmotionalSignals;
}
export declare const EmotionalSignalModel: mongoose.Model<EmotionalSignalDocument, {}, {}, {}, mongoose.Document<unknown, {}, EmotionalSignalDocument, {}, {}> & EmotionalSignalDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare function analyzeSentiment(text: string): SentimentAnalysis;
type MoodEntryData = MoodEntryDocument | MoodEntry;
export declare function calculateMoodScore(mood: MoodState): number;
export declare function detectMoodFromSignals(signals: EmotionalSignals): MoodState;
export declare function calculateWellnessScore(moodHistory: MoodEntryData[], signals: EmotionalSignals): WellnessScore;
export declare function calculateMoodTrend(recentEntries: MoodEntryData[], olderEntries: MoodEntryData[]): MoodTrend;
export declare function generateCosmicInterpretation(mood: MoodState, energy: number, trend: MoodTrend): CosmicMoodOutput;
export declare function analyzeMoodPatterns(entries: MoodEntryDocument[]): MoodPattern;
export declare function getEmotionalContext(userId: string, includeCosmic?: boolean): Promise<{
    context: EmotionalContext;
    cosmicOutput?: CosmicMoodOutput;
}>;
export {};
//# sourceMappingURL=emotionalService.d.ts.map