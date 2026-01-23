import type { Severity, KEVEntry, EnrichedCVEDetails } from '@/types/nuclei';

export type UrgencyLevel = 'immediate' | 'urgent' | 'standard' | 'routine' | 'none';

export interface DueDateRecommendation {
  recommendedDate: Date;
  daysFromNow: number;
  urgencyLevel: UrgencyLevel;
  reasoning: string;
  factors: string[];
}

// Default remediation windows by severity (in days)
const severityDays: Record<Severity, number> = {
  critical: 7,
  high: 14,
  medium: 30,
  low: 90,
  info: 0, // No deadline for info
  unknown: 30,
};

// Urgency level descriptions
const urgencyDescriptions: Record<UrgencyLevel, string> = {
  immediate: 'Requires immediate action (within 72 hours)',
  urgent: 'High priority - address within 7 days',
  standard: 'Normal priority - follow standard SLA',
  routine: 'Low priority - address when convenient',
  none: 'Informational - no remediation deadline',
};

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get urgency level from days
 */
function getUrgencyFromDays(days: number): UrgencyLevel {
  if (days <= 0) return 'none';
  if (days <= 3) return 'immediate';
  if (days <= 7) return 'urgent';
  if (days <= 30) return 'standard';
  return 'routine';
}

/**
 * Calculate recommended due date based on finding characteristics
 */
export function calculateDueDate(options: {
  severity: Severity;
  kevEntry?: KEVEntry | null;
  cveDetails?: EnrichedCVEDetails | null;
  isInternetFacing?: boolean;
}): DueDateRecommendation {
  const { severity, kevEntry, cveDetails, isInternetFacing } = options;
  const factors: string[] = [];
  let daysFromNow: number;

  // Start with severity-based baseline
  daysFromNow = severityDays[severity];
  factors.push(`Base: ${severity} severity (${daysFromNow} days)`);

  // CISA KEV takes highest priority
  if (kevEntry) {
    const kevDueDate = new Date(kevEntry.dueDate);
    const now = new Date();
    const kevDaysLeft = Math.ceil((kevDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (kevDaysLeft > 0) {
      // Use KEV due date if it's in the future
      daysFromNow = Math.min(daysFromNow, kevDaysLeft);
      factors.push(`CISA KEV due date: ${kevEntry.dueDate}`);
    } else {
      // KEV already overdue - immediate action required
      daysFromNow = 3;
      factors.push('CISA KEV: OVERDUE - immediate action required');
    }

    // Ransomware usage accelerates timeline
    if (kevEntry.knownRansomwareCampaignUse === 'Known') {
      daysFromNow = Math.min(daysFromNow, 3);
      factors.push('Known ransomware campaign use');
    }
  }

  // CVE details can accelerate timeline
  if (cveDetails) {
    // CVSS score
    if (cveDetails.cvss) {
      const cvssScore = cveDetails.cvss.score;
      if (cvssScore >= 9.0 && daysFromNow > 7) {
        daysFromNow = Math.min(daysFromNow, 7);
        factors.push(`CVSS ${cvssScore}: Critical score acceleration`);
      } else if (cvssScore >= 7.0 && daysFromNow > 14) {
        daysFromNow = Math.min(daysFromNow, 14);
        factors.push(`CVSS ${cvssScore}: High score acceleration`);
      }
    }

    // Known exploit availability
    if (cveDetails.exploitAvailable) {
      daysFromNow = Math.floor(daysFromNow * 0.5); // Cut in half
      factors.push('Known exploit available - timeline reduced by 50%');
    }
  }

  // Internet-facing assets
  if (isInternetFacing && severity !== 'info') {
    daysFromNow = Math.floor(daysFromNow * 0.75); // Reduce by 25%
    factors.push('Internet-facing asset - timeline reduced by 25%');
  }

  // Minimum bounds
  if (severity === 'info') {
    daysFromNow = 0; // No deadline for info
  } else if (severity === 'critical' && daysFromNow > 7) {
    daysFromNow = 7; // Critical should never exceed 7 days
    factors.push('Critical severity cap: 7 days maximum');
  } else if (daysFromNow < 1) {
    daysFromNow = 1; // Minimum 1 day for non-info
  }

  const urgencyLevel = getUrgencyFromDays(daysFromNow);
  const recommendedDate = addDays(new Date(), daysFromNow);

  return {
    recommendedDate,
    daysFromNow,
    urgencyLevel,
    reasoning: urgencyDescriptions[urgencyLevel],
    factors,
  };
}

/**
 * Get a human-readable urgency label
 */
export function getUrgencyLabel(level: UrgencyLevel): string {
  const labels: Record<UrgencyLevel, string> = {
    immediate: 'Immediate',
    urgent: 'Urgent',
    standard: 'Standard',
    routine: 'Routine',
    none: 'None',
  };
  return labels[level];
}

/**
 * Get urgency badge color class
 */
export function getUrgencyColor(level: UrgencyLevel): string {
  const colors: Record<UrgencyLevel, string> = {
    immediate: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400',
    urgent: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400',
    standard: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400',
    routine: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400',
    none: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-400',
  };
  return colors[level];
}

/**
 * Calculate days until due date (negative if overdue)
 */
export function getDaysUntilDue(targetDate: string | Date): number {
  const due = new Date(targetDate);
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check if a target date is overdue
 */
export function isOverdue(targetDate: string | Date): boolean {
  return getDaysUntilDue(targetDate) < 0;
}

/**
 * Format due date for display
 */
export function formatDueDate(targetDate: string | Date): string {
  const date = new Date(targetDate);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get relative time description (e.g., "2 days left", "3 days overdue")
 */
export function getRelativeTimeDescription(targetDate: string | Date): string {
  const days = getDaysUntilDue(targetDate);

  if (days === 0) return 'Due today';
  if (days === 1) return '1 day left';
  if (days > 1) return `${days} days left`;
  if (days === -1) return '1 day overdue';
  return `${Math.abs(days)} days overdue`;
}
