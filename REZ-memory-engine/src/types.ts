/**
 * Supported memory types for AI context.
 */
export enum MemoryType {
  /** Objective facts about the user */
  FACT = "FACT",
  /** Likes, dislikes, and preferences */
  PREFERENCE = "PREFERENCE",
  /** Past events and occurrences */
  EVENT = "EVENT",
  /** User goals and aspirations */
  GOAL = "GOAL",
  /** People and relationships */
  RELATIONSHIP = "RELATIONSHIP",
  /** Abilities and competencies */
  SKILL = "SKILL",
  /** Situational context */
  CONTEXT = "CONTEXT",
}

/**
 * Categories for organizing memories.
 */
export enum MemoryCategory {
  /** Personal information */
  PERSONAL = "PERSONAL",
  /** Work and career */
  PROFESSIONAL = "PROFESSIONAL",
  /** Social connections */
  SOCIAL = "SOCIAL",
  /** Health and wellness */
  HEALTH = "HEALTH",
  /** Financial information */
  FINANCIAL = "FINANCIAL",
  /** General preferences */
  PREFERENCE = "PREFERENCE",
}

/**
 * Contextual metadata attached to a memory.
 */
export interface MemoryContext {
  /** Where the memory was sourced from */
  source?: string;
  /** Confidence level (0-1) */
  confidence?: number;
  /** Additional key-value metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Options for memory retrieval queries.
 */
export interface MemorySearchOptions {
  /** Types to filter by */
  types?: MemoryType[];
  /** Categories to filter by */
  categories?: MemoryCategory[];
  /** Tags to filter by (AND logic) */
  tags?: string[];
  /** Minimum importance (1-5) */
  minImportance?: number;
  /** Results per page */
  limit?: number;
  /** Page number (1-indexed) */
  page?: number;
  /** Sort field */
  sortBy?: "createdAt" | "accessedAt" | "importance";
  /** Sort direction */
  sortOrder?: "asc" | "desc";
}

/**
 * Core memory record stored by the engine.
 */
export interface Memory {
  /** Unique memory identifier */
  id: string;
  /** Owner user ID */
  userId: string;
  /** Type of memory */
  type: MemoryType;
  /** The actual memory content */
  content: string;
  /** Contextual metadata */
  context: MemoryContext;
  /** Category for organization */
  category: MemoryCategory;
  /** Searchable tags */
  tags: string[];
  /** Importance level (1-5) */
  importance: number;
  /** ISO-8601 creation timestamp */
  createdAt: string;
  /** ISO-8601 last-access timestamp */
  accessedAt: string;
  /** Number of times accessed */
  accessedCount: number;
}

/**
 * Response envelope for paginated results.
 */
export interface PaginatedMemoryResponse {
  data: Memory[];
  total: number;
  page: number;
  totalPages: number;
}
