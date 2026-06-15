"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerMeetupReward = triggerMeetupReward;
const rezClient_1 = require("./rezClient");
const errorHandler_1 = require("../../middleware/errorHandler");
const telemetry_1 = require("../../config/telemetry");
async function triggerMeetupReward(params) {
    try {
        const { data } = await rezClient_1.rezClient.post('/rewards/trigger', {
            ...params,
            source: 'rendez_meetup',
        });
        return data;
    }
    catch (err) {
        telemetry_1.log.error({ err, params }, '[RezReward] triggerMeetupReward failed');
        throw err instanceof errorHandler_1.AppError ? err : new errorHandler_1.AppError(502, 'Reward trigger failed');
    }
}
