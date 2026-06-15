import { prisma } from '../config/database';
import { ReportReason } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { DiscoveryService } from './DiscoveryService';

const discoveryService = new DiscoveryService();

export class ModerationService {
  async reportUser(reporterId: string, reportedId: string, reason: ReportReason, detail?: string): Promise<void> {
    if (reporterId === reportedId) throw new AppError(400, 'Cannot report yourself');
    await prisma.report.create({ data: { reporterId, reportedId, reason, detail } });
  }

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) throw new AppError(400, 'Cannot block yourself');

    // RZ-B-B1 FIX: Clean up MessageRequest and MessageState records within the same
    // transaction to prevent orphaned records after a block. Also check if already blocked
    // to prevent double-processing.
    const existingBlock = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (existingBlock) return; // already blocked — no-op

    const affectedMatches = await prisma.match.findMany({
      where: {
        OR: [{ user1Id: blockerId, user2Id: blockedId }, { user1Id: blockedId, user2Id: blockerId }],
      },
      select: { id: true },
    });
    const matchIds = affectedMatches.map((m) => m.id);

    await prisma.$transaction(async (tx) => {
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

  async getBlocks(profileId: string) {
    return prisma.block.findMany({
      where: { blockerId: profileId },
      include: { blocked: { select: { id: true, name: true, photos: true } } },
    });
  }

  async unblock(blockerId: string, blockedId: string): Promise<void> {
    await prisma.block.deleteMany({ where: { blockerId, blockedId } });
  }
}
