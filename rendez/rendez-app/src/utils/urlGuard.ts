/**
 * RD-M-04 FIX: URL validation guards.
 * Prevents javascript:, data:, or file:// URIs from being passed to Image source props,
 * which could cause security issues or unexpected behavior.
 */

export function isValidHttpsUrl(url: unknown): url is string {
  return typeof url === 'string' && url.startsWith('https://');
}

export function sanitizeImageUrl(url: unknown): string | null {
  return isValidHttpsUrl(url) ? url : null;
}
