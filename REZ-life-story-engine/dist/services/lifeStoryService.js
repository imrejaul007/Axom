/**
 * Life Story Service - Core business logic for generating and managing life stories
 * @module services/lifeStoryService
 */
import { v4 as uuidv4 } from 'uuid';
import { StoryArc } from '../types.js';
/**
 * Service class for managing life stories
 * Provides in-memory storage and story generation capabilities
 */
export class LifeStoryService {
    /** In-memory storage for life stories, keyed by userId */
    stories = new Map();
    /** In-memory storage for story chapters, keyed by storyId */
    chapters = new Map();
    /**
     * Generates a new life story for a user
     * @param userId - User identifier
     * @param options - Optional generation parameters
     * @returns Generated life story
     */
    async generateStory(userId, options) {
        const storyId = uuidv4();
        const now = new Date().toISOString();
        // Determine story arc based on themes/focus
        const arc = this.determineArc(options?.themes || [], options?.focus || []);
        // Generate initial chapters based on focus areas
        const initialChapters = this.generateInitialChapters(options?.focus || [], options?.themes || [], options?.timeRange);
        const story = {
            id: storyId,
            userId,
            title: this.generateStoryTitle(arc, options?.themes || []),
            chapters: initialChapters,
            createdAt: now,
            updatedAt: now,
            totalChapters: initialChapters.length,
            themes: this.extractThemes(initialChapters),
            mood: this.determineMood(options?.tone),
            arc,
        };
        this.stories.set(userId, story);
        this.chapters.set(storyId, initialChapters);
        return story;
    }
    /**
     * Retrieves a user's life story
     * @param userId - User identifier
     * @returns Life story or null if not found
     */
    async getStory(userId) {
        return this.stories.get(userId) || null;
    }
    /**
     * Retrieves a specific chapter from a story
     * @param storyId - Story identifier
     * @param chapterId - Chapter identifier
     * @returns Chapter or null if not found
     */
    async getChapter(storyId, chapterId) {
        const storyChapters = this.chapters.get(storyId);
        if (!storyChapters)
            return null;
        return storyChapters.find(ch => ch.id === chapterId) || null;
    }
    /**
     * Adds a new chapter to a user's story
     * @param userId - User identifier
     * @param title - Chapter title
     * @param events - Significant events
     * @param emotions - Emotional elements
     * @param themes - Thematic elements
     * @returns Updated life story
     */
    async addChapter(userId, title, events, emotions, themes) {
        let story = this.stories.get(userId);
        if (!story) {
            // Create a new story if none exists
            story = await this.generateStory(userId, { themes });
        }
        const chapter = {
            id: uuidv4(),
            title,
            summary: this.generateChapterSummary(events, emotions),
            events,
            emotions,
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            keyMoments: this.extractKeyMoments(events),
            themes,
        };
        story.chapters.push(chapter);
        story.totalChapters = story.chapters.length;
        story.updatedAt = new Date().toISOString();
        story.themes = this.extractThemes(story.chapters);
        this.chapters.set(story.id, story.chapters);
        this.stories.set(userId, story);
        return story;
    }
    /**
     * Updates an existing chapter
     * @param storyId - Story identifier
     * @param chapterId - Chapter identifier
     * @param updates - Chapter updates
     * @returns Updated chapter or null if not found
     */
    async updateChapter(storyId, chapterId, updates) {
        const storyChapters = this.chapters.get(storyId);
        if (!storyChapters)
            return null;
        const chapterIndex = storyChapters.findIndex(ch => ch.id === chapterId);
        if (chapterIndex === -1)
            return null;
        const chapter = storyChapters[chapterIndex];
        const updatedChapter = {
            ...chapter,
            ...updates,
            id: chapter.id, // Preserve original ID
        };
        storyChapters[chapterIndex] = updatedChapter;
        this.chapters.set(storyId, storyChapters);
        // Update the parent story's timestamp
        for (const [userId, story] of this.stories) {
            if (story.id === storyId) {
                story.updatedAt = new Date().toISOString();
                this.stories.set(userId, story);
                break;
            }
        }
        return updatedChapter;
    }
    /**
     * Deletes a chapter from a story
     * @param storyId - Story identifier
     * @param chapterId - Chapter identifier
     * @returns True if deleted, false if not found
     */
    async deleteChapter(storyId, chapterId) {
        const storyChapters = this.chapters.get(storyId);
        if (!storyChapters)
            return false;
        const chapterIndex = storyChapters.findIndex(ch => ch.id === chapterId);
        if (chapterIndex === -1)
            return false;
        storyChapters.splice(chapterIndex, 1);
        this.chapters.set(storyId, storyChapters);
        // Update the parent story
        for (const [userId, story] of this.stories) {
            if (story.id === storyId) {
                story.totalChapters = storyChapters.length;
                story.updatedAt = new Date().toISOString();
                this.stories.set(userId, story);
                break;
            }
        }
        return true;
    }
    /**
     * Gets all themes from a user's story
     * @param userId - User identifier
     * @returns Array of unique themes
     */
    async getThemes(userId) {
        const story = this.stories.get(userId);
        if (!story)
            return [];
        return story.themes;
    }
    /**
     * Gets the story arc for a specific story
     * @param storyId - Story identifier
     * @returns Story arc or null if not found
     */
    async getArc(storyId) {
        for (const story of this.stories.values()) {
            if (story.id === storyId) {
                return story.arc;
            }
        }
        return null;
    }
    /**
     * Generates a summary of a user's life story
     * @param userId - User identifier
     * @param maxChapters - Maximum chapters to include (default all)
     * @returns Life summary
     */
    async summarizeLife(userId, maxChapters) {
        const story = this.stories.get(userId);
        if (!story) {
            return {
                summary: 'No life story found for this user.',
                keyThemes: [],
                notableEvents: [],
                emotionalJourney: 'No emotional data available.',
            };
        }
        const chaptersToAnalyze = maxChapters
            ? story.chapters.slice(0, maxChapters)
            : story.chapters;
        return {
            summary: this.generateSummary(chaptersToAnalyze),
            keyThemes: this.extractMajorThemes(chaptersToAnalyze),
            notableEvents: this.extractNotableEvents(chaptersToAnalyze),
            emotionalJourney: this.generateEmotionalJourney(chaptersToAnalyze),
        };
    }
    /**
     * Determines the story arc based on themes and focus
     */
    determineArc(themes, focus) {
        const themeLower = themes.map(t => t.toLowerCase());
        const focusLower = focus.map(f => f.toLowerCase());
        if (themeLower.some(t => t.includes('growth') || t.includes('learn'))) {
            return StoryArc.GROWTH;
        }
        if (themeLower.some(t => t.includes('adventure') || t.includes('discover'))) {
            return StoryArc.ADVENTURE;
        }
        if (themeLower.some(t => t.includes('transform') || t.includes('change'))) {
            return StoryArc.TRANSFORMATION;
        }
        if (themeLower.some(t => t.includes('heal') || t.includes('recovery'))) {
            return StoryArc.RECOVERY;
        }
        if (themeLower.some(t => t.includes('achieve') || t.includes('success'))) {
            return StoryArc.ACHIEVEMENT;
        }
        if (themeLower.some(t => t.includes('explore') || t.includes('curiosity'))) {
            return StoryArc.EXPLORATION;
        }
        if (themeLower.some(t => t.includes('connect') || t.includes('relationship'))) {
            return StoryArc.CONNECTION;
        }
        return StoryArc.GROWTH; // Default arc
    }
    /**
     * Generates initial chapters based on focus areas
     */
    generateInitialChapters(focus, themes, timeRange) {
        const chapters = [];
        const focusCount = Math.max(focus.length, 3);
        for (let i = 0; i < Math.min(focusCount, 5); i++) {
            const focusArea = focus[i] || themes[i] || `Chapter ${i + 1}`;
            chapters.push({
                id: uuidv4(),
                title: this.formatChapterTitle(focusArea),
                summary: `A journey through ${focusArea.toLowerCase()}`,
                events: [],
                emotions: [],
                startDate: timeRange?.start || new Date().toISOString(),
                endDate: timeRange?.end || new Date().toISOString(),
                keyMoments: [],
                themes: themes.slice(i * 2, i * 2 + 2),
            });
        }
        return chapters;
    }
    /**
     * Generates a story title based on arc and themes
     */
    generateStoryTitle(arc, themes) {
        const arcTitles = {
            [StoryArc.GROWTH]: 'A Journey of Growth',
            [StoryArc.ADVENTURE]: 'An Adventure Unfolds',
            [StoryArc.TRANSFORMATION]: 'A Story of Transformation',
            [StoryArc.RECOVERY]: 'A Tale of Resilience',
            [StoryArc.ACHIEVEMENT]: 'A Path to Achievement',
            [StoryArc.EXPLORATION]: 'An Exploration of Life',
            [StoryArc.CONNECTION]: 'A Story of Connection',
        };
        const baseTitle = arcTitles[arc];
        if (themes.length > 0) {
            return `${baseTitle}: ${themes[0]}`;
        }
        return baseTitle;
    }
    /**
     * Formats a focus area into a chapter title
     */
    formatChapterTitle(focus) {
        const words = focus.split(' ');
        if (words.length <= 3) {
            return focus.charAt(0).toUpperCase() + focus.slice(1);
        }
        return words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    /**
     * Extracts all themes from chapters
     */
    extractThemes(chapters) {
        const themeSet = new Set();
        for (const chapter of chapters) {
            for (const theme of chapter.themes) {
                themeSet.add(theme);
            }
        }
        return Array.from(themeSet);
    }
    /**
     * Determines the story mood
     */
    determineMood(tone) {
        if (tone)
            return tone;
        return 'reflective';
    }
    /**
     * Generates a chapter summary
     */
    generateChapterSummary(events, emotions) {
        if (events.length === 0)
            return 'An empty chapter waiting to be written.';
        const eventCount = events.length;
        const emotionWord = emotions.length > 0 ? emotions[0] : 'eventful';
        return `This chapter captures ${eventCount} significant ${emotionWord} moment${eventCount > 1 ? 's' : ''}.`;
    }
    /**
     * Extracts key moments from events
     */
    extractKeyMoments(events) {
        return events.slice(0, 3); // Top 3 events as key moments
    }
    /**
     * Generates an overall story summary
     */
    generateSummary(chapters) {
        if (chapters.length === 0) {
            return 'An empty story waiting to be written.';
        }
        return `This life story spans ${chapters.length} chapter${chapters.length > 1 ? 's' : ''}, ` +
            `exploring themes of ${chapters.map(c => c.title).slice(0, 3).join(', ')}.`;
    }
    /**
     * Extracts major themes from chapters
     */
    extractMajorThemes(chapters) {
        const themeCounts = new Map();
        for (const chapter of chapters) {
            for (const theme of chapter.themes) {
                themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
            }
        }
        return Array.from(themeCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([theme]) => theme);
    }
    /**
     * Extracts notable events from chapters
     */
    extractNotableEvents(chapters) {
        const events = [];
        for (const chapter of chapters) {
            events.push(...chapter.events);
        }
        return events.slice(0, 10); // Top 10 notable events
    }
    /**
     * Generates an emotional journey description
     */
    generateEmotionalJourney(chapters) {
        if (chapters.length === 0) {
            return 'No emotional data available.';
        }
        const allEmotions = [];
        for (const chapter of chapters) {
            allEmotions.push(...chapter.emotions);
        }
        if (allEmotions.length === 0) {
            return 'A journey with moments of reflection and growth.';
        }
        const uniqueEmotions = [...new Set(allEmotions)];
        return `An emotional journey through ${uniqueEmotions.slice(0, 3).join(', ')}.`;
    }
}
// Export singleton instance for convenience
export const lifeStoryService = new LifeStoryService();
//# sourceMappingURL=lifeStoryService.js.map