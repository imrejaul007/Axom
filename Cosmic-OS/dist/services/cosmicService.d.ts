/**
 * Cosmic OS - Core Service
 *
 * AI Council of Agents, cosmic interpretation, spiritual abstraction
 */
import type { CosmicInput, CosmicContext, CosmicState, CouncilResponse, DailyCosmicReading, DomainGuidance, MoodCheckIn, MoodResponse, AgentType, LifeDomain } from '../types/index.js';
export declare function interpretMoodToCosmicState(mood: string, energy: number): CosmicState;
export declare function generateCouncilResponse(cosmicState: CosmicState, input: CosmicInput, activeAgents?: AgentType[]): CouncilResponse;
export declare function generateDailyReading(state: CosmicState, userId: string): DailyCosmicReading;
export declare function getDomainGuidance(domain: LifeDomain, state: CosmicState, input: CosmicInput): DomainGuidance;
export declare function processMoodCheckIn(checkIn: MoodCheckIn): MoodResponse;
export declare function generateCosmicContext(userId: string): Promise<CosmicContext>;
//# sourceMappingURL=cosmicService.d.ts.map