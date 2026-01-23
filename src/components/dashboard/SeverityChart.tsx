import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Severity } from '@/types/nuclei';

interface SeverityChartProps {
  data: Record<Severity, number>;
  onSeverityClick?: (severity: Severity) => void;
}

const COLORS: Record<Severity, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
  info: '#64748b',
  unknown: '#94a3b8',
};

export function SeverityChart({ data, onSeverityClick }: SeverityChartProps) {
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([severity, value]) => ({
      name: severity.charAt(0).toUpperCase() + severity.slice(1),
      value,
      severity: severity as Severity,
    }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Severity Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No data to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Severity Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="w-[180px] h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  style={{ cursor: onSeverityClick ? 'pointer' : 'default' }}
                  onClick={(data) => onSeverityClick?.(data.severity)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.severity]}
                      stroke="transparent"
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                  itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {chartData.map(({ name, value, severity }) => {
              const percentage = Math.round((value / total) * 100);
              return (
                <div
                  key={severity}
                  className={`group flex items-center gap-3 ${onSeverityClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onSeverityClick?.(severity)}
                >
                  <Badge variant={severity as 'critical' | 'high' | 'medium' | 'low' | 'info'} className="min-w-[70px] justify-center">
                    {name}
                  </Badge>
                  <div className="flex-1">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS[severity],
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{value}</span>
                  <span className="text-xs text-muted-foreground w-10 text-right">{percentage}%</span>
                  {onSeverityClick && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
