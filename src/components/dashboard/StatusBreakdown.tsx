import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { statusConfig } from '@/components/findings/StatusWorkflow';
import { cn } from '@/lib/utils';
import type { FindingStatus } from '@/types/nuclei';

interface StatusBreakdownProps {
  data: Record<FindingStatus, number>;
  onStatusClick?: (status: FindingStatus) => void;
}

const statusOrder: FindingStatus[] = [
  'new',
  'in_progress',
  'verified',
  'false_positive',
  'remediated',
  'accepted_risk',
  'closed',
];

const barColors: Record<FindingStatus, string> = {
  new: 'bg-blue-500/60',
  in_progress: 'bg-yellow-500/60',
  verified: 'bg-green-500/60',
  false_positive: 'bg-gray-500/60',
  remediated: 'bg-emerald-500/60',
  accepted_risk: 'bg-orange-500/60',
  closed: 'bg-slate-500/60',
};

export function StatusBreakdown({ data, onStatusClick }: StatusBreakdownProps) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Triage Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statusOrder.map((status) => {
            const count = data[status] || 0;
            if (count === 0) return null;
            const config = statusConfig[status];
            const Icon = config.icon;
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div
                key={status}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg transition-colors',
                  onStatusClick && 'cursor-pointer hover:bg-accent/50'
                )}
                onClick={() => onStatusClick?.(status)}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', config.color)} />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', barColors[status])}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
          {total === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No findings to display
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
