import type { NucleiFinding, Scan, ScanComparisonResult, Severity } from '@/types/nuclei';

/**
 * Generate a unique key for a finding to enable comparison
 * Uses template ID + host as the primary key
 */
function getFindingKey(finding: NucleiFinding): string {
  return `${finding.templateId}::${finding.host}`;
}

/**
 * Compare two sets of findings and return the comparison result
 */
export function compareScanFindings(
  baseFindings: NucleiFinding[],
  compareFindings: NucleiFinding[]
): ScanComparisonResult {
  // Create maps for efficient lookup
  const baseMap = new Map<string, NucleiFinding>();
  const compareMap = new Map<string, NucleiFinding>();

  for (const finding of baseFindings) {
    const key = getFindingKey(finding);
    // If duplicate key, keep the one with higher severity
    const existing = baseMap.get(key);
    if (!existing || getSeverityWeight(finding.info.severity) > getSeverityWeight(existing.info.severity)) {
      baseMap.set(key, finding);
    }
  }

  for (const finding of compareFindings) {
    const key = getFindingKey(finding);
    const existing = compareMap.get(key);
    if (!existing || getSeverityWeight(finding.info.severity) > getSeverityWeight(existing.info.severity)) {
      compareMap.set(key, finding);
    }
  }

  // Find new findings (in compare but not in base)
  const newFindings: NucleiFinding[] = [];
  for (const [key, finding] of compareMap) {
    if (!baseMap.has(key)) {
      newFindings.push(finding);
    }
  }

  // Find resolved findings (in base but not in compare)
  const resolvedFindings: NucleiFinding[] = [];
  for (const [key, finding] of baseMap) {
    if (!compareMap.has(key)) {
      resolvedFindings.push(finding);
    }
  }

  // Find persisted findings (in both)
  const persistedFindings: NucleiFinding[] = [];
  for (const [key, finding] of compareMap) {
    if (baseMap.has(key)) {
      persistedFindings.push(finding);
    }
  }

  // Sort all arrays by severity
  const sortBySeverity = (a: NucleiFinding, b: NucleiFinding) =>
    getSeverityWeight(b.info.severity) - getSeverityWeight(a.info.severity);

  newFindings.sort(sortBySeverity);
  resolvedFindings.sort(sortBySeverity);
  persistedFindings.sort(sortBySeverity);

  // Calculate trend
  const newCriticalHigh = newFindings.filter(
    f => f.info.severity === 'critical' || f.info.severity === 'high'
  ).length;
  const resolvedCriticalHigh = resolvedFindings.filter(
    f => f.info.severity === 'critical' || f.info.severity === 'high'
  ).length;

  let trend: 'improved' | 'degraded' | 'stable';
  if (resolvedCriticalHigh > newCriticalHigh && resolvedFindings.length > newFindings.length) {
    trend = 'improved';
  } else if (newCriticalHigh > resolvedCriticalHigh || newFindings.length > resolvedFindings.length * 1.5) {
    trend = 'degraded';
  } else {
    trend = 'stable';
  }

  return {
    newFindings,
    resolvedFindings,
    persistedFindings,
    statistics: {
      newCount: newFindings.length,
      resolvedCount: resolvedFindings.length,
      persistedCount: persistedFindings.length,
      trend,
    },
  };
}

/**
 * Get severity weight for comparison (higher = more severe)
 */
function getSeverityWeight(severity: Severity): number {
  switch (severity) {
    case 'critical':
      return 5;
    case 'high':
      return 4;
    case 'medium':
      return 3;
    case 'low':
      return 2;
    case 'info':
      return 1;
    default:
      return 0;
  }
}

/**
 * Calculate severity breakdown for a list of findings
 */
export function calculateSeverityBreakdown(findings: NucleiFinding[]): Record<Severity, number> {
  const breakdown: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    unknown: 0,
  };

  for (const finding of findings) {
    const severity = finding.info.severity || 'unknown';
    breakdown[severity]++;
  }

  return breakdown;
}

/**
 * Create a scan object from findings and file info
 */
export function createScan(
  projectId: string,
  name: string,
  findings: NucleiFinding[],
  uploadedFileIds: string[],
  description?: string
): Scan {
  const uniqueHosts = new Set(findings.map(f => f.host));

  return {
    id: crypto.randomUUID(),
    projectId,
    name,
    description,
    createdAt: new Date().toISOString(),
    findingsCount: findings.length,
    uploadedFileIds,
    hostCount: uniqueHosts.size,
    severityBreakdown: calculateSeverityBreakdown(findings),
  };
}

/**
 * Get findings for a specific scan by filtering by sourceFile
 */
export function getFindingsForScan(
  allFindings: NucleiFinding[],
  scan: Scan
): NucleiFinding[] {
  const fileIds = new Set(scan.uploadedFileIds);
  return allFindings.filter(f => f.sourceFile && fileIds.has(f.sourceFile));
}
