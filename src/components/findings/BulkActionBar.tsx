import { useState } from 'react';
import { X, FileDown, Copy, CheckSquare, FileText, Braces } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { statusConfig } from './StatusWorkflow';
import type { NucleiFinding, FindingStatus } from '@/types/nuclei';
import {
  formatAsMarkdown,
  formatAsJira,
  formatAsCSV,
  formatAsJSON,
  copyToClipboard,
  downloadAsFile,
} from '@/lib/copyFormats';
import { cn } from '@/lib/utils';

interface BulkActionBarProps {
  selectedFindings: NucleiFinding[];
  onClearSelection: () => void;
  onBulkStatusChange: (status: FindingStatus, reason?: string) => Promise<void>;
  className?: string;
}

const allStatuses: FindingStatus[] = [
  'new',
  'in_progress',
  'verified',
  'false_positive',
  'remediated',
  'accepted_risk',
  'closed',
];

const requiresReason: FindingStatus[] = ['false_positive', 'accepted_risk', 'closed'];

export function BulkActionBar({
  selectedFindings,
  onClearSelection,
  onBulkStatusChange,
  className,
}: BulkActionBarProps) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<FindingStatus | ''>('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const count = selectedFindings.length;

  if (count === 0) return null;

  const handleCopyMarkdown = () => {
    const content = formatAsMarkdown(selectedFindings);
    copyToClipboard(content, 'Markdown');
  };

  const handleCopyJira = () => {
    const content = formatAsJira(selectedFindings);
    copyToClipboard(content, 'Jira format');
  };

  const handleExportCSV = () => {
    const content = formatAsCSV(selectedFindings);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadAsFile(content, `findings-${timestamp}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const content = formatAsJSON(selectedFindings);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadAsFile(content, `findings-${timestamp}.json`, 'application/json');
  };

  const handleStatusDialogClose = () => {
    setStatusDialogOpen(false);
    setSelectedStatus('');
    setReason('');
    setError('');
  };

  const handleStatusSubmit = async () => {
    if (!selectedStatus) {
      setError('Please select a status');
      return;
    }

    if (requiresReason.includes(selectedStatus) && !reason.trim()) {
      setError('Please provide a reason for this status change');
      return;
    }

    setIsProcessing(true);
    try {
      await onBulkStatusChange(selectedStatus, reason.trim() || undefined);
      handleStatusDialogClose();
      onClearSelection();
    } catch (err) {
      setError('Failed to update status. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between gap-4 p-3 bg-primary/5 border border-primary/20 rounded-lg',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {count} finding{count !== 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Change */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusDialogOpen(true)}
          >
            Change Status
          </Button>

          {/* Copy Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Copy Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopyMarkdown}>
                <FileText className="h-4 w-4 mr-2" />
                Copy as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyJira}>
                <FileText className="h-4 w-4 mr-2" />
                Copy as Jira
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <FileDown className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJSON}>
                <Braces className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Status for {count} Finding{count !== 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              Select a new status to apply to all selected findings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-status">New Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => {
                  setSelectedStatus(value as FindingStatus);
                  setError('');
                }}
              >
                <SelectTrigger id="bulk-status">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {allStatuses.map((s) => {
                    const config = statusConfig[s];
                    const Icon = config.icon;
                    return (
                      <SelectItem key={s} value={s}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn('h-4 w-4', config.color)} />
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

            {selectedStatus && (
              <div className="space-y-2">
                <Label htmlFor="bulk-reason">
                  Reason
                  {requiresReason.includes(selectedStatus) && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <Textarea
                  id="bulk-reason"
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

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleStatusDialogClose}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusSubmit}
              disabled={!selectedStatus || isProcessing}
            >
              {isProcessing ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
