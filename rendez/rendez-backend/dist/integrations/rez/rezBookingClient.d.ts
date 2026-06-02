/**
 * REZ Booking verification client.
 * Validates that a rezBookingRef is real, unused, and matches the plan category
 * before accepting a Plan creation request.
 */
import { PlanCategory } from '@prisma/client';
export declare function verifyRezBooking(rezBookingRef: string, category: PlanCategory, merchantId: string): Promise<void>;
//# sourceMappingURL=rezBookingClient.d.ts.map