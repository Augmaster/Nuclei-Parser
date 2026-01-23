import { ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TopListProps {
  title: string;
  data: Record<string, number>;
  limit?: number;
  onItemClick?: (item: string) => void;
}

export function TopList({ title, data, limit = 5, onItemClick }: TopListProps) {
  const sortedItems = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit);

  const maxCount = sortedItems.length > 0 ? sortedItems[0][1] : 0;

  if (sortedItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          No data to display
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedItems.map(([item, count], index) => {
          const percentage = Math.round((count / maxCount) * 100);
          return (
            <div
              key={item}
              className={`group relative ${
                onItemClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onItemClick?.(item)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground w-5">
                  {index + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-sm font-medium truncate group-hover:text-primary transition-colors"
                      title={item}
                    >
                      {item.length > 35 ? item.slice(0, 35) + '...' : item}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{count}</span>
                      {onItemClick && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full transition-all duration-500 group-hover:bg-primary"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
