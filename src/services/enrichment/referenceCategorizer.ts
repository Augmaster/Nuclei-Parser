/**
 * Reference Link Categorizer
 * Categorizes finding references by type for better organization and display
 */

import type { ReferenceLink, ReferenceLinkType } from '@/types/nuclei';

// URL patterns for categorization
const categoryPatterns: Record<ReferenceLinkType, RegExp[]> = {
  cve: [
    /cve\.mitre\.org/i,
    /nvd\.nist\.gov\/vuln\/detail\/CVE/i,
    /cvedetails\.com/i,
  ],
  cwe: [
    /cwe\.mitre\.org/i,
  ],
  nvd: [
    /nvd\.nist\.gov/i,
  ],
  exploit: [
    /exploit-db\.com/i,
    /packetstormsecurity/i,
    /rapid7\.com\/db/i,
    /0day\.today/i,
    /vuldb\.com/i,
    /sploitus\.com/i,
    /github\.com.*exploit/i,
    /github\.com.*poc/i,
    /github\.com.*payload/i,
  ],
  advisory: [
    /security\.advisory/i,
    /securityfocus\.com/i,
    /secunia\.com/i,
    /kb\.cert\.org/i,
    /us-cert\.gov/i,
    /cisa\.gov/i,
    /jvn\.jp/i,
    /portal\.msrc\.microsoft\.com/i,
    /access\.redhat\.com\/security/i,
    /ubuntu\.com\/security/i,
    /debian\.org\/security/i,
    /security\.gentoo\.org/i,
    /advisories\./i,
    /advisory/i,
    /bulletin/i,
  ],
  patch: [
    /patch/i,
    /fix/i,
    /release-notes/i,
    /changelog/i,
    /upgrade/i,
    /update/i,
  ],
  documentation: [
    /owasp\.org/i,
    /cheatsheetseries/i,
    /portswigger\.net\/web-security/i,
    /hacktricks/i,
    /book\.hacktricks/i,
    /developer\.mozilla\.org/i,
    /docs\./i,
    /documentation/i,
    /wiki\./i,
    /wikipedia\.org/i,
    /medium\.com/i,
    /blog\./i,
  ],
  github: [
    /github\.com(?!.*exploit)(?!.*poc)(?!.*payload)/i,
    /gitlab\.com/i,
    /bitbucket\.org/i,
  ],
  other: [],
};

// Icons/labels for each category
export const categoryMeta: Record<ReferenceLinkType, { label: string; description: string }> = {
  cve: { label: 'CVE', description: 'CVE Database Entry' },
  cwe: { label: 'CWE', description: 'CWE Classification' },
  nvd: { label: 'NVD', description: 'National Vulnerability Database' },
  exploit: { label: 'Exploit', description: 'Exploit/PoC Code' },
  advisory: { label: 'Advisory', description: 'Security Advisory' },
  patch: { label: 'Patch', description: 'Patch/Fix Information' },
  documentation: { label: 'Docs', description: 'Documentation/Learning' },
  github: { label: 'GitHub', description: 'Source Repository' },
  other: { label: 'Other', description: 'Other Reference' },
};

/**
 * Categorize a single reference URL
 */
export function categorizeReference(url: string): ReferenceLinkType {
  const lowerUrl = url.toLowerCase();

  // Check patterns in priority order
  const priorityOrder: ReferenceLinkType[] = [
    'cve',
    'cwe',
    'nvd',
    'exploit',
    'advisory',
    'patch',
    'documentation',
    'github',
  ];

  for (const type of priorityOrder) {
    const patterns = categoryPatterns[type];
    for (const pattern of patterns) {
      if (pattern.test(lowerUrl)) {
        return type;
      }
    }
  }

  return 'other';
}

/**
 * Extract a meaningful title from a URL
 */
export function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '');

    // Extract CVE ID if present
    const cveMatch = url.match(/CVE-\d{4}-\d+/i);
    if (cveMatch) {
      return cveMatch[0].toUpperCase();
    }

    // Extract CWE ID if present
    const cweMatch = url.match(/CWE-\d+/i);
    if (cweMatch) {
      return cweMatch[0].toUpperCase();
    }

    // For GitHub, extract repo name
    if (hostname.includes('github.com')) {
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2) {
        return `${pathParts[0]}/${pathParts[1]}`;
      }
    }

    // For most URLs, use the last meaningful path segment
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      // Clean up the last part
      const cleaned = lastPart
        .replace(/\.(html?|php|aspx?|jsp)$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2');
      if (cleaned.length > 3 && cleaned.length < 60) {
        return `${hostname}: ${cleaned}`;
      }
    }

    return hostname;
  } catch {
    // If URL parsing fails, return a truncated version
    return url.length > 50 ? url.slice(0, 47) + '...' : url;
  }
}

/**
 * Categorize an array of reference URLs
 */
export function categorizeReferences(references: string[]): ReferenceLink[] {
  return references.map(url => ({
    url,
    type: categorizeReference(url),
    title: extractTitleFromUrl(url),
  }));
}

/**
 * Group references by category
 */
export function groupReferencesByCategory(
  references: ReferenceLink[]
): Record<ReferenceLinkType, ReferenceLink[]> {
  const grouped: Record<ReferenceLinkType, ReferenceLink[]> = {
    cve: [],
    cwe: [],
    nvd: [],
    exploit: [],
    advisory: [],
    patch: [],
    documentation: [],
    github: [],
    other: [],
  };

  for (const ref of references) {
    grouped[ref.type].push(ref);
  }

  return grouped;
}

/**
 * Get non-empty categories from grouped references
 */
export function getNonEmptyCategories(
  grouped: Record<ReferenceLinkType, ReferenceLink[]>
): ReferenceLinkType[] {
  return (Object.keys(grouped) as ReferenceLinkType[]).filter(
    type => grouped[type].length > 0
  );
}

/**
 * Extract CVE IDs from references or text
 */
export function extractCVEIds(text: string): string[] {
  const matches = text.match(/CVE-\d{4}-\d+/gi) || [];
  return [...new Set(matches.map(m => m.toUpperCase()))];
}

/**
 * Extract CWE IDs from references or text
 */
export function extractCWEIds(text: string): string[] {
  const matches = text.match(/CWE-\d+/gi) || [];
  return [...new Set(matches.map(m => m.toUpperCase()))];
}
