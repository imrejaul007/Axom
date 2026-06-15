/**
 * Request logging middleware
 * @module middleware/requestLogger
 */
/**
 * Logs incoming requests with method, path, and duration
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
export function requestLogger(req, res, next) {
    const start = Date.now();
    // Log request
    logger.info([${new Date().toISOString()}] ${req.method} ${req.path}`);
    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
        const resetColor = '\x1b[0m';
        logger.info([${new Date().toISOString()}] ${req.method} ${req.path} ${statusColor}${res.statusCode}${resetColor} - ${duration}ms`);
    });
    next();
}
/**
 * CORS headers middleware
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
export function corsHeaders(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    }
    else {
        next();
    }
}
//# sourceMappingURL=requestLogger.js.map