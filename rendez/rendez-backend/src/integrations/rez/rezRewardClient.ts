import { rezClient as client } from './rezClient';
import { AppError } from '../../middleware/errorHandler';
import { log } from '../../config/telemetry';

export interface TriggerRewardResult {
  reward_id: string;
  user1_coins: number;
  user2_coins: number;
}

export async function triggerMeetupReward(params: {
  booking_id: string;
  user1_rez_id: string;
  user2_rez_id: string;
  match_id: string;
}): Promise<TriggerRewardResult> {
  try {
    const { data } = await client.post('/rewards/trigger', {
      ...params,
      source: 'rendez_meetup',
    });
    return data;
  } catch (err) {
    log.error({ err, params }, '[RezReward] triggerMeetupReward failed');
    throw err instanceof AppError ? err : new AppError(502, 'Reward trigger failed');
  }
}
