/**
 * REZ Mind Service - Rendez Integration
 * Sends social/booking events to REZ Mind Event Platform
 */

const REZ_MIND_URL = process.env.REZ_MIND_URL || 'http://localhost:4008';

interface BookingEvent {
  user_id: string;
  booking_id: string;
  service_type: string;
  merchant_id?: string;
  amount?: number;
}

/**
 * Send booking event to REZ Mind (fire-and-forget)
 */
export async function sendBookingToRezMind(booking: BookingEvent): Promise<void> {
  try {
    await fetch(`${REZ_MIND_URL}/webhook/consumer/booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...booking,
        source: 'rendez',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('[REZ Mind] Booking event failed:', error);
  }
}

/**
 * Send profile view event to REZ Mind
 */
export async function sendProfileViewToRezMind(data: {
  user_id: string;
  profile_id: string;
  action: string;
}): Promise<void> {
  try {
    await fetch(`${REZ_MIND_URL}/webhook/consumer/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        category: 'social',
        source: 'rendez',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('[REZ Mind] Profile view event failed:', error);
  }
}
