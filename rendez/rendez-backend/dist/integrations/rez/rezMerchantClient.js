"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNearbyMerchants = getNearbyMerchants;
exports.createBooking = createBooking;
const rezClient_1 = require("./rezClient");
async function getNearbyMerchants(params) {
    const { data } = await rezClient_1.rezClient.get('/merchants/nearby', { params });
    return data;
}
async function createBooking(params) {
    const { data } = await rezClient_1.rezClient.post('/bookings/create', params);
    return data;
}
