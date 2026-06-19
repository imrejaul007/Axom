/**
 * Trust signals — computed from raw profile fields to produce human-legible signals.
 * Surfaced in the discover feed and profile detail to help women identify trustworthy
 * profiles at a glance.
 *
 * RD-M-11 FIX: Moved from src/routes/profile.ts to a dedicated utils module so
 * DiscoveryService can import it without depending on a route file.
 */

export type TrustLevel    = 'UNVERIFIED' | 'VERIFIED' | 'BRONZE' | 'SILVER' | 'GOLD';
export type ResponseLabel = 'SLUGGISH' | 'SLOW' | 'RESPONSIVE' | 'QUICK' | 'LIKELY_TO_REPLY';
export type ActiveLabel   = 'ACTIVE_TODAY' | 'ACTIVE_THIS_WEEK' | 'ACTIVE_THIS_MONTH' | 'INACTIVE';

export interface TrustSignals {
  trustLevel:       TrustLevel;
  trustLevelLabel:  string;
  responseLabel:    ResponseLabel;
  responsePercent:   number;
  activeLabel:      ActiveLabel;
  lastActiveAt:     Date | null;
  profileCompleteness: number;
}

export function computeTrustSignals(p: {
  isVerified:    boolean;
  meetupCount:    number;
  responseRate:   number;
  lastActiveAt:  Date;
  photos:         string[];
  bio:            string | null;
}): TrustSignals {
  let trustLevel: TrustLevel;
  if (!p.isVerified)             trustLevel = 'UNVERIFIED';
  else if (p.meetupCount >= 6) trustLevel = 'GOLD';
  else if (p.meetupCount >= 3) trustLevel = 'SILVER';
  else if (p.meetupCount >= 1) trustLevel = 'BRONZE';
  else                           trustLevel = 'VERIFIED';

  const trustLevelLabels: Record<TrustLevel, string> = {
    UNVERIFIED: 'New Member',
    VERIFIED:   'Verified',
    BRONZE:     `Bronze · ${p.meetupCount} meetup${p.meetupCount !== 1 ? 's' : ''}`,
    SILVER:     `Silver · ${p.meetupCount} meetups`,
    GOLD:       `Gold · ${p.meetupCount} meetups`,
  };

  let responseLabel: ResponseLabel;
  const pct = Math.round(p.responseRate * 100);
  if (pct >= 95)      responseLabel = 'LIKELY_TO_REPLY';
  else if (pct >= 80) responseLabel = 'QUICK';
  else if (pct >= 50) responseLabel = 'RESPONSIVE';
  else if (pct >= 20) responseLabel = 'SLOW';
  else                  responseLabel = 'SLUGGISH';

  const hoursSince = (Date.now() - new Date(p.lastActiveAt).getTime()) / (1000 * 60 * 60);
  let activeLabel: ActiveLabel;
  if      (hoursSince <  24) activeLabel = 'ACTIVE_TODAY';
  else if (hoursSince < 168) activeLabel = 'ACTIVE_THIS_WEEK';
  else if (hoursSince < 720) activeLabel = 'ACTIVE_THIS_MONTH';
  else                        activeLabel = 'INACTIVE';

  const photoScore    = Math.min(p.photos.length / 6, 1) * 60;
  const bioScore      = (p.bio && p.bio.length > 20) ? 40 : (p.bio ? 20 : 0);
  const completeness   = Math.round(photoScore + bioScore);

  return {
    trustLevel,
    trustLevelLabel: trustLevelLabels[trustLevel],
    responseLabel,
    responsePercent: pct,
    activeLabel,
    lastActiveAt: new Date(p.lastActiveAt),
    profileCompleteness: completeness,
  };
}
