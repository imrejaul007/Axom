/**
 * REZ Life Story Engine - Core Service
 *
 * Narrative Intelligence - Turning data into meaningful stories
 * Port: 4167
 */
import { StoryArc, StoryChapter, NarrativeInsight, StoryResonance, PersonalMythology, TimelineNarrative, DailyNarrative } from '../types/index.js';
export declare class LifeStoryService {
    /**
     * Generate a daily narrative
     */
    generateDailyNarrative(context: {
        userId: string;
        currentPhase: string;
        recentThemes: string[];
        emotionalState: string;
        momentum: 'ascending' | 'descending' | 'stable' | 'transforming';
        season?: 'spring' | 'summer' | 'autumn' | 'winter';
    }): DailyNarrative;
    /**
     * Identify the current story arc
     */
    identifyStoryArc(events: Array<{
        type: string;
        significance: number;
        emotional: string;
    }>, transitions: Array<{
        from: string;
        to: string;
    }>): StoryArc;
    /**
     * Generate chapter content
     */
    generateChapterContent(arc: StoryArc, phase: string, context: {
        recentEvents: string[];
        emotionalState: string;
        themes: string[];
        growth: string[];
    }): StoryChapter;
    /**
     * Generate narrative insight
     */
    generateNarrativeInsight(type: NarrativeInsight['type'], context: {
        recentChapter?: string;
        themes?: string[];
        emotionalState?: string;
        patterns?: string[];
    }): NarrativeInsight;
    /**
     * Generate story resonance
     */
    generateStoryResonance(narrative: string, context: {
        personalValues: string[];
        emotionalState: string;
        growth: string[];
    }): StoryResonance;
    /**
     * Generate personal mythology
     */
    generatePersonalMythology(context: {
        recurringSymbols: string[];
        lifePatterns: string[];
        wounds?: string[];
        gifts?: string[];
    }): PersonalMythology;
    /**
     * Generate timeline narrative
     */
    generateTimelineNarrative(chapters: Array<{
        title: string;
        summary: string;
        startDate: Date;
        emotional: string;
    }>): TimelineNarrative;
    private generateOpening;
    private generateMainContent;
    private generateClosing;
    private generateCosmicNarrative;
    private determineCurrentSeason;
    private getCosmicChapter;
    private getCosmicTheme;
    private getCosmicEnergy;
    private getCosmicInvitation;
    private getCosmicWisdom;
    private identifyTheme;
    private generateReflection;
    private generateInvitation;
    private getInsightTemplates;
    private generateConnectionInsight;
    private composeChapterNarrative;
    private generateChapterTitle;
    private generateTurningPoints;
    private getEmotionalBeginning;
    private getEmotionalMiddle;
    private getEmotionalEnd;
    private calculateResonance;
    private calculateAgency;
    private calculateMetaphorStrength;
    private calculateMeaning;
    private calculateGrowthAlignment;
    private interpretSymbol;
    private determineArchetype;
    private determineEra;
    private calculateEraSignificance;
    private extractKeyMoment;
    private generateTransitions;
    private determineMovement;
    private calculateMomentum;
    private capitalizeFirst;
}
declare const _default: LifeStoryService;
export default _default;
//# sourceMappingURL=storyService.d.ts.map