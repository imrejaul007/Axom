/**
 * Enumeration of possible digital twin lifecycle statuses.
 */
export var TwinStatus;
(function (TwinStatus) {
    /** Twin is being initialized from raw data. */
    TwinStatus["CREATING"] = "CREATING";
    /** Twin is fully operational and accepting syncs. */
    TwinStatus["ACTIVE"] = "ACTIVE";
    /** Twin is actively learning from new data points. */
    TwinStatus["LEARNING"] = "LEARNING";
    /** Twin is synchronizing with external services. */
    TwinStatus["SYNCING"] = "SYNCING";
    /** Twin encountered an error and requires attention. */
    TwinStatus["ERROR"] = "ERROR";
    /** Twin is archived and no longer actively maintained. */
    TwinStatus["ARCHIVED"] = "ARCHIVED";
})(TwinStatus || (TwinStatus = {}));
/**
 * Enumeration of capabilities a digital twin can possess.
 */
export var TwinCapability;
(function (TwinCapability) {
    /** Generates recommendations based on twin model. */
    TwinCapability["RECOMMENDATION"] = "RECOMMENDATION";
    /** Forecasts future behavior or preferences. */
    TwinCapability["PREDICTION"] = "PREDICTION";
    /** Adapts experiences to the twin's unique profile. */
    TwinCapability["PERSONALIZATION"] = "PERSONALIZATION";
    /** Produces analytical insights from data points. */
    TwinCapability["ANALYSIS"] = "ANALYSIS";
    /** Runs scenario simulations against the twin model. */
    TwinCapability["SIMULATION"] = "SIMULATION";
})(TwinCapability || (TwinCapability = {}));
/** Current schema version for TwinModel. */
export const TWIN_SCHEMA_VERSION = "1.0.0";
/** Initial learning progress percentage for a newly created twin. */
export const INITIAL_LEARNING_PROGRESS = 0;
/** Initial data point count for a newly created twin. */
export const INITIAL_DATA_POINTS = 0;
//# sourceMappingURL=types.js.map