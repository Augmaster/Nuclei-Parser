import type { NucleiFinding, Severity, EnrichedCVEDetails, KEVEntry } from '@/types/nuclei';

export interface PrioritizationFactors {
  baseSeverityScore: number;
  cvssBoost: number;
  kevBoost: number;
  exploitBoost: number;
  internetFacingBoost: number;
}

export interface PrioritizedFinding {
  finding: NucleiFinding;
  riskScore: number;
  factors: PrioritizationFactors;
  priorityRank: number;
  priorityLabel: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
}

// Base severity scores (0-40 points)
const severityScores: Record<Severity, number> = {
  critical: 40,
  high: 30,
  medium: 20,
  low: 10,
  info: 0,
  unknown: 15,
};

// Priority label thresholds
function getPriorityLabel(score: number): PrioritizedFinding['priorityLabel'] {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Low';
  return 'Informational';
}

/**
 * Calculate risk score for a single finding
 */
export function calculateRiskScore(
  finding: NucleiFinding,
  options?: {
    cveDetails?: EnrichedCVEDetails | null;
    kevEntry?: KEVEntry | null;
    isInternetFacing?: boolean;
  }
): { score: number; factors: PrioritizationFactors } {
  const { cveDetails, kevEntry, isInternetFacing } = options || {};

  const factors: PrioritizationFactors = {
    baseSeverityScore: 0,
    cvssBoost: 0,
    kevBoost: 0,
    exploitBoost: 0,
    internetFacingBoost: 0,
  };

  // Base severity score (0-40 points)
  factors.baseSeverityScore = severityScores[finding.info.severity];

  // CVSS boost (0-20 points)
  if (cveDetails?.cvss) {
    const cvssScore = cveDetails.cvss.score;
    // Scale CVSS (0-10) to boost (0-20)
    factors.cvssBoost = Math.round(cvssScore * 2);
  }

  // KEV presence (20 points)
  if (kevEntry) {
    factors.kevBoost = 20;

    // Extra boost for ransomware usage
    if (kevEntry.knownRansomwareCampaignUse === 'Known') {
      factors.kevBoost = 25; // Slightly higher
    }
  }

  // Known exploit availability (15 points)
  if (cveDetails?.exploitAvailable) {
    factors.exploitBoost = 15;
  }

  // Internet-facing asset (5 points)
  if (isInternetFacing) {
    factors.internetFacingBoost = 5;
  }

  // Calculate total score (capped at 100)
  const totalScore = Math.min(
    100,
    factors.baseSeverityScore +
    factors.cvssBoost +
    factors.kevBoost +
    factors.exploitBoost +
    factors.internetFacingBoost
  );

  return { score: totalScore, factors };
}

/**
 * Prioritize a list of findings by risk score
 */
export function prioritizeFindings(
  findings: NucleiFinding[],
  enrichmentData?: Map<string, { cveDetails?: EnrichedCVEDetails; kevEntry?: KEVEntry }>
): PrioritizedFinding[] {
  // Calculate scores for all findings
  const scoredFindings = findings.map(finding => {
    const enrichment = enrichmentData?.get(finding.id);
    const { score, factors } = calculateRiskScore(finding, {
      cveDetails: enrichment?.cveDetails,
      kevEntry: enrichment?.kevEntry,
      isInternetFacing: finding.host?.startsWith('http'), // Simple heuristic
    });

    return {
      finding,
      riskScore: score,
      factors,
      priorityRank: 0, // Will be set after sorting
      priorityLabel: getPriorityLabel(score),
    };
  });

  // Sort by risk score (descending)
  scoredFindings.sort((a, b) => b.riskScore - a.riskScore);

  // Assign priority ranks
  scoredFindings.forEach((item, index) => {
    item.priorityRank = index + 1;
  });

  return scoredFindings;
}

/**
 * Get summary statistics for prioritized findings
 */
export function getPrioritizationStats(prioritizedFindings: PrioritizedFinding[]): {
  total: number;
  byPriority: Record<PrioritizedFinding['priorityLabel'], number>;
  avgScore: number;
  highestScore: number;
  lowestScore: number;
  withKEV: number;
  withExploit: number;
} {
  const stats = {
    total: prioritizedFindings.length,
    byPriority: {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
      Informational: 0,
    },
    avgScore: 0,
    highestScore: 0,
    lowestScore: 100,
    withKEV: 0,
    withExploit: 0,
  };

  if (prioritizedFindings.length === 0) {
    stats.lowestScore = 0;
    return stats;
  }

  let totalScore = 0;

  for (const item of prioritizedFindings) {
    stats.byPriority[item.priorityLabel]++;
    totalScore += item.riskScore;

    if (item.riskScore > stats.highestScore) {
      stats.highestScore = item.riskScore;
    }
    if (item.riskScore < stats.lowestScore) {
      stats.lowestScore = item.riskScore;
    }

    if (item.factors.kevBoost > 0) {
      stats.withKEV++;
    }
    if (item.factors.exploitBoost > 0) {
      stats.withExploit++;
    }
  }

  stats.avgScore = Math.round(totalScore / prioritizedFindings.length);

  return stats;
}

/**
 * Filter findings by minimum risk score
 */
export function filterByRiskScore(
  prioritizedFindings: PrioritizedFinding[],
  minScore: number
): PrioritizedFinding[] {
  return prioritizedFindings.filter(f => f.riskScore >= minScore);
}

/**
 * Filter findings by priority label
 */
export function filterByPriority(
  prioritizedFindings: PrioritizedFinding[],
  priorities: PrioritizedFinding['priorityLabel'][]
): PrioritizedFinding[] {
  return prioritizedFindings.filter(f => priorities.includes(f.priorityLabel));
}

/**
 * Get findings that have KEV entries
 */
export function getKEVFindings(prioritizedFindings: PrioritizedFinding[]): PrioritizedFinding[] {
  return prioritizedFindings.filter(f => f.factors.kevBoost > 0);
}

/**
 * Get findings that have known exploits
 */
export function getExploitableFindings(prioritizedFindings: PrioritizedFinding[]): PrioritizedFinding[] {
  return prioritizedFindings.filter(f => f.factors.exploitBoost > 0);
}

/**
 * Get the top N highest priority findings
 */
export function getTopPriorityFindings(
  prioritizedFindings: PrioritizedFinding[],
  count: number
): PrioritizedFinding[] {
  return prioritizedFindings.slice(0, count);
}

/**
 * Group findings by priority label
 */
export function groupByPriority(
  prioritizedFindings: PrioritizedFinding[]
): Record<PrioritizedFinding['priorityLabel'], PrioritizedFinding[]> {
  const groups: Record<PrioritizedFinding['priorityLabel'], PrioritizedFinding[]> = {
    Critical: [],
    High: [],
    Medium: [],
    Low: [],
    Informational: [],
  };

  for (const finding of prioritizedFindings) {
    groups[finding.priorityLabel].push(finding);
  }

  return groups;
}
