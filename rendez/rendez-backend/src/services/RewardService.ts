import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { FraudService } from './FraudService';
import * as rezReward from '../integrations/rez/rezRewardClient';

const fraud = new FraudService();

export class RewardService {
  async triggerMeetupReward(params: {
    matchId: string;
    bookingId: string;
  }): Promise<void> {
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        user1: { select: { rezUserId: true } },
        user2: { select: { rezUserId: true } },
      },
    });
    if (!match) throw new AppError(404, 'Match not found');

    // Guard: both users must have a linked REZ account to receive rewards
    if (!match.user1.rezUserId || !match.user2.rezUserId) {
      throw new AppError(422, 'One or both users have not linked a REZ account — reward cannot be issued');
    }

    await fraud.checkRewardFarming(match.user1Id, match.user2Id, params.bookingId);
    await fraud.checkFakeCheckin(params.matchId, params.bookingId);

    const existingReward = await prisma.reward.findFirst({
      where: { matchId: params.matchId, bookingId: params.bookingId },
    });
    if (existingReward) return;

    const rewardRecord = await prisma.reward.create({
      data: { matchId: params.matchId, bookingId: params.bookingId, user1Id: match.user1Id, user2Id: match.user2Id },
    });

    try {
      const result = await rezReward.triggerMeetupReward({
        booking_id: params.bookingId,
        user1_rez_id: match.user1.rezUserId,
        user2_rez_id: match.user2.rezUserId,
        match_id: params.matchId,
      });

      await prisma.reward.update({
        where: { id: rewardRecord.id },
        data: { status: 'TRIGGERED', rezRewardRef: result.reward_id, triggeredAt: new Date() },
      });
    } catch (err) {
      await prisma.reward.update({ where: { id: rewardRecord.id }, data: { status: 'FAILED' } });
      throw err;
    }
  }
}
