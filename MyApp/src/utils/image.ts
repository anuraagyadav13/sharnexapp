/**
 * Image helper utilities for cache busting and URI formatting.
 */

/**
 * Returns a cache-busted image URI string to ensure React Native <Image>
 * re-fetches updated photo URLs instead of serving stale disk/memory cached copies.
 *
 * Automatically resolves relative image paths (e.g. /uploads/user.jpg) to full URLs.
 *
 * @param url The raw image URL string
 * @param timestamp Optional timestamp parameter. Defaults to null. If provided, appends ?t=timestamp or &t=timestamp.
 */
export function getCacheBustedUri(url?: string | null, timestamp?: number | null): string {
  if (!url || typeof url !== 'string' || url.trim().length === 0) return '';

  const trimmed = url.trim();

  // If it's a local file path, blob, or base64 data URI, return as-is
  if (trimmed.startsWith('file://') || trimmed.startsWith('data:') || trimmed.startsWith('content://')) {
    return trimmed;
  }

  // Ensure relative URLs are prepended with standard domain base URL
  let fullUrl = trimmed;
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
    const baseDomain = 'https://www.sharnex.com';
    fullUrl = fullUrl.startsWith('/') ? `${baseDomain}${fullUrl}` : `${baseDomain}/${fullUrl}`;
  }

  const ts = timestamp || null;
  if (!ts) {
    return fullUrl;
  }

  const separator = fullUrl.includes('?') ? '&' : '?';
  return `${fullUrl}${separator}t=${ts}`;
}
