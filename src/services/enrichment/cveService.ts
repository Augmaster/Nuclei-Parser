import type {
  EnrichedCVEDetails,
  CVSSInfo,
  AffectedProduct,
  VendorAdvisory,
} from '@/types/nuclei';
import {
  getCachedCVE,
  setCachedCVE,
  getCachedCVEBatch,
} from './cveCache';

// Rate limiting configuration
const RATE_LIMIT = {
  nvdRequestsPerWindow: 5, // 5 requests per 30 seconds without API key
  nvdWindowMs: 30 * 1000,
  circlRequestsPerWindow: 10, // CIRCL is more generous
  circlWindowMs: 10 * 1000,
};

// Request queue for rate limiting
interface QueuedRequest {
  cveId: string;
  resolve: (value: EnrichedCVEDetails | null) => void;
  reject: (error: Error) => void;
}

const requestQueue: QueuedRequest[] = [];
let isProcessingQueue = false;
let lastNvdRequestTime = 0;
let nvdRequestCount = 0;

// CVE ID validation regex
const CVE_PATTERN = /^CVE-\d{4}-\d{4,}$/i;

/**
 * Validate CVE ID format
 */
export function isValidCVEId(cveId: string): boolean {
  return CVE_PATTERN.test(cveId);
}

/**
 * Normalize CVE ID to uppercase
 */
export function normalizeCVEId(cveId: string): string {
  return cveId.toUpperCase();
}

/**
 * Extract CVE IDs from various sources (references, template ID, etc.)
 */
export function extractCVEIds(texts: string[]): string[] {
  const cves = new Set<string>();
  const pattern = /CVE-\d{4}-\d{4,}/gi;

  for (const text of texts) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        cves.add(match.toUpperCase());
      }
    }
  }

  return Array.from(cves);
}

/**
 * Wait for a specified duration
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if we can make an NVD request (rate limiting)
 */
function canMakeNvdRequest(): boolean {
  const now = Date.now();
  if (now - lastNvdRequestTime > RATE_LIMIT.nvdWindowMs) {
    nvdRequestCount = 0;
    lastNvdRequestTime = now;
  }
  return nvdRequestCount < RATE_LIMIT.nvdRequestsPerWindow;
}

/**
 * Record an NVD request for rate limiting
 */
function recordNvdRequest(): void {
  const now = Date.now();
  if (now - lastNvdRequestTime > RATE_LIMIT.nvdWindowMs) {
    nvdRequestCount = 0;
    lastNvdRequestTime = now;
  }
  nvdRequestCount++;
}

/**
 * Parse NVD API response to EnrichedCVEDetails
 */
function parseNvdResponse(data: unknown): EnrichedCVEDetails | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nvdData = data as any;
    const vulnerability = nvdData?.vulnerabilities?.[0]?.cve;

    if (!vulnerability) return null;

    const cveId = vulnerability.id;
    const description = vulnerability.descriptions?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (d: any) => d.lang === 'en'
    )?.value;

    // Parse CVSS v3.1
    let cvss: CVSSInfo | undefined;
    const cvssMetrics = vulnerability.metrics?.cvssMetricV31?.[0] ||
                       vulnerability.metrics?.cvssMetricV30?.[0];
    if (cvssMetrics?.cvssData) {
      cvss = {
        version: cvssMetrics.cvssData.version || '3.1',
        score: cvssMetrics.cvssData.baseScore,
        vector: cvssMetrics.cvssData.vectorString,
        severity: cvssMetrics.cvssData.baseSeverity?.toLowerCase() as CVSSInfo['severity'],
      };
    }

    // Parse CWE IDs
    const cweIds: string[] = [];
    for (const weakness of vulnerability.weaknesses || []) {
      for (const desc of weakness.description || []) {
        if (desc.value?.startsWith('CWE-')) {
          cweIds.push(desc.value);
        }
      }
    }

    // Parse references
    const references: string[] = [];
    const vendorAdvisories: VendorAdvisory[] = [];

    for (const ref of vulnerability.references || []) {
      references.push(ref.url);

      // Detect vendor advisories
      const tags = ref.tags || [];

      if (tags.includes('Vendor Advisory') || tags.includes('Patch')) {
        vendorAdvisories.push({
          vendor: extractVendorFromUrl(ref.url),
          url: ref.url,
          patchAvailable: tags.includes('Patch'),
        });
      }
    }

    // Parse affected products
    const affectedProducts: AffectedProduct[] = [];
    for (const config of vulnerability.configurations || []) {
      for (const node of config.nodes || []) {
        for (const match of node.cpeMatch || []) {
          if (match.vulnerable && match.criteria) {
            const parts = match.criteria.split(':');
            if (parts.length >= 5) {
              const vendor = parts[3];
              const product = parts[4];
              const version = parts[5] || '*';

              // Find or create product entry
              let productEntry = affectedProducts.find(
                p => p.vendor === vendor && p.product === product
              );
              if (!productEntry) {
                productEntry = { vendor, product, versions: [] };
                affectedProducts.push(productEntry);
              }

              if (version !== '*' && !productEntry.versions.includes(version)) {
                productEntry.versions.push(version);
              }
            }
          }
        }
      }
    }

    // Check for exploit availability
    const exploitAvailable = vulnerability.references?.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ref: any) => ref.tags?.includes('Exploit')
    ) || false;

    return {
      id: cveId,
      description,
      publishedDate: vulnerability.published,
      lastModifiedDate: vulnerability.lastModified,
      cvss,
      cweIds: cweIds.length > 0 ? cweIds : undefined,
      references: references.length > 0 ? references : undefined,
      affectedProducts: affectedProducts.length > 0 ? affectedProducts : undefined,
      vendorAdvisories: vendorAdvisories.length > 0 ? vendorAdvisories : undefined,
      exploitAvailable,
      source: 'nvd',
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to parse NVD response:', error);
    return null;
  }
}

/**
 * Parse CIRCL CVE API response to EnrichedCVEDetails
 */
function parseCirclResponse(data: unknown): EnrichedCVEDetails | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const circlData = data as any;

    if (!circlData?.id) return null;

    // Parse CVSS (CIRCL uses different format)
    let cvss: CVSSInfo | undefined;
    if (circlData.cvss) {
      cvss = {
        version: '3.1',
        score: circlData.cvss,
        vector: circlData.cvss_vector || '',
        severity: getCvssSeverity(circlData.cvss),
      };
    }

    // Parse CWE
    const cweIds = circlData.cwe ? [circlData.cwe] : undefined;

    // Parse references
    const references = circlData.references || [];

    return {
      id: circlData.id,
      description: circlData.summary,
      publishedDate: circlData.Published,
      lastModifiedDate: circlData.Modified,
      cvss,
      cweIds,
      references: references.length > 0 ? references : undefined,
      source: 'circl',
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to parse CIRCL response:', error);
    return null;
  }
}

/**
 * Get CVSS severity label from score
 */
function getCvssSeverity(score: number): CVSSInfo['severity'] {
  if (score === 0) return 'none';
  if (score < 4.0) return 'low';
  if (score < 7.0) return 'medium';
  if (score < 9.0) return 'high';
  return 'critical';
}

/**
 * Extract vendor name from URL
 */
function extractVendorFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    // Extract meaningful part of domain
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    return hostname;
  } catch {
    return 'Unknown';
  }
}

/**
 * Fetch CVE from NVD API
 */
async function fetchFromNvd(cveId: string): Promise<EnrichedCVEDetails | null> {
  const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cveId}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.status === 429) {
      // Rate limited
      console.warn('NVD API rate limited');
      return null;
    }

    if (!response.ok) {
      console.error(`NVD API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return parseNvdResponse(data);
  } catch (error) {
    console.error('Failed to fetch from NVD:', error);
    return null;
  }
}

/**
 * Fetch CVE from CIRCL API (fallback)
 */
async function fetchFromCircl(cveId: string): Promise<EnrichedCVEDetails | null> {
  const url = `https://cve.circl.lu/api/cve/${cveId}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`CIRCL API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return parseCirclResponse(data);
  } catch (error) {
    console.error('Failed to fetch from CIRCL:', error);
    return null;
  }
}

/**
 * Fetch CVE data with caching and rate limiting
 */
export async function fetchCVE(cveId: string): Promise<EnrichedCVEDetails | null> {
  const normalizedId = normalizeCVEId(cveId);

  if (!isValidCVEId(normalizedId)) {
    console.warn(`Invalid CVE ID format: ${cveId}`);
    return null;
  }

  // Check cache first
  const cached = await getCachedCVE(normalizedId);
  if (cached) {
    return cached;
  }

  // Add to queue for rate-limited fetching
  return new Promise((resolve, reject) => {
    requestQueue.push({ cveId: normalizedId, resolve, reject });
    processQueue();
  });
}

/**
 * Process the request queue with rate limiting
 */
async function processQueue(): Promise<void> {
  if (isProcessingQueue || requestQueue.length === 0) return;

  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (!request) continue;

    try {
      // Wait for rate limit window if needed
      if (!canMakeNvdRequest()) {
        const waitTime = RATE_LIMIT.nvdWindowMs - (Date.now() - lastNvdRequestTime);
        await delay(waitTime + 100); // Add small buffer
      }

      recordNvdRequest();

      // Try NVD first
      let result = await fetchFromNvd(request.cveId);

      // Fallback to CIRCL if NVD fails
      if (!result) {
        result = await fetchFromCircl(request.cveId);
      }

      if (result) {
        // Cache the result
        await setCachedCVE(request.cveId, result);
      }

      request.resolve(result);
    } catch (error) {
      request.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  isProcessingQueue = false;
}

/**
 * Fetch multiple CVEs with caching
 */
export async function fetchCVEsBatch(cveIds: string[]): Promise<Map<string, EnrichedCVEDetails>> {
  const results = new Map<string, EnrichedCVEDetails>();
  const normalizedIds = cveIds
    .map(normalizeCVEId)
    .filter(isValidCVEId);

  if (normalizedIds.length === 0) {
    return results;
  }

  // Check cache first
  const cached = await getCachedCVEBatch(normalizedIds);
  for (const [cveId, data] of cached) {
    results.set(cveId, data);
  }

  // Fetch missing CVEs
  const missingIds = normalizedIds.filter(id => !results.has(id));

  // Fetch in parallel with rate limiting
  const fetchPromises = missingIds.map(async (cveId) => {
    const data = await fetchCVE(cveId);
    if (data) {
      results.set(cveId, data);
    }
  });

  await Promise.all(fetchPromises);

  return results;
}

/**
 * Get CVE directly from cache (synchronous check, async fetch if needed)
 */
export async function getCVEDetails(cveId: string): Promise<EnrichedCVEDetails | null> {
  const normalizedId = normalizeCVEId(cveId);

  // Try cache first
  const cached = await getCachedCVE(normalizedId);
  if (cached) {
    return cached;
  }

  // Fetch if not cached
  return fetchCVE(normalizedId);
}

/**
 * Get CVE details for multiple IDs
 */
export async function getCVEDetailsBatch(cveIds: string[]): Promise<Map<string, EnrichedCVEDetails>> {
  return fetchCVEsBatch(cveIds);
}
