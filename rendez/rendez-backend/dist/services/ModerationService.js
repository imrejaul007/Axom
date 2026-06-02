"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationService = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const DiscoveryService_1 = require("./DiscoveryService");
const discoveryService = new DiscoveryService_1.DiscoveryService();
class ModerationService {
    async reportUser(reporterId, reportedId, reason, detail) {
        if (reporterId === reportedId)
            throw new errorHandler_1.AppError(400, 'Cannot report yourself');
        await database_1.prisma.report.create({ data: { reporterId, reportedId, reason, detail } });
    }
    async blockUser(blockerId, blockedId) {
        if (blockerId === blockedId)
            throw new errorHandler_1.AppError(400, 'Cannot block yourself');
        // RZ-B-B1 FIX: Clean up MessageRequest and MessageState records within the same
        // transaction to prevent orphaned records after a block. Also check if already blocked
        // to prevent double-processing.
        const existingBlock = await database_1.prisma.block.findUnique({
            where: { blockerId_blockedId: { blockerId, blockedId } },
        });
        if (existingBlock)
            return; // already blocked — no-op
        const affectedMatches = await database_1.prisma.match.findMany({
            where: {
                OR: [{ user1Id: blockerId, user2Id: blockedId }, { user1Id: blockedId, user2Id: blockerId }],
            },
            select: { id: true },
        });
        const matchIds = affectedMatches.map((m) => m.id);
        await database_1.prisma.$transaction(async (tx) => {
            await tx.block.upsert({
                where: { blockerId_blockedId: { blockerId, blockedId } },
                create: { blockerId, blockedId },
                update: {},
            });
            await tx.match.updateMany({
                where: { id: { in: matchIds } },
                data: { status: 'BLOCKED' },
            });
            // Clean up pending MessageRequest entries for affected matches
            if (matchIds.length > 0) {
                await tx.messageRequest.deleteMany({
                    where: { matchId: { in: matchIds } },
                });
            }
        });
        await discoveryService.invalidateFeed(blockerId);
        await discoveryService.invalidateFeed(blockedId);
    }
    async getBlocks(profileId) {
        return database_1.prisma.block.findMany({
            where: { blockerId: profileId },
            include: { blocked: { select: { id: true, name: true, photos: true } } },
        });
    }
    async unblock(blockerId, blockedId) {
        await database_1.prisma.block.deleteMany({ where: { blockerId, blockedId } });
    }
}
exports.ModerationService = ModerationService;
