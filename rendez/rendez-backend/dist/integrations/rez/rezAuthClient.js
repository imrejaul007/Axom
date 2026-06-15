"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRezToken = verifyRezToken;
exports.linkAccount = linkAccount;
const rezClient_1 = require("./rezClient");
async function verifyRezToken(token) {
    const { data } = await rezClient_1.rezClient.get('/auth/verify-token', {
        headers: { Authorization: `Bearer ${token}` },
    });
    return data;
}
async function linkAccount(rezUserId, rendezUserId) {
    await rezClient_1.rezClient.post('/auth/link', { rez_user_id: rezUserId, rendez_user_id: rendezUserId });
}
