/**
 * Lightweight module-level memory cache for React Native.
 *
 * - Zero dependencies (no AsyncStorage, no npm packages)
 * - TTL-based expiry per cache key
 * - Deduplicates concurrent identical requests (pending map)
 * - clearCache() wipes everything — call on logout
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number; // Date.now() when stored
  ttl: number;       // validity window in ms
}

// Module-level stores — survive between renders, cleared only by clearCache()
const store: Record<string, CacheEntry<any>> = {};
const pending: Partial<Record<string, Promise<any>>> = {};

// ─── TTL constants ────────────────────────────────────────────────────────────
export const TTL = {
  /** Period structure rarely changes — cache for 24 hours */
  PERIODS: 24 * 60 * 60 * 1000,
  /** Teacher profile — refresh every 30 minutes */
  PROFILE: 30 * 60 * 1000,
} as const;

// ─── Key constants ────────────────────────────────────────────────────────────
export const CACHE_KEYS = {
  PERIODS:         'timetable/periods',
  TEACHER_PROFILE: 'account/teacher/profile',
} as const;

// ─── Private helpers ──────────────────────────────────────────────────────────
function isExpired<T>(entry: CacheEntry<T>): boolean {
  return Date.now() - entry.timestamp > entry.ttl;
}

// ─── Main API ─────────────────────────────────────────────────────────────────

/**
 * Fetch data with caching, TTL expiry, and in-flight deduplication.
 *
 * @param key           Unique cache key (use CACHE_KEYS constants)
 * @param fetcher       Async function that produces the fresh data
 * @param ttl           How long (ms) the cached value is valid
 * @param forceRefresh  If true, bypass cache and always call fetcher
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
  forceRefresh = false,
): Promise<T> {
  // 1. Cache hit — valid, non-expired entry
  if (!forceRefresh && store[key] && !isExpired(store[key])) {
    if (__DEV__) { console.log(`[CACHE HIT] ${key}`); }
    return store[key].data as T;
  }

  // 2. Concurrent deduplication — another call is already in-flight
  if (!forceRefresh && pending[key]) {
    if (__DEV__) { console.log(`[CACHE PENDING] ${key}`); }
    return pending[key] as Promise<T>;
  }

  // 3. Cache miss (or forceRefresh) — fire the actual request
  if (__DEV__) { console.log(`[CACHE MISS] ${key}`); }

  const promise = (async () => {
    try {
      const data = await fetcher();
      store[key] = { data, timestamp: Date.now(), ttl };
      return data;
    } catch (err) {
      // Do NOT cache errors — allow the next call to retry
      throw err;
    } finally {
      delete pending[key];
    }
  })();

  pending[key] = promise;
  return promise;
}

/**
 * Wipe all cached entries and in-flight promises.
 * Call on logout to prevent stale data leaking between sessions.
 */
export function clearCache(): void {
  Object.keys(store).forEach(k => delete store[k]);
  Object.keys(pending).forEach(k => delete pending[k]);
  if (__DEV__) { console.log('[CACHE] Cleared all entries'); }
}
