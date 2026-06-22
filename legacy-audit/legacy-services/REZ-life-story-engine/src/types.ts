/**
 * Type definitions for REZ Life Story Engine
 * @module types
 */

/**
 * Represents a single chapter in a life story
 */
export interface StoryChapter {
  /** Unique chapter identifier */
  id: string;
  /** Chapter title */
  title: string;
  /** Brief summary of chapter events */
  summary: string;
  /** Array of significant events in this chapter */
  events: string[];
  /** Emotional tone throughout this chapter */
  emotions: string[];
  /** Chapter start date */
  startDate: string;
  /** Chapter end date */
  endDate: string;
  /** Key moments that define this chapter */
  keyMoments: string[];
  /** Thematic elements present in this chapter */
  themes: string[];
}

/**
 * Available story arc types that define the overall narrative structure
 */
export enum StoryArc {
  /** Personal development and learning */
  GROWTH = 'GROWTH',
  /** Exploration and discovery */
  ADVENTURE = 'ADVENTURE',
  /** Major life changes */
  TRANSFORMATION = 'TRANSFORMATION',
  /** Healing and resilience */
  RECOVERY = 'RECOVERY',
  /** Success and accomplishment */
  ACHIEVEMENT = 'ACHIEVEMENT',
  /** Discovery and curiosity */
  EXPLORATION = 'EXPLORATION',
  /** Relationships and community */
  CONNECTION = 'CONNECTION',
}

/**
 * Complete life story containing all chapters and metadata
 */
export interface LifeStory {
  /** Unique story identifier */
  id: string;
  /** User who owns this story */
  userId: string;
  /** Story title */
  title: string;
  /** Array of story chapters in chronological order */
  chapters: StoryChapter[];
  /** When the story was created */
  createdAt: string;
  /** When the story was last updated */
  updatedAt: string;
  /** Total number of chapters */
  totalChapters: number;
  /** Major themes present in the story */
  themes: string[];
  /** Overall emotional tone */
  mood: string;
  /** Narrative arc type */
  arc: StoryArc;
}

/**
 * Request payload for generating a new life story
 */
export interface StoryGenerationRequest {
  /** User identifier */
  userId: string;
  /** Optional time range for story events */
  timeRange?: {
    start: string;
    end: string;
  };
  /** Optional focus areas for the story */
  focus?: string[];
  /** Optional themes to emphasize */
  themes?: string[];
  /** Optional narrative tone */
  tone?: string;
}

/**
 * Request payload for adding a new chapter
 */
export interface StoryChapterRequest {
  /** User identifier */
  userId: string;
  /** Chapter title */
  chapterTitle: string;
  /** Significant events in this chapter */
  events: string[];
  /** Emotional elements */
  emotions: string[];
  /** Thematic elements */
  themes: string[];
}

/**
 * Request payload for updating a chapter
 */
export interface StoryChapterUpdate {
  /** Updated chapter title */
  title?: string;
  /** Updated summary */
  summary?: string;
  /** Updated events */
  events?: string[];
  /** Updated emotions */
  emotions?: string[];
  /** Updated start date */
  startDate?: string;
  /** Updated end date */
  endDate?: string;
  /** Updated key moments */
  keyMoments?: string[];
  /** Updated themes */
  themes?: string[];
}

/**
 * Life summary response containing condensed story information
 */
export interface LifeSummary {
  /** Overall story summary */
  summary: string;
  /** Key themes identified */
  keyThemes: string[];
  /** Most notable events */
  notableEvents: string[];
  /** Emotional journey description */
  emotionalJourney: string;
}

/**
 * Application configuration schema
 */
export interface AppConfig {
  /** Server port number */
  port: number;
  /** Node environment */
  nodeEnv: string;
  /** MongoDB connection URI */
  mongodbUri: string;
  /** Redis host */
  redisHost: string;
  /** Redis port */
  redisPort: number;
  /** Internal service authentication token */
  internalServiceToken: string;
  /** Trust OS service URL */
  trustOsUrl: string;
  /** Memory engine service URL */
  memoryEngineUrl: string;
  /** Pattern engine service URL */
  patternEngineUrl: string;
}
