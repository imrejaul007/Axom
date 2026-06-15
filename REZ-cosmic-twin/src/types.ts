/**
 * Enumeration of possible digital twin lifecycle statuses.
 */
export enum TwinStatus {
  /** Twin is being initialized from raw data. */
  CREATING = "CREATING",
  /** Twin is fully operational and accepting syncs. */
  ACTIVE = "ACTIVE",
  /** Twin is actively learning from new data points. */
  LEARNING = "LEARNING",
  /** Twin is synchronizing with external services. */
  SYNCING = "SYNCING",
  /** Twin encountered an error and requires attention. */
  ERROR = "ERROR",
  /** Twin is archived and no longer actively maintained. */
  ARCHIVED = "ARCHIVED",
}

/**
 * Enumeration of capabilities a digital twin can possess.
 */
export enum TwinCapability {
  /** Generates recommendations based on twin model. */
  RECOMMENDATION = "RECOMMENDATION",
  /** Forecasts future behavior or preferences. */
  PREDICTION = "PREDICTION",
  /** Adapts experiences to the twin's unique profile. */
  PERSONALIZATION = "PERSONALIZATION",
  /** Produces analytical insights from data points. */
  ANALYSIS = "ANALYSIS",
  /** Runs scenario simulations against the twin model. */
  SIMULATION = "SIMULATION",
}

/**
 * Represents a digital twin — a dynamic software mirror of a user or entity.
 *
 * @property id - Unique identifier for the twin.
 * @property userId - ID of the user or entity this twin represents.
 * @property name - Human-readable name for the twin.
 * @property description - Optional description of the twin's purpose.
 * @property status - Current lifecycle status of the twin.
 * @property avatar - Optional avatar URL or data URI.
 * @property personality - Optional personality trait object.
 * @property createdAt - ISO timestamp of twin creation.
 * @property updatedAt - ISO timestamp of last update.
 * @property lastSync - ISO timestamp of last data synchronization.
 * @property learningProgress - Percentage (0-100) of learning completion.
 * @property capabilities - List of active capabilities on the twin.
 * @property dataPoints - Total count of data points ingested.
 * @property version - Schema/migration version of the twin model.
 */
export interface TwinModel {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly description: string;
  readonly status: TwinStatus;
  readonly avatar?: string;
  readonly personality?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastSync: string;
  readonly learningProgress: number;
  readonly capabilities: TwinCapability[];
  readonly dataPoints: number;
  readonly version: string;
}

/**
 * Represents a single synchronization event for a twin.
 *
 * @property id - Unique identifier for the sync event.
 * @property twinId - ID of the twin that was synchronized.
 * @property type - Category of data that was synced (e.g., "behavior", "preference").
 * @property data - The raw payload that was synced.
 * @property syncedAt - ISO timestamp of when the sync occurred.
 */
export interface TwinSync {
  readonly id: string;
  readonly twinId: string;
  readonly type: string;
  readonly data: unknown;
  readonly syncedAt: string;
}

/**
 * Payload for updating an existing twin's properties.
 *
 * @property capabilities - Replacement list of capabilities.
 * @property personality - Replacement personality trait object.
 * @property description - New description text.
 * @property name - New display name.
 */
export interface TwinUpdate {
  readonly capabilities?: TwinCapability[];
  readonly personality?: Record<string, unknown>;
  readonly description?: string;
  readonly name?: string;
}

/** Current schema version for TwinModel. */
export const TWIN_SCHEMA_VERSION = "1.0.0";

/** Initial learning progress percentage for a newly created twin. */
export const INITIAL_LEARNING_PROGRESS = 0;

/** Initial data point count for a newly created twin. */
export const INITIAL_DATA_POINTS = 0;
