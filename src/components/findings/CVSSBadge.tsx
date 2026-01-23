import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CVSSInfo } from '@/types/nuclei';

interface CVSSBadgeProps {
  cvss: CVSSInfo;
  showVersion?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface SeverityConfig {
  label: string;
  bgClass: string;
  textClass: string;
  ringClass: string;
}

function getSeverityConfig(score: number): SeverityConfig {
  if (score >= 9.0) {
    return {
      label: 'Critical',
      bgClass: 'bg-red-600 hover:bg-red-700',
      textClass: 'text-white',
      ringClass: 'ring-red-600/30',
    };
  }
  if (score >= 7.0) {
    return {
      label: 'High',
      bgClass: 'bg-orange-500 hover:bg-orange-600',
      textClass: 'text-white',
      ringClass: 'ring-orange-500/30',
    };
  }
  if (score >= 4.0) {
    return {
      label: 'Medium',
      bgClass: 'bg-yellow-500 hover:bg-yellow-600',
      textClass: 'text-black',
      ringClass: 'ring-yellow-500/30',
    };
  }
  if (score >= 0.1) {
    return {
      label: 'Low',
      bgClass: 'bg-blue-500 hover:bg-blue-600',
      textClass: 'text-white',
      ringClass: 'ring-blue-500/30',
    };
  }
  return {
    label: 'None',
    bgClass: 'bg-gray-500 hover:bg-gray-600',
    textClass: 'text-white',
    ringClass: 'ring-gray-500/30',
  };
}

// CVSS v3.x vector descriptions
const cvss3Metrics: Record<string, Record<string, string>> = {
  AV: {
    N: 'Network',
    A: 'Adjacent',
    L: 'Local',
    P: 'Physical',
  },
  AC: {
    L: 'Low',
    H: 'High',
  },
  PR: {
    N: 'None',
    L: 'Low',
    H: 'High',
  },
  UI: {
    N: 'None',
    R: 'Required',
  },
  S: {
    U: 'Unchanged',
    C: 'Changed',
  },
  C: {
    N: 'None',
    L: 'Low',
    H: 'High',
  },
  I: {
    N: 'None',
    L: 'Low',
    H: 'High',
  },
  A: {
    N: 'None',
    L: 'Low',
    H: 'High',
  },
};

function parseVector(vector: string): Record<string, string> {
  const parts = vector.split('/');
  const result: Record<string, string> = {};

  for (const part of parts) {
    const [key, value] = part.split(':');
    if (key && value) {
      result[key] = value;
    }
  }

  return result;
}

function formatVectorForTooltip(vector: string): string[] {
  const parsed = parseVector(vector);
  const lines: string[] = [];

  const metricLabels: Record<string, string> = {
    AV: 'Attack Vector',
    AC: 'Attack Complexity',
    PR: 'Privileges Required',
    UI: 'User Interaction',
    S: 'Scope',
    C: 'Confidentiality',
    I: 'Integrity',
    A: 'Availability',
  };

  for (const [key, value] of Object.entries(parsed)) {
    if (metricLabels[key] && cvss3Metrics[key]?.[value]) {
      lines.push(`${metricLabels[key]}: ${cvss3Metrics[key][value]}`);
    }
  }

  return lines;
}

export function CVSSBadge({
  cvss,
  showVersion = true,
  size = 'md',
  className,
}: CVSSBadgeProps) {
  const config = getSeverityConfig(cvss.score);
  const vectorLines = formatVectorForTooltip(cvss.vector);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-2.5 py-1',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={cn(
              config.bgClass,
              config.textClass,
              sizeClasses[size],
              'font-semibold cursor-help ring-2',
              config.ringClass,
              className
            )}
          >
            {showVersion && `CVSS ${cvss.version}: `}
            {cvss.score.toFixed(1)} ({config.label})
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-semibold">
              CVSS {cvss.version} Score: {cvss.score.toFixed(1)}
            </div>
            {vectorLines.length > 0 && (
              <div className="text-xs space-y-0.5">
                {vectorLines.map((line, i) => (
                  <div key={i} className="text-muted-foreground">
                    {line}
                  </div>
                ))}
              </div>
            )}
            <div className="text-xs font-mono text-muted-foreground pt-1 border-t">
              {cvss.vector}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact version for tables/lists
export function CVSSScoreBadge({
  score,
  size = 'sm',
  className,
}: {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const config = getSeverityConfig(score);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-2.5 py-1',
  };

  return (
    <Badge
      className={cn(
        config.bgClass,
        config.textClass,
        sizeClasses[size],
        'font-semibold',
        className
      )}
    >
      {score.toFixed(1)}
    </Badge>
  );
}

// Text-only severity label
export function CVSSSeverityLabel({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const config = getSeverityConfig(score);
  return (
    <span className={cn('font-medium', className)} style={{ color: config.bgClass.includes('red') ? '#dc2626' : config.bgClass.includes('orange') ? '#ea580c' : config.bgClass.includes('yellow') ? '#ca8a04' : config.bgClass.includes('blue') ? '#2563eb' : '#6b7280' }}>
      {config.label}
    </span>
  );
}
