import type { KEVEntry, KEVCatalogMeta } from '@/types/nuclei';
import {
  getKEVEntry as getFromDB,
  getKEVEntries as getMultipleFromDB,
  getAllKEVEntries,
  setKEVCatalog,
  getKEVCatalogMeta,
  setKEVCatalogMeta,
} from '@/services/db/indexedDB';

// CISA KEV catalog URL
const KEV_CATALOG_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

// Cache configuration
const KEV_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache
let inMemoryKEVCache: Map<string, KEVEntry> | null = null;
let lastLoadTime: number = 0;

// CISA KEV API response format
interface CISAKEVResponse {
  title: string;
  catalogVersion: string;
  dateReleased: string;
  count: number;
  vulnerabilities: Array<{
    cveID: string;
    vendorProject: string;
    product: string;
    vulnerabilityName: string;
    dateAdded: string;
    shortDescription: string;
    requiredAction: string;
    dueDate: string;
    knownRansomwareCampaignUse: 'Known' | 'Unknown';
    notes: string;
  }>;
}

/**
 * Parse CISA KEV API response to KEVEntry array
 */
function parseKEVResponse(data: CISAKEVResponse): KEVEntry[] {
  return data.vulnerabilities.map(vuln => ({
    cveId: vuln.cveID,
    vendorProject: vuln.vendorProject,
    product: vuln.product,
    vulnerabilityName: vuln.vulnerabilityName,
    dateAdded: vuln.dateAdded,
    shortDescription: vuln.shortDescription,
    requiredAction: vuln.requiredAction,
    dueDate: vuln.dueDate,
    knownRansomwareCampaignUse: vuln.knownRansomwareCampaignUse,
    notes: vuln.notes || '',
  }));
}

/**
 * Fetch KEV catalog from CISA
 */
async function fetchKEVCatalog(): Promise<KEVEntry[]> {
  try {
    const response = await fetch(KEV_CATALOG_URL, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch KEV catalog: ${response.status}`);
    }

    const data: CISAKEVResponse = await response.json();
    return parseKEVResponse(data);
  } catch (error) {
    console.error('Failed to fetch KEV catalog:', error);
    throw error;
  }
}

/**
 * Check if KEV catalog needs refresh
 */
async function needsRefresh(): Promise<boolean> {
  // Check in-memory cache age
  if (lastLoadTime > 0 && Date.now() - lastLoadTime < KEV_CACHE_TTL_MS) {
    return false;
  }

  // Check IndexedDB metadata
  try {
    const meta = await getKEVCatalogMeta();
    if (meta) {
      const lastUpdate = new Date(meta.lastUpdated).getTime();
      return Date.now() - lastUpdate > KEV_CACHE_TTL_MS;
    }
  } catch (error) {
    console.error('Failed to check KEV catalog metadata:', error);
  }

  return true;
}

/**
 * Load KEV catalog into memory from IndexedDB
 */
async function loadFromDB(): Promise<void> {
  try {
    const entries = await getAllKEVEntries();
    inMemoryKEVCache = new Map(entries.map(e => [e.cveId, e]));
    lastLoadTime = Date.now();
  } catch (error) {
    console.error('Failed to load KEV catalog from DB:', error);
    inMemoryKEVCache = new Map();
  }
}

/**
 * Initialize or refresh KEV catalog
 * Call this on app startup or periodically
 */
export async function initializeKEVCatalog(forceRefresh = false): Promise<{
  success: boolean;
  count: number;
  fromCache: boolean;
  error?: string;
}> {
  try {
    const shouldRefresh = forceRefresh || await needsRefresh();

    if (!shouldRefresh) {
      // Load from DB if not in memory
      if (!inMemoryKEVCache) {
        await loadFromDB();
      }
      return {
        success: true,
        count: inMemoryKEVCache?.size || 0,
        fromCache: true,
      };
    }

    // Fetch fresh catalog
    const entries = await fetchKEVCatalog();

    // Store in IndexedDB
    await setKEVCatalog(entries);

    // Update metadata
    const meta: KEVCatalogMeta = {
      id: 'kev-catalog',
      lastUpdated: new Date().toISOString(),
      count: entries.length,
    };
    await setKEVCatalogMeta(meta);

    // Update in-memory cache
    inMemoryKEVCache = new Map(entries.map(e => [e.cveId, e]));
    lastLoadTime = Date.now();

    return {
      success: true,
      count: entries.length,
      fromCache: false,
    };
  } catch (error) {
    // Try to use cached data as fallback
    if (!inMemoryKEVCache) {
      await loadFromDB();
    }

    return {
      success: false,
      count: inMemoryKEVCache?.size || 0,
      fromCache: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check if a CVE is in the KEV catalog
 */
export async function isInKEV(cveId: string): Promise<KEVEntry | null> {
  const normalizedId = cveId.toUpperCase();

  // Check in-memory cache first
  if (inMemoryKEVCache) {
    return inMemoryKEVCache.get(normalizedId) || null;
  }

  // Load from DB
  try {
    const entry = await getFromDB(normalizedId);
    return entry || null;
  } catch (error) {
    console.error('Failed to check KEV status:', error);
    return null;
  }
}

/**
 * Check multiple CVEs against KEV catalog
 */
export async function getKEVStatuses(cveIds: string[]): Promise<Map<string, KEVEntry>> {
  const normalizedIds = cveIds.map(id => id.toUpperCase());
  const results = new Map<string, KEVEntry>();

  // Check in-memory cache first
  if (inMemoryKEVCache) {
    for (const cveId of normalizedIds) {
      const entry = inMemoryKEVCache.get(cveId);
      if (entry) {
        results.set(cveId, entry);
      }
    }
    return results;
  }

  // Load from DB
  try {
    return await getMultipleFromDB(normalizedIds);
  } catch (error) {
    console.error('Failed to get KEV statuses:', error);
    return results;
  }
}

/**
 * Get KEV entry details
 */
export async function getKEVDetails(cveId: string): Promise<KEVEntry | null> {
  return isInKEV(cveId);
}

/**
 * Get catalog statistics
 */
export async function getKEVStats(): Promise<{
  totalEntries: number;
  lastUpdated: string | null;
  isLoaded: boolean;
}> {
  const meta = await getKEVCatalogMeta();

  return {
    totalEntries: meta?.count || inMemoryKEVCache?.size || 0,
    lastUpdated: meta?.lastUpdated || null,
    isLoaded: inMemoryKEVCache !== null,
  };
}

/**
 * Check if KEV catalog is loaded
 */
export function isKEVLoaded(): boolean {
  return inMemoryKEVCache !== null && inMemoryKEVCache.size > 0;
}

/**
 * Get all CVE IDs in KEV catalog
 */
export async function getAllKEVCveIds(): Promise<string[]> {
  if (inMemoryKEVCache) {
    return Array.from(inMemoryKEVCache.keys());
  }

  const entries = await getAllKEVEntries();
  return entries.map(e => e.cveId);
}

/**
 * Search KEV catalog by vendor/product
 */
export async function searchKEV(query: string): Promise<KEVEntry[]> {
  const lowerQuery = query.toLowerCase();

  // Ensure catalog is loaded
  if (!inMemoryKEVCache) {
    await loadFromDB();
  }

  if (!inMemoryKEVCache) {
    return [];
  }

  const results: KEVEntry[] = [];
  for (const entry of inMemoryKEVCache.values()) {
    if (
      entry.cveId.toLowerCase().includes(lowerQuery) ||
      entry.vendorProject.toLowerCase().includes(lowerQuery) ||
      entry.product.toLowerCase().includes(lowerQuery) ||
      entry.vulnerabilityName.toLowerCase().includes(lowerQuery)
    ) {
      results.push(entry);
    }
  }

  return results;
}

/**
 * Get KEV entries with upcoming due dates
 */
export async function getUpcomingDueDates(daysAhead = 30): Promise<KEVEntry[]> {
  // Ensure catalog is loaded
  if (!inMemoryKEVCache) {
    await loadFromDB();
  }

  if (!inMemoryKEVCache) {
    return [];
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const results: KEVEntry[] = [];
  for (const entry of inMemoryKEVCache.values()) {
    const dueDate = new Date(entry.dueDate);
    if (dueDate > now && dueDate <= cutoff) {
      results.push(entry);
    }
  }

  // Sort by due date
  return results.sort((a, b) =>
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
}

/**
 * Check if a CVE has known ransomware usage
 */
export async function hasRansomwareUsage(cveId: string): Promise<boolean> {
  const entry = await isInKEV(cveId);
  return entry?.knownRansomwareCampaignUse === 'Known';
}
