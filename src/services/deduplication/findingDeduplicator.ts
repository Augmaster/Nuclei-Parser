import type { NucleiFinding, Severity } from '@/types/nuclei';
import { extractCVEIds, extractCWEIds } from '@/services/enrichment/referenceCategorizer';

/**
 * Grouping strategies for deduplication
 */
export type DeduplicationStrategy =
  | 'exact'           // Same templateId + host + matchedAt (true duplicates)
  | 'template-host'   // Same templateId + host (same vuln on same host)
  | 'template'        // Same templateId (same vuln across hosts)
  | 'cve'             // Same CVE ID
  | 'cwe';            // Same CWE ID

/**
 * A group of similar/duplicate findings
 */
export interface FindingGroup {
  id: string;
  key: string;
  strategy: DeduplicationStrategy;
  findings: NucleiFinding[];
  primaryFinding: NucleiFinding;
  count: number;
  uniqueHosts: string[];
  highestSeverity: Severity;
  metadata: {
    cveIds?: string[];
    cweIds?: string[];
    templateId?: string;
  };
}

/**
 * Deduplication result
 */
export interface DeduplicationResult {
  groups: FindingGroup[];
  totalFindings: number;
  uniqueGroups: number;
  duplicatesFound: number;
  strategy: DeduplicationStrategy;
}

/**
 * Generate a unique key for a finding based on strategy
 */
function getGroupKey(finding: NucleiFinding, strategy: DeduplicationStrategy): string | null {
  switch (strategy) {
    case 'exact':
      return `${finding.templateId}|${finding.host}|${finding.matchedAt}`;

    case 'template-host':
      return `${finding.templateId}|${finding.host}`;

    case 'template':
      return finding.templateId;

    case 'cve': {
      const allText = [...finding.info.reference, ...finding.info.tags, finding.templateId].join(' ');
      const cveIds = extractCVEIds(allText);
      return cveIds.length > 0 ? cveIds.sort().join(',') : null;
    }

    case 'cwe': {
      const allText = [...finding.info.reference, ...finding.info.tags, finding.templateId].join(' ');
      const cweIds = extractCWEIds(allText);
      return cweIds.length > 0 ? cweIds.sort().join(',') : null;
    }

    default:
      return finding.id;
  }
}

/**
 * Get the highest severity from a list of findings
 */
function getHighestSeverity(findings: NucleiFinding[]): Severity {
  const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low', 'info', 'unknown'];

  let highest: Severity = 'unknown';
  let highestIndex = severityOrder.length - 1;

  for (const finding of findings) {
    const index = severityOrder.indexOf(finding.info.severity);
    if (index < highestIndex) {
      highestIndex = index;
      highest = finding.info.severity;
    }
  }

  return highest;
}

/**
 * Select the best primary finding from a group
 * Prefers: highest severity, most references, most recent
 */
function selectPrimaryFinding(findings: NucleiFinding[]): NucleiFinding {
  if (findings.length === 1) return findings[0];

  const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low', 'info', 'unknown'];

  return [...findings].sort((a, b) => {
    // First by severity (higher is better)
    const sevA = severityOrder.indexOf(a.info.severity);
    const sevB = severityOrder.indexOf(b.info.severity);
    if (sevA !== sevB) return sevA - sevB;

    // Then by number of references (more is better)
    const refsA = a.info.reference.length;
    const refsB = b.info.reference.length;
    if (refsA !== refsB) return refsB - refsA;

    // Then by timestamp (more recent is better)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  })[0];
}

/**
 * Group findings by the specified deduplication strategy
 */
export function groupFindings(
  findings: NucleiFinding[],
  strategy: DeduplicationStrategy
): DeduplicationResult {
  const groupMap = new Map<string, NucleiFinding[]>();
  const ungrouped: NucleiFinding[] = [];

  // Group findings by key
  for (const finding of findings) {
    const key = getGroupKey(finding, strategy);

    if (key === null) {
      // Can't group this finding with current strategy
      ungrouped.push(finding);
      continue;
    }

    const existing = groupMap.get(key);
    if (existing) {
      existing.push(finding);
    } else {
      groupMap.set(key, [finding]);
    }
  }

  // Create FindingGroup objects
  const groups: FindingGroup[] = [];

  for (const [key, groupFindings] of groupMap.entries()) {
    const primaryFinding = selectPrimaryFinding(groupFindings);
    const uniqueHosts = [...new Set(groupFindings.map((f) => f.host))];

    // Extract CVE/CWE IDs for metadata
    const allText = groupFindings
      .flatMap((f) => [...f.info.reference, ...f.info.tags, f.templateId])
      .join(' ');
    const cveIds = extractCVEIds(allText);
    const cweIds = extractCWEIds(allText);

    groups.push({
      id: `group-${key.replace(/[^a-zA-Z0-9]/g, '-')}`,
      key,
      strategy,
      findings: groupFindings,
      primaryFinding,
      count: groupFindings.length,
      uniqueHosts,
      highestSeverity: getHighestSeverity(groupFindings),
      metadata: {
        cveIds: cveIds.length > 0 ? cveIds : undefined,
        cweIds: cweIds.length > 0 ? cweIds : undefined,
        templateId: groupFindings[0]?.templateId,
      },
    });
  }

  // Add ungrouped findings as single-item groups
  for (const finding of ungrouped) {
    groups.push({
      id: `single-${finding.id}`,
      key: finding.id,
      strategy,
      findings: [finding],
      primaryFinding: finding,
      count: 1,
      uniqueHosts: [finding.host],
      highestSeverity: finding.info.severity,
      metadata: {
        templateId: finding.templateId,
      },
    });
  }

  // Sort groups by severity and count
  const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low', 'info', 'unknown'];
  groups.sort((a, b) => {
    const sevA = severityOrder.indexOf(a.highestSeverity);
    const sevB = severityOrder.indexOf(b.highestSeverity);
    if (sevA !== sevB) return sevA - sevB;
    return b.count - a.count;
  });

  const duplicatesFound = findings.length - groups.length;

  return {
    groups,
    totalFindings: findings.length,
    uniqueGroups: groups.length,
    duplicatesFound: duplicatesFound > 0 ? duplicatesFound : 0,
    strategy,
  };
}

/**
 * Find exact duplicates (same templateId + host + matchedAt)
 */
export function findExactDuplicates(findings: NucleiFinding[]): FindingGroup[] {
  const result = groupFindings(findings, 'exact');
  return result.groups.filter((g) => g.count > 1);
}

/**
 * Detect potential duplicates with different strategies
 */
export function detectDuplicates(
  findings: NucleiFinding[]
): Map<DeduplicationStrategy, DeduplicationResult> {
  const strategies: DeduplicationStrategy[] = [
    'exact',
    'template-host',
    'template',
    'cve',
    'cwe',
  ];

  const results = new Map<DeduplicationStrategy, DeduplicationResult>();

  for (const strategy of strategies) {
    results.set(strategy, groupFindings(findings, strategy));
  }

  return results;
}

/**
 * Get deduplication summary stats
 */
export function getDeduplicationStats(findings: NucleiFinding[]): {
  exact: number;
  byTemplateHost: number;
  byTemplate: number;
  byCVE: number;
  byCWE: number;
} {
  const results = detectDuplicates(findings);

  return {
    exact: results.get('exact')?.duplicatesFound || 0,
    byTemplateHost: results.get('template-host')?.duplicatesFound || 0,
    byTemplate: results.get('template')?.duplicatesFound || 0,
    byCVE: results.get('cve')?.duplicatesFound || 0,
    byCWE: results.get('cwe')?.duplicatesFound || 0,
  };
}

/**
 * Merge duplicate findings, keeping the best one
 */
export function mergeDuplicates(
  findings: NucleiFinding[],
  strategy: DeduplicationStrategy = 'exact'
): NucleiFinding[] {
  const result = groupFindings(findings, strategy);
  return result.groups.map((g) => g.primaryFinding);
}

/**
 * Get duplicate candidates for a specific finding
 */
export function getDuplicatesFor(
  finding: NucleiFinding,
  allFindings: NucleiFinding[],
  strategy: DeduplicationStrategy = 'template-host'
): NucleiFinding[] {
  const targetKey = getGroupKey(finding, strategy);
  if (!targetKey) return [];

  return allFindings.filter((f) => {
    if (f.id === finding.id) return false;
    const key = getGroupKey(f, strategy);
    return key === targetKey;
  });
}

/**
 * Calculate similarity score between two findings
 * Returns 0-100
 */
export function calculateSimilarity(a: NucleiFinding, b: NucleiFinding): number {
  let score = 0;
  let maxScore = 0;

  // Same template ID (40 points)
  maxScore += 40;
  if (a.templateId === b.templateId) score += 40;

  // Same host (25 points)
  maxScore += 25;
  if (a.host === b.host) score += 25;

  // Same severity (10 points)
  maxScore += 10;
  if (a.info.severity === b.info.severity) score += 10;

  // Same type (5 points)
  maxScore += 5;
  if (a.type === b.type) score += 5;

  // Overlapping tags (10 points)
  maxScore += 10;
  const tagsA = new Set(a.info.tags);
  const tagsB = new Set(b.info.tags);
  const commonTags = [...tagsA].filter((t) => tagsB.has(t));
  if (tagsA.size > 0 || tagsB.size > 0) {
    const overlap = commonTags.length / Math.max(tagsA.size, tagsB.size);
    score += Math.round(overlap * 10);
  }

  // Same CVE (10 points)
  maxScore += 10;
  const allTextA = [...a.info.reference, ...a.info.tags, a.templateId].join(' ');
  const allTextB = [...b.info.reference, ...b.info.tags, b.templateId].join(' ');
  const cvesA = new Set(extractCVEIds(allTextA));
  const cvesB = new Set(extractCVEIds(allTextB));
  if (cvesA.size > 0 && cvesB.size > 0) {
    const commonCVEs = [...cvesA].filter((c) => cvesB.has(c));
    if (commonCVEs.length > 0) score += 10;
  }

  return Math.round((score / maxScore) * 100);
}
