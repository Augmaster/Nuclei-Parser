import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Lightbulb,
  Sparkles,
  Check,
  Calendar,
  AlertTriangle,
  Clock,
  Ban,
  CheckCircle2,
  Pencil,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { NucleiFinding, RemediationProgressStatus, KEVEntry, EnrichedCVEDetails } from '@/types/nuclei';
import { getRemediation, type RemediationResult } from '@/services/remediation/remediationService';
import { useRemediationStore } from '@/store/remediationStore';
import {
  calculateDueDate,
  getUrgencyLabel,
  getUrgencyColor,
  isOverdue,
  formatDueDate,
  getRelativeTimeDescription,
} from '@/services/remediation/dueDateCalculator';
import { cn } from '@/lib/utils';

interface RemediationPanelProps {
  finding: NucleiFinding;
  kevEntry?: KEVEntry | null;
  cveDetails?: EnrichedCVEDetails | null;
}

const sourceLabels: Record<RemediationResult['source'], string> = {
  template: 'From Template',
  cwe: 'Based on CWE',
  cve: 'Based on CVE',
  tag: 'Based on Tag',
  type: 'Based on Type',
  severity: 'General Guidance',
};

const statusConfig: Record<RemediationProgressStatus, {
  label: string;
  icon: typeof Check;
  color: string;
}> = {
  not_started: {
    label: 'Not Started',
    icon: Clock,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  in_progress: {
    label: 'In Progress',
    icon: Pencil,
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  blocked: {
    label: 'Blocked',
    icon: Ban,
    color: 'bg-red-100 text-red-800 border-red-300',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800 border-green-300',
  },
};

export function RemediationPanel({ finding, kevEntry, cveDetails }: RemediationPanelProps) {
  const remediationResult = useMemo(() => getRemediation(finding), [finding]);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [showBlockedDialog, setShowBlockedDialog] = useState(false);
  const [blockerReason, setBlockerReason] = useState('');

  const {
    initializeProgress,
    getProgress,
    toggleStep,
    setTargetDate,
    updateNotes,
    markComplete,
    markBlocked,
  } = useRemediationStore();

  const progress = getProgress(finding.id);
  const steps = remediationResult?.remediation.steps || [];

  // Initialize progress when component mounts
  useEffect(() => {
    if (finding.projectId && steps.length > 0) {
      initializeProgress(finding.id, finding.projectId, steps.length);
    }
  }, [finding.id, finding.projectId, steps.length, initializeProgress]);

  // Calculate recommended due date
  const dueDateRecommendation = useMemo(() => {
    return calculateDueDate({
      severity: finding.info.severity,
      kevEntry,
      cveDetails,
    });
  }, [finding.info.severity, kevEntry, cveDetails]);

  // Handle step toggle
  const handleStepToggle = useCallback(async (stepIndex: number) => {
    await toggleStep(finding.id, stepIndex);
  }, [finding.id, toggleStep]);

  // Handle notes save
  const handleSaveNotes = useCallback(async () => {
    await updateNotes(finding.id, notesValue);
    setIsEditingNotes(false);
  }, [finding.id, notesValue, updateNotes]);

  // Handle target date change
  const handleDateChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    await setTargetDate(finding.id, value || undefined);
  }, [finding.id, setTargetDate]);

  // Handle mark complete
  const handleMarkComplete = useCallback(async () => {
    await markComplete(finding.id);
  }, [finding.id, markComplete]);

  // Handle mark blocked
  const handleMarkBlocked = useCallback(async () => {
    await markBlocked(finding.id, blockerReason);
    setShowBlockedDialog(false);
    setBlockerReason('');
  }, [finding.id, blockerReason, markBlocked]);

  // Start editing notes
  const startEditingNotes = useCallback(() => {
    setNotesValue(progress?.customNotes || '');
    setIsEditingNotes(true);
  }, [progress?.customNotes]);

  if (!remediationResult) {
    return null;
  }

  const completedSteps = progress?.completedSteps || [];
  const completionPercentage = steps.length > 0
    ? Math.round((completedSteps.length / steps.length) * 100)
    : 0;

  const status = progress?.status || 'not_started';
  const StatusIcon = statusConfig[status].icon;

  const targetDate = progress?.targetDate;
  const targetOverdue = targetDate && isOverdue(targetDate);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {remediationResult.source === 'template' ? (
              <Lightbulb className="h-5 w-5 text-primary" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary" />
            )}
            <CardTitle className="text-sm font-medium">Remediation</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {sourceLabels[remediationResult.source]}
              {remediationResult.sourceDetail && `: ${remediationResult.sourceDetail}`}
            </Badge>
            <Badge className={cn('text-xs', statusConfig[status].color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig[status].label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title and Description */}
        {remediationResult.remediation.title && remediationResult.source !== 'template' && (
          <h4 className="font-semibold text-sm">{remediationResult.remediation.title}</h4>
        )}
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {remediationResult.remediation.description}
        </p>

        {/* Progress Bar */}
        {steps.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">
                {completedSteps.length} of {steps.length} steps ({completionPercentage}%)
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        )}

        {/* Remediation Steps */}
        {steps.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium">Remediation Steps:</h5>
            <ol className="space-y-2">
              {steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Checkbox
                    id={`step-${index}`}
                    checked={completedSteps.includes(index)}
                    onCheckedChange={() => handleStepToggle(index)}
                    disabled={status === 'completed'}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={`step-${index}`}
                    className={cn(
                      'text-sm cursor-pointer flex-1',
                      completedSteps.includes(index) && 'text-muted-foreground line-through'
                    )}
                  >
                    {step}
                  </label>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Target Date */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Target Date:</span>
            <Input
              type="date"
              value={targetDate || ''}
              onChange={handleDateChange}
              disabled={status === 'completed'}
              className="w-auto h-8 text-sm"
            />
          </div>
          {targetDate && (
            <Badge className={cn(
              'text-xs',
              targetOverdue
                ? 'bg-red-100 text-red-800 border-red-300'
                : 'bg-green-100 text-green-800 border-green-300'
            )}>
              {targetOverdue && <AlertTriangle className="h-3 w-3 mr-1" />}
              {getRelativeTimeDescription(targetDate)}
            </Badge>
          )}
        </div>

        {/* Recommended Due Date */}
        {dueDateRecommendation.daysFromNow > 0 && !targetDate && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Recommended:</span>
            <Badge className={cn('text-xs', getUrgencyColor(dueDateRecommendation.urgencyLevel))}>
              {getUrgencyLabel(dueDateRecommendation.urgencyLevel)}
            </Badge>
            <span className="text-muted-foreground">
              {formatDueDate(dueDateRecommendation.recommendedDate)}
              ({dueDateRecommendation.daysFromNow} days)
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setTargetDate(
                finding.id,
                dueDateRecommendation.recommendedDate.toISOString().split('T')[0]
              )}
            >
              Use this date
            </Button>
          </div>
        )}

        {/* Custom Notes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium">Notes</h5>
            {!isEditingNotes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={startEditingNotes}
                className="h-6 text-xs"
              >
                <Pencil className="h-3 w-3 mr-1" />
                {progress?.customNotes ? 'Edit' : 'Add notes'}
              </Button>
            )}
          </div>
          {isEditingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Add remediation notes, blockers, or progress updates..."
                className="min-h-[80px] text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveNotes}>
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditingNotes(false)}>
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : progress?.customNotes ? (
            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              {progress.customNotes}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No notes yet</p>
          )}
        </div>

        {/* Blocked Reason */}
        {status === 'blocked' && progress?.blockerReason && (
          <div className="flex items-start gap-2 text-sm bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-800">
            <Ban className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-red-800 dark:text-red-400">Blocker:</span>
              <p className="text-red-700 dark:text-red-300">{progress.blockerReason}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {status !== 'completed' && (
          <div className="flex gap-2 pt-2 border-t">
            <Dialog open={showBlockedDialog} onOpenChange={setShowBlockedDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={status === 'blocked'}>
                  <Ban className="h-3 w-3 mr-1" />
                  Mark Blocked
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mark as Blocked</DialogTitle>
                  <DialogDescription>
                    Describe what is blocking the remediation of this finding.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  value={blockerReason}
                  onChange={(e) => setBlockerReason(e.target.value)}
                  placeholder="e.g., Waiting for vendor patch, requires downtime approval..."
                  className="min-h-[100px]"
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowBlockedDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleMarkBlocked} disabled={!blockerReason.trim()}>
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              onClick={handleMarkComplete}
              disabled={steps.length > 0 && completedSteps.length < steps.length}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Mark Complete
            </Button>
          </div>
        )}

        {/* References */}
        {remediationResult.remediation.references && remediationResult.remediation.references.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <h5 className="text-sm font-medium">Additional Resources:</h5>
            <ul className="space-y-1">
              {remediationResult.remediation.references.map((ref, index) => (
                <li key={index}>
                  <a
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    {ref}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
