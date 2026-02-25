import { Copy, Check, History, ExternalLink } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SeverityBadge } from './SeverityBadge';
import { CodeBlock } from '@/components/ui/code-block';
import { HttpDetailBlock } from './HttpDetailBlock';
import { TestingGuidanceComponent } from './TestingGuidance';
import { EnrichedReferences } from './EnrichedReferences';
import { CWEDisplay } from './CWEDisplay';
import { StatusWorkflow, StatusHistoryTimeline } from './StatusWorkflow';
import { CommentsSection } from './CommentsSection';
import { CVEDetailPanel } from './CVEDetailPanel';
import { RemediationPanel } from './RemediationPanel';
import { ExternalResourceLinks } from './ExternalResourceLinks';
import type { NucleiFinding, FindingStatus, FindingComment, FindingStatusChange } from '@/types/nuclei';
import { getTestingGuidance } from '@/data/testingGuidance';
import {
  updateFinding,
  getCommentsByFinding,
  addComment,
  updateComment,
  deleteComment,
  getStatusHistoryByFinding,
  addStatusChange,
} from '@/services/db/indexedDB';
import { useFindingsStore } from '@/store/findingsStore';

interface FindingDetailProps {
  finding: NucleiFinding;
  onFindingUpdated?: (finding: NucleiFinding) => void;
}

// CopyButton component moved outside to avoid recreation during render
interface CopyButtonProps {
  text: string;
  field: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}

function CopyButton({ text, field, copiedField, onCopy }: CopyButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={() => onCopy(text, field)}
    >
      {copiedField === field ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
}

export function FindingDetailComponent({ finding, onFindingUpdated }: FindingDetailProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [comments, setComments] = useState<FindingComment[]>([]);
  const [statusHistory, setStatusHistory] = useState<FindingStatusChange[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const updateStoreFinding = useFindingsStore((state) => state.updateFinding);

  const testingGuidance = useMemo(() => getTestingGuidance(finding.info.tags), [finding.info.tags]);

  // Load comments and status history
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedComments, loadedHistory] = await Promise.all([
          getCommentsByFinding(finding.id),
          getStatusHistoryByFinding(finding.id),
        ]);
        setComments(loadedComments);
        setStatusHistory(loadedHistory);
      } catch (error) {
        console.error('Failed to load comments/history:', error);
      }
    };
    loadData();
  }, [finding.id]);

  // Handle status change
  const handleStatusChange = useCallback(
    async (newStatus: FindingStatus, reason?: string) => {
      const currentStatus = finding.status || 'new';
      if (newStatus === currentStatus) return;

      try {
        // Update the finding
        const updatedFinding: NucleiFinding = {
          ...finding,
          status: newStatus,
        };
        await updateFinding(updatedFinding);

        // Record the status change
        const statusChange: FindingStatusChange = {
          id: uuidv4(),
          findingId: finding.id,
          fromStatus: currentStatus,
          toStatus: newStatus,
          changedBy: 'Tester', // TODO: Allow configurable user name
          reason,
          changedAt: new Date().toISOString(),
        };
        await addStatusChange(statusChange);

        // Update local state
        setStatusHistory((prev) => [statusChange, ...prev]);

        // Update store
        updateStoreFinding(updatedFinding);

        // Notify parent
        onFindingUpdated?.(updatedFinding);
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    },
    [finding, updateStoreFinding, onFindingUpdated]
  );

  // Handle adding a comment
  const handleAddComment = useCallback(
    async (author: string, content: string) => {
      try {
        const newComment: FindingComment = {
          id: uuidv4(),
          findingId: finding.id,
          author,
          content,
          createdAt: new Date().toISOString(),
        };
        await addComment(newComment);
        setComments((prev) => [newComment, ...prev]);
      } catch (error) {
        console.error('Failed to add comment:', error);
      }
    },
    [finding.id]
  );

  // Handle editing a comment
  const handleEditComment = useCallback(
    async (commentId: string, content: string) => {
      try {
        const existingComment = comments.find((c) => c.id === commentId);
        if (!existingComment) return;

        const updatedComment: FindingComment = {
          ...existingComment,
          content,
          updatedAt: new Date().toISOString(),
        };
        await updateComment(updatedComment);
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? updatedComment : c))
        );
      } catch (error) {
        console.error('Failed to edit comment:', error);
      }
    },
    [comments]
  );

  // Handle deleting a comment
  const handleDeleteComment = useCallback(async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  }, []);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{finding.info.name}</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">
            {finding.templateId}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusWorkflow
            status={finding.status || 'new'}
            onStatusChange={handleStatusChange}
          />
          <SeverityBadge severity={finding.info.severity} className="text-sm" />
        </div>
      </div>

      {/* Status History (Collapsible) */}
      {statusHistory.length > 0 && (
        <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">
                      Status History ({statusHistory.length})
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {isHistoryOpen ? 'Click to collapse' : 'Click to expand'}
                  </Badge>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <StatusHistoryTimeline history={statusHistory} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Host
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="font-mono text-sm truncate">{finding.host}</span>
            <CopyButton text={finding.host} field="host" copiedField={copiedField} onCopy={copyToClipboard} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Matched At
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="font-mono text-sm truncate">{finding.matchedAt}</span>
            <CopyButton text={finding.matchedAt} field="matchedAt" copiedField={copiedField} onCopy={copyToClipboard} />
          </CardContent>
        </Card>

        {finding.ip && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                IP Address
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="font-mono">{finding.ip}</span>
              <CopyButton text={finding.ip} field="ip" copiedField={copiedField} onCopy={copyToClipboard} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Timestamp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span>{new Date(finding.timestamp).toLocaleString()}</span>
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      {finding.info.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tags</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {finding.info.tags.map(tag => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {finding.info.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{finding.info.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Extracted Results */}
      {finding.extractedResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Extracted Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {finding.extractedResults.map((result, index) => (
                <li key={index} className="flex items-center justify-between">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {result}
                  </code>
                  <CopyButton text={result} field={`result-${index}`} copiedField={copiedField} onCopy={copyToClipboard} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Curl Command */}
      {finding.curlCommand && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">cURL Command</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock code={finding.curlCommand} language="bash" maxHeight="12rem" />
          </CardContent>
        </Card>
      )}

      {/* Request/Response */}
      {(finding.request || finding.response) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">HTTP Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={finding.request ? 'request' : 'response'}>
              <TabsList>
                {finding.request && <TabsTrigger value="request">Request</TabsTrigger>}
                {finding.response && <TabsTrigger value="response">Response</TabsTrigger>}
              </TabsList>
              {finding.request && (
                <TabsContent value="request">
                  <HttpDetailBlock raw={finding.request} maxHeight="32rem" />
                </TabsContent>
              )}
              {finding.response && (
                <TabsContent value="response">
                  <HttpDetailBlock raw={finding.response} maxHeight="32rem" />
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* CWE Classification */}
      <CWEDisplay
        references={finding.info.reference}
        tags={finding.info.tags}
        templateId={finding.templateId}
      />

      {/* Enriched References - Categorized by type */}
      {finding.info.reference.length > 0 && (
        <EnrichedReferences references={finding.info.reference} />
      )}

      {/* CVE Intelligence Panel */}
      <CVEDetailPanel
        references={finding.info.reference}
        templateId={finding.templateId}
        findingName={finding.info.name}
      />

      {/* External Security Resources */}
      <ExternalResourceLinks
        references={finding.info.reference}
        tags={finding.info.tags}
      />

      {/* Remediation with Tracking */}
      <RemediationPanel finding={finding} />

      {/* Testing Guidance - Next Steps for Testers */}
      {testingGuidance && (
        <TestingGuidanceComponent guidance={testingGuidance} />
      )}

      {/* Template Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Template Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Template ID:</span>
            <span className="font-mono">{finding.templateId}</span>
          </div>
          {finding.templatePath && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Path:</span>
              <span className="font-mono text-xs">{finding.templatePath}</span>
            </div>
          )}
          {finding.templateUrl && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">URL:</span>
              <a
                href={finding.templateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                View on GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Authors:</span>
            <span>{finding.info.author.join(', ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <Badge variant="outline">{finding.type}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <CommentsSection
        comments={comments}
        onAddComment={handleAddComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
      />
    </div>
  );
}
