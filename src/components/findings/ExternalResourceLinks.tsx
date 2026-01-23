import { ExternalLink, BookOpen, GraduationCap, FileText, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getExternalResources,
  type ExternalResource,
} from '@/data/externalResources';
import { extractCWEIds } from '@/services/enrichment/referenceCategorizer';
import { cn } from '@/lib/utils';

interface ExternalResourceLinksProps {
  references: string[];
  tags: string[];
}

// Icons for different resource types
const resourceIcons: Record<ExternalResource['type'], typeof BookOpen> = {
  owasp: BookOpen,
  hacktricks: FileText,
  portswigger: GraduationCap,
  technology: Server,
  generic: ExternalLink,
};

// Colors for different resource types
const resourceColors: Record<ExternalResource['type'], string> = {
  owasp: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400',
  hacktricks: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/30 dark:text-purple-400',
  portswigger: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400',
  technology: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400',
  generic: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-400',
};

// Labels for resource types
const resourceLabels: Record<ExternalResource['type'], string> = {
  owasp: 'OWASP',
  hacktricks: 'HackTricks',
  portswigger: 'PortSwigger',
  technology: 'Tech Docs',
  generic: 'Resource',
};

function ResourceLink({ resource }: { resource: ExternalResource }) {
  const Icon = resourceIcons[resource.type];

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
    >
      <div className={cn(
        'p-2 rounded-md shrink-0',
        resourceColors[resource.type]
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm group-hover:text-primary transition-colors">
            {resource.title}
          </span>
          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {resourceLabels[resource.type]}
          </Badge>
          {resource.relevance === 'high' && (
            <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400">
              Recommended
            </Badge>
          )}
        </div>
      </div>
    </a>
  );
}

export function ExternalResourceLinks({ references, tags }: ExternalResourceLinksProps) {
  // Extract CWE IDs from references (combine all references into single string for extraction)
  const cweIds = extractCWEIds(references.join(' '));

  // Get relevant external resources
  const resources = getExternalResources(cweIds, tags);

  // Don't render if no resources found
  if (resources.length === 0) {
    return null;
  }

  // Group resources by type
  const groupedResources = resources.reduce((acc, resource) => {
    if (!acc[resource.type]) {
      acc[resource.type] = [];
    }
    acc[resource.type].push(resource);
    return acc;
  }, {} as Record<ExternalResource['type'], ExternalResource[]>);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          Security Resources
          <Badge variant="outline" className="ml-2">
            {resources.length} resource{resources.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* OWASP resources first (highest priority) */}
          {groupedResources.owasp && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                OWASP Cheat Sheets
              </h4>
              <div className="grid gap-2">
                {groupedResources.owasp.map((resource, idx) => (
                  <ResourceLink key={idx} resource={resource} />
                ))}
              </div>
            </div>
          )}

          {/* HackTricks resources */}
          {groupedResources.hacktricks && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                HackTricks
              </h4>
              <div className="grid gap-2">
                {groupedResources.hacktricks.map((resource, idx) => (
                  <ResourceLink key={idx} resource={resource} />
                ))}
              </div>
            </div>
          )}

          {/* PortSwigger resources */}
          {groupedResources.portswigger && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                PortSwigger Academy
              </h4>
              <div className="grid gap-2">
                {groupedResources.portswigger.map((resource, idx) => (
                  <ResourceLink key={idx} resource={resource} />
                ))}
              </div>
            </div>
          )}

          {/* Technology-specific docs */}
          {groupedResources.technology && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Technology Documentation
              </h4>
              <div className="grid gap-2">
                {groupedResources.technology.map((resource, idx) => (
                  <ResourceLink key={idx} resource={resource} />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
