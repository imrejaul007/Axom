/**
 * Request logging middleware.
 *
 * Logs HTTP method, path, status, response time, and user agent
 * for every incoming request.
 */
export function requestLogger(req, res, next) {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        const log = {
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: duration,
        };
        if (req.userId) {
            log.userId = req.userId;
        }
        if (res.statusCode >= 500) {
            // eslint-disable-next-line no-console
            console.error(JSON.stringify({ level: "error", ...log }));
        }
        else {
            // eslint-disable-next-line no-console
            console.log(JSON.stringify({ level: "info", ...log }));
        }
    });
    next();
}
//# sourceMappingURL=requestLogger.js.map