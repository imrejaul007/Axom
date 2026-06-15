"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = generateOTP;
exports.sendSMS = sendSMS;
const twilio_1 = __importDefault(require("twilio"));
const client = (0, twilio_1.default)(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}
async function sendSMS(phone, message) {
    if (process.env.NODE_ENV === 'development') {
        logger.info(SMS to ${phone}: ${message}`);
        return;
    }
    await client.messages.create({ body: message, from: process.env.TWILIO_FROM, to: phone });
}
