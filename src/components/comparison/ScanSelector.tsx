import { Calendar, Database } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Scan } from '@/types/nuclei';
import { cn } from '@/lib/utils';

interface ScanSelectorProps {
  scans: Scan[];
  selectedScanId: string | null;
  onSelectScan: (scanId: string) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  excludeScanId?: string;
  className?: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ScanSelector({
  scans,
  selectedScanId,
  onSelectScan,
  label,
  placeholder = 'Select a scan...',
  disabled = false,
  excludeScanId,
  className,
}: ScanSelectorProps) {
  const availableScans = excludeScanId
    ? scans.filter(s => s.id !== excludeScanId)
    : scans;

  const selectedScan = scans.find(s => s.id === selectedScanId);

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium">{label}</label>
      <Select
        value={selectedScanId || undefined}
        onValueChange={onSelectScan}
        disabled={disabled || availableScans.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {selectedScan && (
              <div className="flex items-center gap-2 truncate">
                <Database className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{selectedScan.name}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {selectedScan.findingsCount}
                </Badge>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableScans.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No scans available
            </div>
          ) : (
            availableScans.map((scan) => (
              <SelectItem key={scan.id} value={scan.id}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{scan.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {scan.findingsCount} findings
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground pl-6">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(scan.createdAt)}</span>
                    {scan.hostCount && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{scan.hostCount} hosts</span>
                      </>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Compact scan badge for display in summaries
 */
export function ScanBadge({ scan, className }: { scan: Scan; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50',
        className
      )}
    >
      <Database className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{scan.name}</div>
        <div className="text-xs text-muted-foreground">
          {scan.findingsCount} findings • {formatDate(scan.createdAt)}
        </div>
      </div>
    </div>
  );
}
