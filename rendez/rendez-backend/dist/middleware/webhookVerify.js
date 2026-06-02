"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRezWebhook = verifyRezWebhook;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
function verifyRezWebhook(req, res, next) {
    const signature = req.headers['x-rez-signature'];
    if (!signature)
        return res.status(401).json({ message: 'Missing webhook signature' });
    // rawBody is set by express.json verify callback in src/index.ts so that
    // HMAC verification uses the exact bytes received over the wire (re-serializing
    // req.body can alter non-ASCII characters or whitespace ordering).
    const rawBody = req.rawBody;
    if (!rawBody)
        return res.status(400).json({ message: 'Missing raw body — webhook verification unavailable' });
    const expected = crypto_1.default
        .createHmac('sha256', env_1.env.REZ.WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');
    let isValid = false;
    try {
        isValid = crypto_1.default.timingSafeEqual(Buffer.from(signature.replace('sha256=', ''), 'hex'), Buffer.from(expected, 'hex'));
    }
    catch {
        // Buffer length mismatch (malformed hex) — treat as invalid
        isValid = false;
    }
    if (!isValid)
        return res.status(401).json({ message: 'Invalid webhook signature' });
    next();
}
