import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Shield } from 'lucide-react';
import { lookupCWEs, getCWECategoryColor } from '@/services/enrichment/cweDatabase';
import { extractCWEIds } from '@/services/enrichment/referenceCategorizer';
import type { CWEDetails } from '@/types/nuclei';

interface CWEDisplayProps {
  references: string[];
  tags: string[];
  templateId: string;
}

export function CWEDisplay({ references, tags, templateId }: CWEDisplayProps) {
  const cweDetails = useMemo(() => {
    // Extract CWE IDs from references, tags, and template ID
    const allText = [...references, ...tags, templateId].join(' ');
    const cweIds = extractCWEIds(allText);
    return lookupCWEs(cweIds);
  }, [references, tags, templateId]);

  if (cweDetails.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-orange-500" />
          <CardTitle className="text-sm font-medium">
            CWE Classification ({cweDetails.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {cweDetails.map((cwe) => (
          <CWECard key={cwe.id} cwe={cwe} />
        ))}
      </CardContent>
    </Card>
  );
}

function CWECard({ cwe }: { cwe: CWEDetails }) {
  const categoryColor = cwe.category ? getCWECategoryColor(cwe.category) : '';

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`https://cwe.mitre.org/data/definitions/${cwe.id.replace('CWE-', '')}.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            {cwe.id}
            <ExternalLink className="h-3 w-3" />
          </a>
          {cwe.category && (
            <Badge variant="outline" className={`text-xs ${categoryColor}`}>
              {cwe.category}
            </Badge>
          )}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-sm">{cwe.name}</h4>
        {cwe.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {cwe.description}
          </p>
        )}
      </div>

      {cwe.parentIds && cwe.parentIds.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Parent:</span>
          {cwe.parentIds.map((parentId) => (
            <a
              key={parentId}
              href={`https://cwe.mitre.org/data/definitions/${parentId.replace('CWE-', '')}.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {parentId}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// Compact version for inline display
export function CWEBadges({
  references,
  tags,
  templateId,
}: CWEDisplayProps) {
  const cweDetails = useMemo(() => {
    const allText = [...references, ...tags, templateId].join(' ');
    const cweIds = extractCWEIds(allText);
    return lookupCWEs(cweIds);
  }, [references, tags, templateId]);

  if (cweDetails.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {cweDetails.map((cwe) => (
        <a
          key={cwe.id}
          href={`https://cwe.mitre.org/data/definitions/${cwe.id.replace('CWE-', '')}.html`}
          target="_blank"
          rel="noopener noreferrer"
          title={cwe.name}
        >
          <Badge
            variant="outline"
            className="text-xs hover:bg-orange-500/10 cursor-pointer"
          >
            {cwe.id}
          </Badge>
        </a>
      ))}
    </div>
  );
}
