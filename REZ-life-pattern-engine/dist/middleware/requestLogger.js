/**
 * REZ Life Pattern Engine - Request Logger Middleware
 * Logs incoming requests and response times
 */
/**
 * Formats request body for logging (removes sensitive data)
 * @param body - Request body
 * @returns Sanitized body
 */
function sanitizeBody(body) {
    if (!body)
        return undefined;
    const sensitiveFields = [
        "password",
        "token",
        "secret",
        "apiKey",
        "authorization",
        "credential",
    ];
    const sanitized = {};
    for (const [key, value] of Object.entries(body)) {
        if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
            sanitized[key] = "[REDACTED]";
        }
        else if (typeof value === "object" && value !== null) {
            sanitized[key] = sanitizeBody(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
/**
 * Generates a unique request ID
 * @returns Unique request ID
 */
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
/**
 * Formats a log entry
 * @param level - Log level
 * @param data - Request log data
 * @param duration - Response duration in ms
 * @param statusCode - Response status code
 * @returns Formatted log string
 */
function formatLog(level, data, duration, statusCode) {
    const parts = [
        `[${level}]`,
        data.requestId,
        data.method,
        data.path,
    ];
    if (duration !== undefined) {
        parts.push(`${duration}ms`);
    }
    if (statusCode !== undefined) {
        parts.push(`[${statusCode}]`);
    }
    return parts.join(" ");
}
/**
 * Request logger middleware
 * Logs incoming requests and response times
 */
export function requestLogger(req, res, next) {
    // Generate request ID
    const requestId = generateRequestId();
    req.headers["x-request-id"] = requestId;
    // Capture start time
    const startTime = Date.now();
    // Create log data
    const logData = {
        method: req.method,
        path: req.path,
        query: req.query,
        body: sanitizeBody(req.body),
        timestamp: new Date(),
        requestId,
    };
    // Log incoming request
    console.log(formatLog("IN", logData));
    // Capture response finish using on-finished pattern
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    let responseFinished = false;
    const logResponse = () => {
        if (responseFinished)
            return;
        responseFinished = true;
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        // Determine log level based on status code
        const level = statusCode >= 500 ? "ERROR" : statusCode >= 400 ? "WARN" : "OUT";
        console.log(formatLog(level, logData, duration, statusCode));
    };
    res.on("finish", logResponse);
    res.on("close", logResponse);
    next();
}
/**
 * Logs an info message
 * @param message - Log message
 * @param meta - Additional metadata
 */
export function logInfo(message, meta) {
    logger.info([INFO] ${new Date().toISOString()} ${message}`, meta ? JSON.stringify(meta) : "");
}
/**
 * Logs a warning message
 * @param message - Log message
 * @param meta - Additional metadata
 */
export function logWarn(message, meta) {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`, meta ? JSON.stringify(meta) : "");
}
/**
 * Logs an error message
 * @param message - Log message
 * @param meta - Additional metadata
 */
export function logError(message, meta) {
    logger.error([ERROR] ${new Date().toISOString()} ${message}`, meta ? JSON.stringify(meta) : "");
}
/**
 * Logs a debug message (only in development)
 * @param message - Log message
 * @param meta - Additional metadata
 */
export function logDebug(message, meta) {
    if (process.env.NODE_ENV === "development") {
        console.debug(`[DEBUG] ${new Date().toISOString()} ${message}`, meta ? JSON.stringify(meta) : "");
    }
}
//# sourceMappingURL=requestLogger.js.map