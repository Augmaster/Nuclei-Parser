import { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle,
  Shield,
  ExternalLink,
  RefreshCw,
  Clock,
  Package,
  Bug,
  AlertOctagon,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { EnrichedCVEDetails, KEVEntry } from '@/types/nuclei';
import { getCVEDetails, extractCVEIds } from '@/services/enrichment/cveService';
import { isInKEV } from '@/services/enrichment/kevService';
import { cn } from '@/lib/utils';

interface CVEDetailPanelProps {
  references: string[];
  templateId: string;
  findingName: string;
}

interface CVEData {
  cve: EnrichedCVEDetails;
  kevEntry: KEVEntry | null;
}

// CVSS severity colors
const cvssColors: Record<string, string> = {
  none: 'bg-gray-100 text-gray-800 border-gray-300',
  low: 'bg-blue-100 text-blue-800 border-blue-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  critical: 'bg-red-100 text-red-800 border-red-300',
};

// CVSS score gauge color
function getCvssGaugeColor(score: number): string {
  if (score === 0) return 'stroke-gray-300';
  if (score < 4) return 'stroke-blue-500';
  if (score < 7) return 'stroke-yellow-500';
  if (score < 9) return 'stroke-orange-500';
  return 'stroke-red-500';
}

// CVSS score gauge component
function CVSSGauge({ score, size = 80 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className={cn('transition-all duration-500', getCvssGaugeColor(score))}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold">{score.toFixed(1)}</span>
      </div>
    </div>
  );
}

// CVSS vector breakdown component
function CVSSVectorBreakdown({ vector }: { vector: string }) {
  // Parse CVSS 3.1 vector
  const vectorLabels: Record<string, Record<string, string>> = {
    AV: { N: 'Network', A: 'Adjacent', L: 'Local', P: 'Physical' },
    AC: { L: 'Low', H: 'High' },
    PR: { N: 'None', L: 'Low', H: 'High' },
    UI: { N: 'None', R: 'Required' },
    S: { U: 'Unchanged', C: 'Changed' },
    C: { N: 'None', L: 'Low', H: 'High' },
    I: { N: 'None', L: 'Low', H: 'High' },
    A: { N: 'None', L: 'Low', H: 'High' },
  };

  const vectorDescriptions: Record<string, string> = {
    AV: 'Attack Vector',
    AC: 'Attack Complexity',
    PR: 'Privileges Required',
    UI: 'User Interaction',
    S: 'Scope',
    C: 'Confidentiality Impact',
    I: 'Integrity Impact',
    A: 'Availability Impact',
  };

  // Parse the vector string (e.g., "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H")
  const parts = vector.split('/').slice(1); // Skip "CVSS:3.1"
  const parsed = parts.map(part => {
    const [key, value] = part.split(':');
    return {
      key,
      value,
      label: vectorDescriptions[key] || key,
      valueLabel: vectorLabels[key]?.[value] || value,
    };
  });

  return (
    <div className="flex flex-wrap gap-1.5">
      {parsed.map(({ key, value, label, valueLabel }) => (
        <Tooltip key={key}>
          <TooltipTrigger>
            <Badge variant="outline" className="text-xs font-mono">
              {key}:{value}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{label}</p>
            <p className="text-muted-foreground">{valueLabel}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

// KEV Warning Badge
function KEVBadge({ kevEntry }: { kevEntry: KEVEntry }) {
  const dueDate = new Date(kevEntry.dueDate);
  const now = new Date();
  const isOverdue = dueDate < now;
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className={cn(
      'rounded-lg border p-3 space-y-2',
      isOverdue ? 'bg-red-50 border-red-300 dark:bg-red-950/30' : 'bg-amber-50 border-amber-300 dark:bg-amber-950/30'
    )}>
      <div className="flex items-center gap-2">
        <AlertOctagon className={cn(
          'h-5 w-5',
          isOverdue ? 'text-red-600' : 'text-amber-600'
        )} />
        <span className="font-semibold text-sm">CISA Known Exploited Vulnerability</span>
      </div>
      <div className="grid gap-1 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            Due Date: <strong>{dueDate.toLocaleDateString()}</strong>
            {isOverdue ? (
              <Badge variant="destructive" className="ml-2">Overdue</Badge>
            ) : daysUntilDue <= 7 ? (
              <Badge variant="outline" className="ml-2 border-amber-500 text-amber-600">
                {daysUntilDue} days left
              </Badge>
            ) : null}
          </span>
        </div>
        {kevEntry.knownRansomwareCampaignUse === 'Known' && (
          <div className="flex items-center gap-2 text-red-600">
            <Bug className="h-4 w-4" />
            <span className="font-medium">Known ransomware campaign use</span>
          </div>
        )}
        <p className="text-muted-foreground text-xs mt-1">
          {kevEntry.requiredAction}
        </p>
      </div>
    </div>
  );
}

// Affected Products List
function AffectedProducts({ products }: { products: EnrichedCVEDetails['affectedProducts'] }) {
  if (!products || products.length === 0) return null;

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary">
        <Package className="h-4 w-4" />
        Affected Products ({products.length})
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <ul className="space-y-1 text-sm">
          {products.slice(0, 10).map((product, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                {product.vendor}/{product.product}
              </span>
              {product.versions.length > 0 && (
                <span className="text-muted-foreground text-xs">
                  ({product.versions.slice(0, 3).join(', ')}
                  {product.versions.length > 3 && ` +${product.versions.length - 3} more`})
                </span>
              )}
            </li>
          ))}
          {products.length > 10 && (
            <li className="text-muted-foreground text-xs">
              +{products.length - 10} more products
            </li>
          )}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Vendor Advisories
function VendorAdvisories({ advisories }: { advisories: EnrichedCVEDetails['vendorAdvisories'] }) {
  if (!advisories || advisories.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Vendor Advisories
      </h4>
      <ul className="space-y-1">
        {advisories.map((advisory, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm">
            <a
              href={advisory.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              {advisory.vendor}
              <ExternalLink className="h-3 w-3" />
            </a>
            {advisory.patchAvailable && (
              <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Patch Available
              </Badge>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CVEDetailPanel({ references, templateId, findingName }: CVEDetailPanelProps) {
  const [cveDataList, setCveDataList] = useState<CVEData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract CVE IDs from all available sources
  const cveIds = extractCVEIds([
    ...references,
    templateId,
    findingName,
  ]);

  const loadCVEData = useCallback(async () => {
    if (cveIds.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const results: CVEData[] = [];

      for (const cveId of cveIds) {
        const cveDetails = await getCVEDetails(cveId);
        if (cveDetails) {
          const kevEntry = await isInKEV(cveId);
          results.push({ cve: cveDetails, kevEntry });
        }
      }

      setCveDataList(results);
    } catch (err) {
      setError('Failed to load CVE details');
      console.error('CVE fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [cveIds.join(',')]);

  useEffect(() => {
    loadCVEData();
  }, [loadCVEData]);

  // Don't render if no CVEs found
  if (cveIds.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            CVE Intelligence
            <Badge variant="outline" className="ml-2">
              {cveIds.length} CVE{cveIds.length > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadCVEData}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && cveDataList.length === 0 && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading CVE details...
          </div>
        )}

        {error && (
          <div className="text-sm text-red-500">{error}</div>
        )}

        {cveDataList.map(({ cve, kevEntry }) => (
          <div key={cve.id} className="space-y-4 pb-4 border-b last:border-0 last:pb-0">
            {/* CVE Header with CVSS */}
            <div className="flex items-start gap-4">
              {cve.cvss && (
                <CVSSGauge score={cve.cvss.score} />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`https://nvd.nist.gov/vuln/detail/${cve.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-bold text-primary hover:underline"
                  >
                    {cve.id}
                  </a>
                  {cve.cvss && (
                    <Badge className={cn('text-xs', cvssColors[cve.cvss.severity])}>
                      {cve.cvss.severity.toUpperCase()}
                    </Badge>
                  )}
                  {cve.exploitAvailable && (
                    <Badge variant="destructive" className="text-xs">
                      <Bug className="h-3 w-3 mr-1" />
                      Exploit Available
                    </Badge>
                  )}
                </div>
                {cve.cvss?.vector && (
                  <div className="mt-2">
                    <CVSSVectorBreakdown vector={cve.cvss.vector} />
                  </div>
                )}
              </div>
            </div>

            {/* KEV Warning */}
            {kevEntry && <KEVBadge kevEntry={kevEntry} />}

            {/* Description */}
            {cve.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {cve.description}
              </p>
            )}

            {/* Affected Products */}
            <AffectedProducts products={cve.affectedProducts} />

            {/* Vendor Advisories */}
            <VendorAdvisories advisories={cve.vendorAdvisories} />

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {cve.publishedDate && (
                <span>Published: {new Date(cve.publishedDate).toLocaleDateString()}</span>
              )}
              {cve.fetchedAt && (
                <span>Updated: {new Date(cve.fetchedAt).toLocaleString()}</span>
              )}
              {cve.source && (
                <Badge variant="outline" className="text-xs">
                  Source: {cve.source.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>
        ))}

        {/* Show unfetched CVEs */}
        {!isLoading && cveDataList.length < cveIds.length && (
          <div className="text-sm text-muted-foreground">
            {cveIds.length - cveDataList.length} CVE(s) pending fetch...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
