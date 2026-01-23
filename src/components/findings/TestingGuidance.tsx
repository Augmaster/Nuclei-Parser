import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Target,
  FlaskConical,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { TestingGuidance, ToolRecommendation, PayloadExample } from '@/data/testingGuidance';

interface TestingGuidanceProps {
  guidance: TestingGuidance;
}

// Tool category colors
const categoryColors: Record<ToolRecommendation['category'], string> = {
  proxy: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  scanner: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  fuzzer: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  exploitation: 'bg-red-500/10 text-red-600 dark:text-red-400',
  recon: 'bg-green-500/10 text-green-600 dark:text-green-400',
  utility: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
};

export function TestingGuidanceComponent({ guidance }: TestingGuidanceProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set([0]));

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(id);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedItem(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const toggleTool = (index: number) => {
    setExpandedTools(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FlaskConical className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Next Steps: {guidance.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {guidance.description}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="verification" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-9">
            <TabsTrigger value="verification" className="text-xs">
              Verify
            </TabsTrigger>
            <TabsTrigger value="tools" className="text-xs">
              Tools
            </TabsTrigger>
            <TabsTrigger value="payloads" className="text-xs">
              Payloads
            </TabsTrigger>
            <TabsTrigger value="fp" className="text-xs">
              False Positives
            </TabsTrigger>
          </TabsList>

          {/* Verification Steps Tab */}
          <TabsContent value="verification" className="space-y-4 mt-4">
            <div>
              <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Manual Verification Steps
              </h4>
              <ol className="space-y-2">
                {guidance.manualVerificationSteps.map((step, index) => (
                  <li
                    key={index}
                    className="flex gap-3 text-sm group"
                  >
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {guidance.exploitationPath && guidance.exploitationPath.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-red-500" />
                  Potential Impact
                </h4>
                <ul className="space-y-1.5">
                  {guidance.exploitationPath.map((path, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span className="text-muted-foreground">{path}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-3 mt-4">
            <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
              <Wrench className="h-4 w-4 text-blue-500" />
              Recommended Tools
            </h4>
            <div className="space-y-2">
              {guidance.tools.map((tool, index) => (
                <div
                  key={index}
                  className="border rounded-lg overflow-hidden bg-card"
                >
                  <button
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => toggleTool(index)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedTools.has(index) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">{tool.name}</span>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${categoryColors[tool.category]}`}
                      >
                        {tool.category}
                      </Badge>
                    </div>
                    {tool.link && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(tool.link, '_blank');
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </button>

                  {expandedTools.has(index) && (
                    <div className="px-3 pb-3 pt-1 border-t bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-2">
                        {tool.description}
                      </p>
                      {tool.command && (
                        <div className="flex items-center gap-2 mt-2">
                          <code className="flex-1 text-xs bg-background px-2.5 py-1.5 rounded font-mono border overflow-x-auto">
                            {tool.command}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => copyToClipboard(tool.command!, `tool-${index}`)}
                          >
                            {copiedItem === `tool-${index}` ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Payloads Tab */}
          <TabsContent value="payloads" className="space-y-3 mt-4">
            <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
              <Terminal className="h-4 w-4 text-purple-500" />
              Test Payloads
            </h4>
            {guidance.payloadExamples && guidance.payloadExamples.length > 0 ? (
              <div className="space-y-3">
                {guidance.payloadExamples.map((example, index) => (
                  <PayloadCard
                    key={index}
                    example={example}
                    index={index}
                    copiedItem={copiedItem}
                    onCopy={copyToClipboard}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No specific payloads available for this vulnerability type.
              </p>
            )}
          </TabsContent>

          {/* False Positives Tab */}
          <TabsContent value="fp" className="space-y-4 mt-4">
            <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              False Positive Indicators
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              If any of these conditions apply, the finding may be a false positive:
            </p>
            <ul className="space-y-2">
              {guidance.falsePositiveIndicators.map((indicator, index) => (
                <li
                  key={index}
                  className="flex gap-2 text-sm p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20"
                >
                  <span className="text-yellow-500 font-bold shrink-0">!</span>
                  <span className="text-muted-foreground">{indicator}</span>
                </li>
              ))}
            </ul>

            {guidance.relatedTags && guidance.relatedTags.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium text-sm mb-2">Related Vulnerability Types</h4>
                <div className="flex flex-wrap gap-2">
                  {guidance.relatedTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Separate component for payload cards to keep main component cleaner
function PayloadCard({
  example,
  index,
  copiedItem,
  onCopy,
}: {
  example: PayloadExample;
  index: number;
  copiedItem: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLongPayload = example.payload.length > 60;

  return (
    <div className="border rounded-lg p-3 bg-card space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{example.name}</span>
            <Badge variant="secondary" className="text-xs">
              {example.context}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => onCopy(example.payload, `payload-${index}`)}
          title="Copy payload"
        >
          {copiedItem === `payload-${index}` ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      <div className="relative">
        <code
          className={`block text-xs bg-muted px-2.5 py-2 rounded font-mono overflow-x-auto whitespace-pre-wrap break-all ${
            !expanded && isLongPayload ? 'max-h-[60px] overflow-hidden' : ''
          }`}
        >
          {example.payload}
        </code>
        {isLongPayload && (
          <button
            className="text-xs text-primary hover:underline mt-1"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        <span className="font-medium">Expected:</span> {example.expectedBehavior}
      </p>
    </div>
  );
}
