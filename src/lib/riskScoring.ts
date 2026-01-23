import type { NucleiFinding, Severity } from '@/types/nuclei';

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'minimal';

export interface HostRiskData {
  host: string;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  totalFindings: number;
  severityBreakdown: Record<Severity, number>;
  topFindings: NucleiFinding[]; // Top 3 by severity
}

// Severity weights for risk calculation
const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 40,
  high: 25,
  medium: 15,
  low: 5,
  info: 1,
  unknown: 2,
};

// Risk level thresholds
const RISK_THRESHOLDS = {
  critical: 70,
  high: 50,
  medium: 30,
  low: 15,
};

// Severity order for sorting (most severe first)
const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
  unknown: 5,
};

/**
 * Calculate risk score for a set of findings
 * Score is normalized to 0-100 based on severity weights
 */
export function calculateRiskScore(findings: NucleiFinding[]): number {
  if (findings.length === 0) return 0;

  // Calculate weighted sum
  const weightedSum = findings.reduce((sum, finding) => {
    const severity = finding.info.severity || 'unknown';
    return sum + SEVERITY_WEIGHTS[severity];
  }, 0);

  // Max possible score would be if all findings were critical
  const maxPossibleScore = findings.length * SEVERITY_WEIGHTS.critical;

  // Normalize to 0-100
  const normalizedScore = (weightedSum / maxPossibleScore) * 100;

  // Apply diminishing returns for large numbers of findings
  // This prevents scores from being too low when there are many low-severity findings
  const adjustedScore = Math.min(100, normalizedScore * (1 + Math.log10(findings.length) * 0.1));

  return Math.round(adjustedScore);
}

/**
 * Get risk level from score
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.critical) return 'critical';
  if (score >= RISK_THRESHOLDS.high) return 'high';
  if (score >= RISK_THRESHOLDS.medium) return 'medium';
  if (score >= RISK_THRESHOLDS.low) return 'low';
  return 'minimal';
}

/**
 * Get color for risk level (for UI)
 */
export function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'critical':
      return 'text-red-600 dark:text-red-400';
    case 'high':
      return 'text-orange-600 dark:text-orange-400';
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'low':
      return 'text-blue-600 dark:text-blue-400';
    case 'minimal':
      return 'text-green-600 dark:text-green-400';
  }
}

/**
 * Get background color for risk level
 */
export function getRiskLevelBgColor(level: RiskLevel): string {
  switch (level) {
    case 'critical':
      return 'bg-red-500/10 border-red-500/30';
    case 'high':
      return 'bg-orange-500/10 border-orange-500/30';
    case 'medium':
      return 'bg-yellow-500/10 border-yellow-500/30';
    case 'low':
      return 'bg-blue-500/10 border-blue-500/30';
    case 'minimal':
      return 'bg-green-500/10 border-green-500/30';
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
 * Get top N findings sorted by severity
 */
export function getTopFindings(findings: NucleiFinding[], limit = 3): NucleiFinding[] {
  return [...findings]
    .sort((a, b) => {
      const severityDiff = SEVERITY_ORDER[a.info.severity] - SEVERITY_ORDER[b.info.severity];
      if (severityDiff !== 0) return severityDiff;
      // Secondary sort by timestamp (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    })
    .slice(0, limit);
}

/**
 * Calculate host risk data from findings
 */
export function calculateHostRisk(host: string, findings: NucleiFinding[]): HostRiskData {
  const riskScore = calculateRiskScore(findings);
  return {
    host,
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    totalFindings: findings.length,
    severityBreakdown: calculateSeverityBreakdown(findings),
    topFindings: getTopFindings(findings),
  };
}

/**
 * Calculate risk data for all hosts from a list of findings
 */
export function calculateAllHostRisks(findings: NucleiFinding[]): HostRiskData[] {
  // Group findings by host
  const byHost = new Map<string, NucleiFinding[]>();
  for (const finding of findings) {
    const hostFindings = byHost.get(finding.host) || [];
    hostFindings.push(finding);
    byHost.set(finding.host, hostFindings);
  }

  // Calculate risk for each host
  const hostRisks: HostRiskData[] = [];
  for (const [host, hostFindings] of byHost) {
    hostRisks.push(calculateHostRisk(host, hostFindings));
  }

  // Sort by risk score (highest first)
  return hostRisks.sort((a, b) => {
    // Primary sort by risk score
    if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
    // Secondary sort by critical count
    if (b.severityBreakdown.critical !== a.severityBreakdown.critical) {
      return b.severityBreakdown.critical - a.severityBreakdown.critical;
    }
    // Tertiary sort by high count
    if (b.severityBreakdown.high !== a.severityBreakdown.high) {
      return b.severityBreakdown.high - a.severityBreakdown.high;
    }
    // Finally by total findings
    return b.totalFindings - a.totalFindings;
  });
}

/**
 * Get risk summary stats
 */
export function getRiskSummaryStats(hostRisks: HostRiskData[]): {
  criticalRiskHosts: number;
  highRiskHosts: number;
  mediumRiskHosts: number;
  lowRiskHosts: number;
  minimalRiskHosts: number;
  averageRiskScore: number;
} {
  const counts = {
    criticalRiskHosts: 0,
    highRiskHosts: 0,
    mediumRiskHosts: 0,
    lowRiskHosts: 0,
    minimalRiskHosts: 0,
  };

  let totalScore = 0;

  for (const host of hostRisks) {
    totalScore += host.riskScore;
    switch (host.riskLevel) {
      case 'critical':
        counts.criticalRiskHosts++;
        break;
      case 'high':
        counts.highRiskHosts++;
        break;
      case 'medium':
        counts.mediumRiskHosts++;
        break;
      case 'low':
        counts.lowRiskHosts++;
        break;
      case 'minimal':
        counts.minimalRiskHosts++;
        break;
    }
  }

  return {
    ...counts,
    averageRiskScore: hostRisks.length > 0 ? Math.round(totalScore / hostRisks.length) : 0,
  };
}
