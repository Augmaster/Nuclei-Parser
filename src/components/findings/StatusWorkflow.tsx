import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Circle,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Shield,
  AlertTriangle,
  Archive,
  ChevronRight,
} from 'lucide-react';
import type { FindingStatus } from '@/types/nuclei';
import { cn } from '@/lib/utils';

interface StatusWorkflowProps {
  status: FindingStatus;
  onStatusChange: (newStatus: FindingStatus, reason?: string) => void;
  disabled?: boolean;
}

// Status configuration
const statusConfig: Record<
  FindingStatus,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    description: string;
  }
> = {
  new: {
    label: 'New',
    icon: Circle,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    description: 'Finding has not been reviewed yet',
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayCircle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/30',
    description: 'Currently being investigated',
  },
  verified: {
    label: 'Verified',
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/30',
    description: 'Confirmed as a valid vulnerability',
  },
  false_positive: {
    label: 'False Positive',
    icon: XCircle,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-500/10 border-gray-500/30',
    description: 'Not a real vulnerability',
  },
  remediated: {
    label: 'Remediated',
    icon: Shield,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    description: 'Fix has been applied',
  },
  accepted_risk: {
    label: 'Accepted Risk',
    icon: AlertTriangle,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/30',
    description: 'Risk acknowledged but not fixed',
  },
  closed: {
    label: 'Closed',
    icon: Archive,
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-500/10 border-slate-500/30',
    description: 'No further action required',
  },
};

// Valid status transitions
const allowedTransitions: Record<FindingStatus, FindingStatus[]> = {
  new: ['in_progress', 'false_positive', 'closed'],
  in_progress: ['verified', 'false_positive', 'new'],
  verified: ['remediated', 'accepted_risk', 'in_progress'],
  false_positive: ['new', 'in_progress', 'closed'],
  remediated: ['verified', 'closed'],
  accepted_risk: ['in_progress', 'remediated', 'closed'],
  closed: ['new', 'in_progress'],
};

// Statuses that require a reason
const requiresReason: FindingStatus[] = ['false_positive', 'accepted_risk', 'closed'];

export function StatusWorkflow({
  status,
  onStatusChange,
  disabled = false,
}: StatusWorkflowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<FindingStatus | ''>('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const currentConfig = statusConfig[status];
  const Icon = currentConfig.icon;
  const availableTransitions = allowedTransitions[status];

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedStatus('');
      setReason('');
      setError('');
    }
  };

  const handleSubmit = () => {
    if (!selectedStatus) {
      setError('Please select a status');
      return;
    }

    if (requiresReason.includes(selectedStatus) && !reason.trim()) {
      setError('Please provide a reason for this status change');
      return;
    }

    onStatusChange(selectedStatus, reason.trim() || undefined);
    handleOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn(
            'gap-2 font-medium transition-all',
            currentConfig.bgColor,
            currentConfig.color
          )}
        >
          <Icon className="h-4 w-4" />
          {currentConfig.label}
          <ChevronRight className="h-3 w-3 ml-1 opacity-60" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Finding Status</DialogTitle>
          <DialogDescription>
            Change the status of this finding. Some status changes require a reason.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Current:</span>
            <Badge
              variant="outline"
              className={cn(
                'gap-1.5',
                currentConfig.bgColor,
                currentConfig.color
              )}
            >
              <Icon className="h-3 w-3" />
              {currentConfig.label}
            </Badge>
          </div>

          {/* New Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">New Status</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                setSelectedStatus(value as FindingStatus);
                setError('');
              }}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select new status..." />
              </SelectTrigger>
              <SelectContent>
                {availableTransitions.map((s) => {
                  const config = statusConfig[s];
                  const StatusIcon = config.icon;
                  return (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={cn('h-4 w-4', config.color)} />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedStatus && (
              <p className="text-xs text-muted-foreground">
                {statusConfig[selectedStatus].description}
              </p>
            )}
          </div>

          {/* Reason Field */}
          {selectedStatus && (
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason
                {requiresReason.includes(selectedStatus) && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
              <Textarea
                id="reason"
                placeholder={
                  requiresReason.includes(selectedStatus)
                    ? 'Explain why this status is appropriate...'
                    : 'Optional notes about this status change...'
                }
                value={reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setReason(e.target.value);
                  setError('');
                }}
                className="min-h-[80px]"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedStatus}>
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Compact badge version for tables
export function StatusBadge({
  status,
  className,
}: {
  status: FindingStatus;
  className?: string;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 text-xs',
        config.bgColor,
        config.color,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// Status history timeline
export function StatusHistoryTimeline({
  history,
}: {
  history: Array<{
    id: string;
    fromStatus: FindingStatus;
    toStatus: FindingStatus;
    changedBy: string;
    reason?: string;
    changedAt: string;
  }>;
}) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No status changes recorded
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((change, index) => {
        const fromConfig = statusConfig[change.fromStatus];
        const toConfig = statusConfig[change.toStatus];
        const ToIcon = toConfig.icon;

        return (
          <div
            key={change.id}
            className={cn(
              'relative pl-6 pb-3',
              index !== history.length - 1 && 'border-l-2 border-muted ml-2'
            )}
          >
            <div
              className={cn(
                'absolute -left-2 top-0 w-4 h-4 rounded-full flex items-center justify-center',
                toConfig.bgColor
              )}
            >
              <ToIcon className={cn('h-2.5 w-2.5', toConfig.color)} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{toConfig.label}</span>
                <span className="text-xs text-muted-foreground">
                  from {fromConfig.label}
                </span>
              </div>
              {change.reason && (
                <p className="text-sm text-muted-foreground">
                  {change.reason}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{change.changedBy}</span>
                <span>•</span>
                <span>{new Date(change.changedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Export status config for reuse
export { statusConfig, allowedTransitions };
