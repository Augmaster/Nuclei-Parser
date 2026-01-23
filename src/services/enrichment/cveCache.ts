import type { EnrichedCVEDetails, CVECacheEntry } from '@/types/nuclei';
import {
  getCVEFromCache as getFromDB,
  setCVECache as setInDB,
  clearExpiredCVECache,
  clearAllCVECache,
} from '@/services/db/indexedDB';

// Cache configuration
const CACHE_CONFIG = {
  inMemoryTTLMs: 60 * 60 * 1000, // 1 hour in-memory
  indexedDBTTLMs: 24 * 60 * 60 * 1000, // 24 hours in IndexedDB
  maxInMemoryEntries: 100,
  cleanupIntervalMs: 5 * 60 * 1000, // Clean up every 5 minutes
};

// In-memory cache for fast access
interface InMemoryCacheEntry {
  data: EnrichedCVEDetails;
  fetchedAt: number;
  expiresAt: number;
}

const inMemoryCache = new Map<string, InMemoryCacheEntry>();
let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Start the periodic cache cleanup
 */
export function startCacheCleanup(): void {
  if (cleanupIntervalId) return;

  cleanupIntervalId = setInterval(() => {
    cleanupExpiredEntries();
  }, CACHE_CONFIG.cleanupIntervalMs);
}

/**
 * Stop the periodic cache cleanup
 */
export function stopCacheCleanup(): void {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
}

/**
 * Clean up expired entries from in-memory cache
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of inMemoryCache.entries()) {
    if (entry.expiresAt < now) {
      inMemoryCache.delete(key);
    }
  }
}

/**
 * Enforce max entries limit by removing oldest entries
 */
function enforceMaxEntries(): void {
  if (inMemoryCache.size <= CACHE_CONFIG.maxInMemoryEntries) return;

  // Sort entries by fetchedAt (oldest first)
  const entries = Array.from(inMemoryCache.entries()).sort(
    (a, b) => a[1].fetchedAt - b[1].fetchedAt
  );

  // Remove oldest entries until we're under the limit
  const toRemove = entries.slice(0, entries.length - CACHE_CONFIG.maxInMemoryEntries);
  for (const [key] of toRemove) {
    inMemoryCache.delete(key);
  }
}

/**
 * Get CVE details from cache (in-memory first, then IndexedDB)
 */
export async function getCachedCVE(cveId: string): Promise<EnrichedCVEDetails | null> {
  const normalizedId = cveId.toUpperCase();
  const now = Date.now();

  // Check in-memory cache first
  const inMemoryEntry = inMemoryCache.get(normalizedId);
  if (inMemoryEntry && inMemoryEntry.expiresAt > now) {
    return inMemoryEntry.data;
  }

  // Check IndexedDB cache
  try {
    const dbEntry = await getFromDB(normalizedId);
    if (dbEntry) {
      // Populate in-memory cache
      const inMemoryExpiry = now + CACHE_CONFIG.inMemoryTTLMs;
      inMemoryCache.set(normalizedId, {
        data: dbEntry.data,
        fetchedAt: new Date(dbEntry.fetchedAt).getTime(),
        expiresAt: inMemoryExpiry,
      });
      enforceMaxEntries();
      return dbEntry.data;
    }
  } catch (error) {
    console.error('Failed to get CVE from IndexedDB cache:', error);
  }

  return null;
}

/**
 * Store CVE details in cache (both in-memory and IndexedDB)
 */
export async function setCachedCVE(cveId: string, data: EnrichedCVEDetails): Promise<void> {
  const normalizedId = cveId.toUpperCase();
  const now = Date.now();
  const nowISO = new Date(now).toISOString();

  // Store in in-memory cache
  inMemoryCache.set(normalizedId, {
    data,
    fetchedAt: now,
    expiresAt: now + CACHE_CONFIG.inMemoryTTLMs,
  });
  enforceMaxEntries();

  // Store in IndexedDB
  try {
    const cacheEntry: CVECacheEntry = {
      cveId: normalizedId,
      data,
      fetchedAt: nowISO,
      expiresAt: new Date(now + CACHE_CONFIG.indexedDBTTLMs).toISOString(),
    };
    await setInDB(cacheEntry);
  } catch (error) {
    console.error('Failed to store CVE in IndexedDB cache:', error);
  }
}

/**
 * Store multiple CVE entries in cache
 */
export async function setCachedCVEBatch(entries: Map<string, EnrichedCVEDetails>): Promise<void> {
  for (const [cveId, data] of entries) {
    await setCachedCVE(cveId, data);
  }
}

/**
 * Get multiple CVE entries from cache
 */
export async function getCachedCVEBatch(cveIds: string[]): Promise<Map<string, EnrichedCVEDetails>> {
  const results = new Map<string, EnrichedCVEDetails>();

  for (const cveId of cveIds) {
    const cached = await getCachedCVE(cveId);
    if (cached) {
      results.set(cveId.toUpperCase(), cached);
    }
  }

  return results;
}

/**
 * Check if a CVE is in cache (without retrieving data)
 */
export function isCached(cveId: string): boolean {
  const normalizedId = cveId.toUpperCase();
  const entry = inMemoryCache.get(normalizedId);
  return entry !== undefined && entry.expiresAt > Date.now();
}

/**
 * Remove a CVE from cache
 */
export function removeCachedCVE(cveId: string): void {
  const normalizedId = cveId.toUpperCase();
  inMemoryCache.delete(normalizedId);
}

/**
 * Clear all cached CVE data
 */
export async function clearCache(): Promise<void> {
  inMemoryCache.clear();
  try {
    await clearAllCVECache();
  } catch (error) {
    console.error('Failed to clear IndexedDB CVE cache:', error);
  }
}

/**
 * Clear expired entries from IndexedDB
 */
export async function clearExpiredCache(): Promise<number> {
  try {
    return await clearExpiredCVECache();
  } catch (error) {
    console.error('Failed to clear expired CVE cache:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  inMemoryCount: number;
  maxInMemoryEntries: number;
  inMemoryTTLMs: number;
  indexedDBTTLMs: number;
} {
  return {
    inMemoryCount: inMemoryCache.size,
    maxInMemoryEntries: CACHE_CONFIG.maxInMemoryEntries,
    inMemoryTTLMs: CACHE_CONFIG.inMemoryTTLMs,
    indexedDBTTLMs: CACHE_CONFIG.indexedDBTTLMs,
  };
}
