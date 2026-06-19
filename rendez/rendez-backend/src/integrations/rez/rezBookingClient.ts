/**
 * REZ Booking verification client.
 * Validates that a rezBookingRef is real, unused, and matches the plan category
 * before accepting a Plan creation request.
 */

import { rezClient } from './rezClient';
import { AppError } from '../../middleware/errorHandler';
import { PlanCategory } from '@prisma/client';

const CATEGORY_TO_REZ_TYPE: Record<PlanCategory, string> = {
  DINNER:    'restaurant',
  LUNCH:     'restaurant',
  BREAKFAST: 'restaurant',
  BRUNCH:    'restaurant',
  SPA:       'spa',
  SALON:     'salon',
  SHOPPING:  'shopping',
  BADMINTON: 'sports',
  SPORTS:    'sports',
  GAMING:    'gaming',
};

export async function verifyRezBooking(
  rezBookingRef: string,
  category: PlanCategory,
  merchantId: string,
): Promise<void> {
  let booking: {
    valid: boolean;
    used: boolean;
    merchantType: string;
    merchantId: string;
    capacity: number;
    expiresAt: string;
  };

  try {
    const res = await rezClient.get(`/partner/v1/bookings/${rezBookingRef}/verify`);
    booking = res.data;
  } catch {
    throw new AppError(422, 'Could not verify REZ booking — please check your booking reference');
  }

  if (!booking.valid)   throw new AppError(422, 'REZ booking is not valid');
  if (booking.used)     throw new AppError(409, 'REZ booking has already been used for another plan');
  if (new Date(booking.expiresAt) < new Date()) throw new AppError(422, 'REZ booking has expired');
  if (booking.merchantId !== merchantId) throw new AppError(422, 'REZ booking does not match the selected merchant');

  const expectedType = CATEGORY_TO_REZ_TYPE[category];
  if (booking.merchantType !== expectedType) {
    throw new AppError(422, `This booking is for a ${booking.merchantType} merchant, not ${expectedType}`);
  }

  if (booking.capacity < 2) {
    throw new AppError(422, 'REZ booking must be for at least 2 people');
  }
}
