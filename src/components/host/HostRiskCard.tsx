import { Server, ChevronRight, AlertTriangle, AlertCircle, Info, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SeverityBadge } from '@/components/findings/SeverityBadge';
import type { HostRiskData, RiskLevel } from '@/lib/riskScoring';
import { getRiskLevelColor, getRiskLevelBgColor } from '@/lib/riskScoring';
import { cn } from '@/lib/utils';

interface HostRiskCardProps {
  data: HostRiskData;
  onClick?: () => void;
  showTopFindings?: boolean;
  compact?: boolean;
}

const riskLevelLabels: Record<RiskLevel, string> = {
  critical: 'Critical Risk',
  high: 'High Risk',
  medium: 'Medium Risk',
  low: 'Low Risk',
  minimal: 'Minimal Risk',
};

const riskLevelIcons: Record<RiskLevel, React.ElementType> = {
  critical: AlertTriangle,
  high: AlertCircle,
  medium: AlertCircle,
  low: Info,
  minimal: Shield,
};

export function HostRiskCard({
  data,
  onClick,
  showTopFindings = false,
  compact = false,
}: HostRiskCardProps) {
  const Icon = riskLevelIcons[data.riskLevel];
  const colorClass = getRiskLevelColor(data.riskLevel);
  const bgClass = getRiskLevelBgColor(data.riskLevel);

  if (compact) {
    return (
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          onClick && 'hover:border-primary/50'
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={cn('p-2 rounded-lg', bgClass)}>
                <Server className={cn('h-4 w-4', colorClass)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate" title={data.host}>
                  {data.host}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.totalFindings} finding{data.totalFindings !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className={cn('text-2xl font-bold', colorClass)}>
                  {data.riskScore}
                </div>
                <Badge variant="outline" className={cn('text-xs', bgClass, colorClass)}>
                  {riskLevelLabels[data.riskLevel]}
                </Badge>
              </div>
              {onClick && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'transition-all',
        onClick && 'cursor-pointer hover:shadow-md hover:border-primary/50'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={cn('p-2 rounded-lg', bgClass)}>
              <Server className={cn('h-5 w-5', colorClass)} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-medium truncate" title={data.host}>
                {data.host}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {data.totalFindings} finding{data.totalFindings !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {onClick && <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Risk Score</span>
            <div className="flex items-center gap-2">
              <Icon className={cn('h-4 w-4', colorClass)} />
              <span className={cn('text-2xl font-bold', colorClass)}>{data.riskScore}</span>
            </div>
          </div>
          <Progress
            value={data.riskScore}
            className="h-2"
          />
          <Badge variant="outline" className={cn('w-full justify-center', bgClass, colorClass)}>
            {riskLevelLabels[data.riskLevel]}
          </Badge>
        </div>

        {/* Severity Breakdown */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Severity Distribution</span>
          <div className="flex flex-wrap gap-2">
            {data.severityBreakdown.critical > 0 && (
              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                {data.severityBreakdown.critical} Critical
              </Badge>
            )}
            {data.severityBreakdown.high > 0 && (
              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                {data.severityBreakdown.high} High
              </Badge>
            )}
            {data.severityBreakdown.medium > 0 && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                {data.severityBreakdown.medium} Medium
              </Badge>
            )}
            {data.severityBreakdown.low > 0 && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                {data.severityBreakdown.low} Low
              </Badge>
            )}
            {data.severityBreakdown.info > 0 && (
              <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-500/30">
                {data.severityBreakdown.info} Info
              </Badge>
            )}
          </div>
        </div>

        {/* Top Findings */}
        {showTopFindings && data.topFindings.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Top Vulnerabilities</span>
            <ul className="space-y-1.5">
              {data.topFindings.map((finding) => (
                <li key={finding.id} className="flex items-center gap-2 text-sm">
                  <SeverityBadge severity={finding.info.severity} className="text-xs" />
                  <span className="truncate text-muted-foreground" title={finding.info.name}>
                    {finding.info.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact risk indicator for use in tables/lists
 */
export function RiskScoreBadge({
  score,
  level,
  className,
}: {
  score: number;
  level: RiskLevel;
  className?: string;
}) {
  const colorClass = getRiskLevelColor(level);
  const bgClass = getRiskLevelBgColor(level);

  return (
    <Badge variant="outline" className={cn('font-mono', bgClass, colorClass, className)}>
      {score}
    </Badge>
  );
}
