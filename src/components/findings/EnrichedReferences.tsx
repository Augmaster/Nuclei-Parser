import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  FileText,
  AlertTriangle,
  Shield,
  Code,
  BookOpen,
  Github,
  Link as LinkIcon,
  Database,
} from 'lucide-react';
import type { ReferenceLink, ReferenceLinkType } from '@/types/nuclei';
import {
  categorizeReferences,
  groupReferencesByCategory,
  getNonEmptyCategories,
  categoryMeta,
} from '@/services/enrichment/referenceCategorizer';

interface EnrichedReferencesProps {
  references: string[];
}

// Icons for each category
const categoryIcons: Record<ReferenceLinkType, React.ReactNode> = {
  cve: <AlertTriangle className="h-4 w-4" />,
  cwe: <Shield className="h-4 w-4" />,
  nvd: <Database className="h-4 w-4" />,
  exploit: <Code className="h-4 w-4" />,
  advisory: <FileText className="h-4 w-4" />,
  patch: <Shield className="h-4 w-4" />,
  documentation: <BookOpen className="h-4 w-4" />,
  github: <Github className="h-4 w-4" />,
  other: <LinkIcon className="h-4 w-4" />,
};

// Colors for category badges
const categoryColors: Record<ReferenceLinkType, string> = {
  cve: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  cwe: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  nvd: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  exploit: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  advisory: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  patch: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  documentation: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  github: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
  other: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

function ReferenceItem({ refLink }: { refLink: ReferenceLink }) {
  return (
    <a
      href={refLink.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <span className="text-muted-foreground mt-0.5">
        {categoryIcons[refLink.type]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary group-hover:underline truncate">
            {refLink.title}
          </span>
          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
        <span className="text-xs text-muted-foreground truncate block">
          {refLink.url}
        </span>
      </div>
    </a>
  );
}

export function EnrichedReferences({ references }: EnrichedReferencesProps) {
  const [activeTab, setActiveTab] = useState<string>('all');

  const { categorized, grouped, nonEmptyCategories } = useMemo(() => {
    const categorized = categorizeReferences(references);
    const grouped = groupReferencesByCategory(categorized);
    const nonEmptyCategories = getNonEmptyCategories(grouped);
    return { categorized, grouped, nonEmptyCategories };
  }, [references]);

  if (references.length === 0) {
    return null;
  }

  // If there are very few references or only one category, show simple list
  if (references.length <= 3 || nonEmptyCategories.length <= 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">References</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {categorized.map((ref, index) => (
            <ReferenceItem key={index} refLink={ref} />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Priority order for tabs
  const tabOrder: ReferenceLinkType[] = [
    'exploit',
    'cve',
    'advisory',
    'documentation',
    'github',
    'patch',
    'cwe',
    'nvd',
    'other',
  ];

  const orderedCategories = tabOrder.filter(cat =>
    nonEmptyCategories.includes(cat)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            References ({references.length})
          </CardTitle>
          <div className="flex gap-1.5">
            {orderedCategories.slice(0, 4).map(cat => (
              <Badge
                key={cat}
                variant="outline"
                className={`text-xs ${categoryColors[cat]}`}
              >
                {grouped[cat].length} {categoryMeta[cat].label}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-8 p-0.5 mb-3">
            <TabsTrigger value="all" className="text-xs h-7 px-2">
              All ({references.length})
            </TabsTrigger>
            {orderedCategories.map(cat => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="text-xs h-7 px-2 gap-1"
              >
                {categoryIcons[cat]}
                <span className="hidden sm:inline">{categoryMeta[cat].label}</span>
                <span className="text-muted-foreground">({grouped[cat].length})</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-0 space-y-1 max-h-60 overflow-y-auto">
            {categorized.map((ref, index) => (
              <ReferenceItem key={index} refLink={ref} />
            ))}
          </TabsContent>

          {orderedCategories.map(cat => (
            <TabsContent
              key={cat}
              value={cat}
              className="mt-0 space-y-1 max-h-60 overflow-y-auto"
            >
              {grouped[cat].map((ref, index) => (
                <ReferenceItem key={index} refLink={ref} />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
