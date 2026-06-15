"use strict";
/**
 * REZ Booking verification client.
 * Validates that a rezBookingRef is real, unused, and matches the plan category
 * before accepting a Plan creation request.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRezBooking = verifyRezBooking;
const rezClient_1 = require("./rezClient");
const errorHandler_1 = require("../../middleware/errorHandler");
const CATEGORY_TO_REZ_TYPE = {
    DINNER: 'restaurant',
    LUNCH: 'restaurant',
    BREAKFAST: 'restaurant',
    BRUNCH: 'restaurant',
    SPA: 'spa',
    SALON: 'salon',
    SHOPPING: 'shopping',
    BADMINTON: 'sports',
    SPORTS: 'sports',
    GAMING: 'gaming',
};
async function verifyRezBooking(rezBookingRef, category, merchantId) {
    let booking;
    try {
        const res = await rezClient_1.rezClient.get(`/partner/v1/bookings/${rezBookingRef}/verify`);
        booking = res.data;
    }
    catch {
        throw new errorHandler_1.AppError(422, 'Could not verify REZ booking — please check your booking reference');
    }
    if (!booking.valid)
        throw new errorHandler_1.AppError(422, 'REZ booking is not valid');
    if (booking.used)
        throw new errorHandler_1.AppError(409, 'REZ booking has already been used for another plan');
    if (new Date(booking.expiresAt) < new Date())
        throw new errorHandler_1.AppError(422, 'REZ booking has expired');
    if (booking.merchantId !== merchantId)
        throw new errorHandler_1.AppError(422, 'REZ booking does not match the selected merchant');
    const expectedType = CATEGORY_TO_REZ_TYPE[category];
    if (booking.merchantType !== expectedType) {
        throw new errorHandler_1.AppError(422, `This booking is for a ${booking.merchantType} merchant, not ${expectedType}`);
    }
    if (booking.capacity < 2) {
        throw new errorHandler_1.AppError(422, 'REZ booking must be for at least 2 people');
    }
}
