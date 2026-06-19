// RZ-M-X1: Shared date formatter — consolidates 7 inconsistent toLocaleDateString patterns
// across GiftInboxScreen, RequestInboxScreen, PlanDetailScreen, MatchesScreen,
// ExperienceWalletScreen, PlansScreen, PlanConfirmScreen, MyPlansScreen, VoucherScreen,
// and CreatePlanScreen.

export type DateFormat = 'short' | 'medium' | 'full';

const SHORT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
const MEDIUM: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
const FULL: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };

/**
 * Formats an ISO date string to Indian locale (en-IN).
 * Pass 'short' for "12 Mar", 'medium' for "12 Mar 2026",
 * 'full' for "Friday, March 12", or a custom options object.
 */
export function formatDate(iso: string | Date, format?: DateFormat): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (isNaN(date.getTime())) return '—';
  if (format === 'short') return date.toLocaleDateString('en-IN', SHORT);
  if (format === 'medium') return date.toLocaleDateString('en-IN', MEDIUM);
  if (format === 'full') return date.toLocaleDateString('en-IN', FULL);
  return date.toLocaleDateString('en-IN', format ?? SHORT);
}

/** Formats to "12 Mar 2026, 09:30 AM" style */
export function formatDateTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Formats to "Fri, Mar 12" style */
export function formatDateCompact(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Formats to "09:30 AM" style */
export function formatTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/** Formats to "Fri, Mar 12 at 09:30 AM" style (full date + time) */
export function formatDateFull(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (isNaN(date.getTime())) return '—';
  return `${formatDate(date, 'full')} at ${formatTime(date)}`;
}

/** Formats to "12 Mar" (short) + "09:30 AM" combined */
export function formatDateShortWithTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (isNaN(date.getTime())) return '—';
  return `${formatDate(date, 'short')} ${formatTime(date)}`;
}
