import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { Severity } from '@/types/nuclei';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

// Map severity to badge variant, handling 'unknown' case
const severityToVariant: Record<Severity, BadgeProps['variant']> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
  info: 'info',
  unknown: 'secondary',
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <Badge variant={severityToVariant[severity]} className={className}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
}
