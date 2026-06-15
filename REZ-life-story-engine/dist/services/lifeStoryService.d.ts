/**
 * Life Story Service - Core business logic for generating and managing life stories
 * @module services/lifeStoryService
 */
import { StoryArc } from '../types.js';
import type { LifeStory, StoryChapter, StoryGenerationRequest, StoryChapterUpdate, LifeSummary } from '../types.js';
/**
 * Service class for managing life stories
 * Provides in-memory storage and story generation capabilities
 */
export declare class LifeStoryService {
    /** In-memory storage for life stories, keyed by userId */
    private stories;
    /** In-memory storage for story chapters, keyed by storyId */
    private chapters;
    /**
     * Generates a new life story for a user
     * @param userId - User identifier
     * @param options - Optional generation parameters
     * @returns Generated life story
     */
    generateStory(userId: string, options?: Partial<StoryGenerationRequest>): Promise<LifeStory>;
    /**
     * Retrieves a user's life story
     * @param userId - User identifier
     * @returns Life story or null if not found
     */
    getStory(userId: string): Promise<LifeStory | null>;
    /**
     * Retrieves a specific chapter from a story
     * @param storyId - Story identifier
     * @param chapterId - Chapter identifier
     * @returns Chapter or null if not found
     */
    getChapter(storyId: string, chapterId: string): Promise<StoryChapter | null>;
    /**
     * Adds a new chapter to a user's story
     * @param userId - User identifier
     * @param title - Chapter title
     * @param events - Significant events
     * @param emotions - Emotional elements
     * @param themes - Thematic elements
     * @returns Updated life story
     */
    addChapter(userId: string, title: string, events: string[], emotions: string[], themes: string[]): Promise<LifeStory>;
    /**
     * Updates an existing chapter
     * @param storyId - Story identifier
     * @param chapterId - Chapter identifier
     * @param updates - Chapter updates
     * @returns Updated chapter or null if not found
     */
    updateChapter(storyId: string, chapterId: string, updates: StoryChapterUpdate): Promise<StoryChapter | null>;
    /**
     * Deletes a chapter from a story
     * @param storyId - Story identifier
     * @param chapterId - Chapter identifier
     * @returns True if deleted, false if not found
     */
    deleteChapter(storyId: string, chapterId: string): Promise<boolean>;
    /**
     * Gets all themes from a user's story
     * @param userId - User identifier
     * @returns Array of unique themes
     */
    getThemes(userId: string): Promise<string[]>;
    /**
     * Gets the story arc for a specific story
     * @param storyId - Story identifier
     * @returns Story arc or null if not found
     */
    getArc(storyId: string): Promise<StoryArc | null>;
    /**
     * Generates a summary of a user's life story
     * @param userId - User identifier
     * @param maxChapters - Maximum chapters to include (default all)
     * @returns Life summary
     */
    summarizeLife(userId: string, maxChapters?: number): Promise<LifeSummary>;
    /**
     * Determines the story arc based on themes and focus
     */
    private determineArc;
    /**
     * Generates initial chapters based on focus areas
     */
    private generateInitialChapters;
    /**
     * Generates a story title based on arc and themes
     */
    private generateStoryTitle;
    /**
     * Formats a focus area into a chapter title
     */
    private formatChapterTitle;
    /**
     * Extracts all themes from chapters
     */
    private extractThemes;
    /**
     * Determines the story mood
     */
    private determineMood;
    /**
     * Generates a chapter summary
     */
    private generateChapterSummary;
    /**
     * Extracts key moments from events
     */
    private extractKeyMoments;
    /**
     * Generates an overall story summary
     */
    private generateSummary;
    /**
     * Extracts major themes from chapters
     */
    private extractMajorThemes;
    /**
     * Extracts notable events from chapters
     */
    private extractNotableEvents;
    /**
     * Generates an emotional journey description
     */
    private generateEmotionalJourney;
}
export declare const lifeStoryService: LifeStoryService;
//# sourceMappingURL=lifeStoryService.d.ts.map