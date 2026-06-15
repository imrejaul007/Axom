/**
 * Supported memory types for AI context.
 */
export var MemoryType;
(function (MemoryType) {
    /** Objective facts about the user */
    MemoryType["FACT"] = "FACT";
    /** Likes, dislikes, and preferences */
    MemoryType["PREFERENCE"] = "PREFERENCE";
    /** Past events and occurrences */
    MemoryType["EVENT"] = "EVENT";
    /** User goals and aspirations */
    MemoryType["GOAL"] = "GOAL";
    /** People and relationships */
    MemoryType["RELATIONSHIP"] = "RELATIONSHIP";
    /** Abilities and competencies */
    MemoryType["SKILL"] = "SKILL";
    /** Situational context */
    MemoryType["CONTEXT"] = "CONTEXT";
})(MemoryType || (MemoryType = {}));
/**
 * Categories for organizing memories.
 */
export var MemoryCategory;
(function (MemoryCategory) {
    /** Personal information */
    MemoryCategory["PERSONAL"] = "PERSONAL";
    /** Work and career */
    MemoryCategory["PROFESSIONAL"] = "PROFESSIONAL";
    /** Social connections */
    MemoryCategory["SOCIAL"] = "SOCIAL";
    /** Health and wellness */
    MemoryCategory["HEALTH"] = "HEALTH";
    /** Financial information */
    MemoryCategory["FINANCIAL"] = "FINANCIAL";
    /** General preferences */
    MemoryCategory["PREFERENCE"] = "PREFERENCE";
})(MemoryCategory || (MemoryCategory = {}));
//# sourceMappingURL=types.js.map