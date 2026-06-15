"use strict";
/**
 * REZ Mind Service - Rendez Integration
 * Sends social/booking events to REZ Mind Event Platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBookingToRezMind = sendBookingToRezMind;
exports.sendProfileViewToRezMind = sendProfileViewToRezMind;
const REZ_MIND_URL = process.env.REZ_MIND_URL || 'http://localhost:4008';
/**
 * Send booking event to REZ Mind (fire-and-forget)
 */
async function sendBookingToRezMind(booking) {
    try {
        await fetch(`${REZ_MIND_URL}/webhook/consumer/booking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...booking,
                source: 'rendez',
                timestamp: new Date().toISOString(),
            }),
        });
    }
    catch (error) {
        console.error('[REZ Mind] Booking event failed:', error);
    }
}
/**
 * Send profile view event to REZ Mind
 */
async function sendProfileViewToRezMind(data) {
    try {
        await fetch(`${REZ_MIND_URL}/webhook/consumer/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...data,
                category: 'social',
                source: 'rendez',
                timestamp: new Date().toISOString(),
            }),
        });
    }
    catch (error) {
        console.error('[REZ Mind] Profile view event failed:', error);
    }
}
