import { useNavigate } from 'react-router-dom';
import { FileCode } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SeverityBadge } from '@/components/findings/SeverityBadge';
import { useFindingsStore, useStats } from '@/store/findingsStore';

export function TemplatesPage() {
  const navigate = useNavigate();
  const stats = useStats();
  const findings = useFindingsStore(state => state.findings);
  const setFilters = useFindingsStore(state => state.setFilters);

  // Group findings by template with additional info
  const templateData = Object.entries(stats.byTemplate)
    .map(([templateId, count]) => {
      const templateFindings = findings.filter(f => f.templateId === templateId);
      const firstFinding = templateFindings[0];
      const affectedHosts = new Set(templateFindings.map(f => f.host)).size;
      return {
        templateId,
        name: firstFinding?.info.name || templateId,
        severity: firstFinding?.info.severity || 'unknown',
        count,
        affectedHosts,
        tags: firstFinding?.info.tags || [],
      };
    })
    .sort((a, b) => b.count - a.count);

  const handleTemplateClick = (template: string) => {
    setFilters({ templates: [template] });
    navigate('/findings');
  };

  if (templateData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <FileCode className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">No Templates</h1>
        <p className="text-muted-foreground mb-6">
          Upload Nuclei scan output files to see triggered templates
        </p>
        <Button onClick={() => navigate('/upload')}>Upload Files</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Templates</h1>
        <p className="text-muted-foreground">
          {templateData.length} templates triggered
        </p>
      </div>

      <div className="space-y-3">
        {templateData.map(({ templateId, name, severity, count, affectedHosts, tags }) => (
          <Card
            key={templateId}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => handleTemplateClick(templateId)}
          >
            <CardContent className="flex items-center gap-4 py-4">
              <SeverityBadge severity={severity} />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{name}</h3>
                <p className="text-sm text-muted-foreground font-mono truncate">
                  {templateId}
                </p>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tags.slice(0, 5).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {tags.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{tags.length - 5}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-muted-foreground">
                  {affectedHosts} {affectedHosts === 1 ? 'host' : 'hosts'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
