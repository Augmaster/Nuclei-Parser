import { Copy, ExternalLink, Check, Lightbulb, Sparkles } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SeverityBadge } from './SeverityBadge';
import type { NucleiFinding } from '@/types/nuclei';
import { getRemediation, type RemediationResult } from '@/services/remediation/remediationService';

interface FindingDetailProps {
  finding: NucleiFinding;
}

const sourceLabels: Record<RemediationResult['source'], string> = {
  template: 'From Template',
  cwe: 'Based on CWE',
  cve: 'Based on CVE',
  tag: 'Based on Tag',
  type: 'Based on Type',
  severity: 'General Guidance',
};

export function FindingDetailComponent({ finding }: FindingDetailProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const remediationResult = useMemo(() => getRemediation(finding), [finding]);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={() => copyToClipboard(text, field)}
    >
      {copiedField === field ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{finding.info.name}</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">
            {finding.templateId}
          </p>
        </div>
        <SeverityBadge severity={finding.info.severity} className="text-sm" />
      </div>

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
            <CopyButton text={finding.host} field="host" />
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
            <CopyButton text={finding.matchedAt} field="matchedAt" />
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
              <CopyButton text={finding.ip} field="ip" />
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
                  <CopyButton text={result} field={`result-${index}`} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Curl Command */}
      {finding.curlCommand && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">cURL Command</CardTitle>
            <CopyButton text={finding.curlCommand} field="curl" />
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
              {finding.curlCommand}
            </pre>
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
            <Tabs defaultValue="request">
              <TabsList>
                {finding.request && <TabsTrigger value="request">Request</TabsTrigger>}
                {finding.response && <TabsTrigger value="response">Response</TabsTrigger>}
              </TabsList>
              {finding.request && (
                <TabsContent value="request">
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-96">
                    {finding.request}
                  </pre>
                </TabsContent>
              )}
              {finding.response && (
                <TabsContent value="response">
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-96">
                    {finding.response}
                  </pre>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* References */}
      {finding.info.reference.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">References</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {finding.info.reference.map((ref, index) => (
                <li key={index}>
                  <a
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {ref}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Remediation */}
      {remediationResult && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {remediationResult.source === 'template' ? (
                  <Lightbulb className="h-5 w-5 text-primary" />
                ) : (
                  <Sparkles className="h-5 w-5 text-primary" />
                )}
                <CardTitle className="text-sm font-medium">Remediation</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                {sourceLabels[remediationResult.source]}
                {remediationResult.sourceDetail && `: ${remediationResult.sourceDetail}`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {remediationResult.remediation.title && remediationResult.source !== 'template' && (
              <h4 className="font-semibold text-sm">{remediationResult.remediation.title}</h4>
            )}
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {remediationResult.remediation.description}
            </p>
            {remediationResult.remediation.steps.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Recommended Steps:</h5>
                <ol className="list-decimal list-inside space-y-1.5 text-sm">
                  {remediationResult.remediation.steps.map((step, index) => (
                    <li key={index} className="text-muted-foreground">
                      <span className="text-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
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
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {ref}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
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
    </div>
  );
}
