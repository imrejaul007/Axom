/**
 * REZ Human Context Graph - Core Service
 *
 * Unified context aggregation from all 15 life layers
 */
import mongoose, { Document } from 'mongoose';
import type { LifeLayer, LayerContext, HumanContext, CosmicContext, CrossLayerInsight, LifeStageAssessment } from '../types/index.js';
export interface HumanContextDocument extends Document {
    userId: string;
    universalId: string;
    layers: Record<LifeLayer, LayerContext>;
    crossLayerInsights: CrossLayerInsight[];
    lifeStage: LifeStageAssessment;
    lastUpdated: Date;
}
export declare const HumanContextModel: mongoose.Model<HumanContextDocument, {}, {}, {}, mongoose.Document<unknown, {}, HumanContextDocument, {}, {}> & HumanContextDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export interface SignalDocument extends Document {
    userId: string;
    layer: LifeLayer;
    signal: string;
    value: unknown;
    source: string;
    confidence: number;
    timestamp: Date;
    metadata: Record<string, unknown>;
}
export declare const SignalModel: mongoose.Model<SignalDocument, {}, {}, {}, mongoose.Document<unknown, {}, SignalDocument, {}, {}> & SignalDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare function collectLayerSignal(userId: string, layer: LifeLayer, signal: string, value: unknown, source: string, confidence?: number, metadata?: Record<string, unknown>): Promise<void>;
export declare function aggregateHumanContext(userId: string, requestedLayers?: LifeLayer[]): Promise<HumanContext>;
export declare function generateCosmicContext(humanContext: HumanContext): Promise<CosmicContext>;
//# sourceMappingURL=contextGraphService.d.ts.map