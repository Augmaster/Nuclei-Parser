import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitCompare,
  Plus,
  Minus,
  Equal,
  TrendingUp,
  TrendingDown,
  Minus as TrendingFlat,
  ArrowRight,
  Database,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SeverityBadge } from '@/components/findings/SeverityBadge';
import { ScanSelector, ScanBadge } from '@/components/comparison/ScanSelector';
import { useFilteredFindings } from '@/store/findingsStore';
import { useActiveProjectId, useActiveProject } from '@/store/organizationStore';
import * as db from '@/services/db/indexedDB';
import { compareScanFindings, getFindingsForScan } from '@/services/comparison/scanComparator';
import type { Scan, NucleiFinding, ScanComparisonResult } from '@/types/nuclei';
import { cn } from '@/lib/utils';

const TrendIcon = {
  improved: TrendingUp,
  degraded: TrendingDown,
  stable: TrendingFlat,
};

const trendColors = {
  improved: 'text-green-600 bg-green-500/10 border-green-500/30',
  degraded: 'text-red-600 bg-red-500/10 border-red-500/30',
  stable: 'text-blue-600 bg-blue-500/10 border-blue-500/30',
};

const trendLabels = {
  improved: 'Improved',
  degraded: 'Degraded',
  stable: 'Stable',
};

export function ScanComparisonPage() {
  const navigate = useNavigate();
  const allFindings = useFilteredFindings();
  const activeProjectId = useActiveProjectId();
  const activeProject = useActiveProject();

  const [scans, setScans] = useState<Scan[]>([]);
  const [baseScanId, setBaseScanId] = useState<string | null>(null);
  const [compareScanId, setCompareScanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'resolved' | 'persisted'>('new');

  // Load scans for the project
  useEffect(() => {
    async function loadScans() {
      if (!activeProjectId) {
        setScans([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const projectScans = await db.getScansByProject(activeProjectId);
        setScans(projectScans);
      } catch (error) {
        console.error('Failed to load scans:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadScans();
  }, [activeProjectId]);

  // Calculate comparison result
  const comparisonResult = useMemo<ScanComparisonResult | null>(() => {
    if (!baseScanId || !compareScanId) return null;

    const baseScan = scans.find(s => s.id === baseScanId);
    const compareScan = scans.find(s => s.id === compareScanId);

    if (!baseScan || !compareScan) return null;

    const baseFindings = getFindingsForScan(allFindings, baseScan);
    const compareFindings = getFindingsForScan(allFindings, compareScan);

    return compareScanFindings(baseFindings, compareFindings);
  }, [baseScanId, compareScanId, scans, allFindings]);

  const handleFindingClick = (finding: NucleiFinding) => {
    navigate(`/findings/${finding.id}`);
  };

  // Show message if no project selected
  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <GitCompare className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
        <p className="text-muted-foreground">
          Select a project from the sidebar to compare scans.
        </p>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
        <p className="text-muted-foreground">Loading scans...</p>
      </div>
    );
  }

  // Show message if no scans
  if (scans.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Database className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Not Enough Scans</h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          You need at least 2 saved scans to compare. Upload Nuclei results and save them as scans to enable comparison.
        </p>
        <Button onClick={() => navigate('/upload')}>Upload Files</Button>
      </div>
    );
  }

  const baseScan = scans.find(s => s.id === baseScanId);
  const compareScan = scans.find(s => s.id === compareScanId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scan Comparison</h1>
        <p className="text-muted-foreground mt-1">
          Compare scans for <span className="text-foreground font-medium">{activeProject?.name}</span>
        </p>
      </div>

      {/* Scan Selectors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Scans to Compare</CardTitle>
          <CardDescription>
            Choose a baseline scan and a scan to compare against it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <ScanSelector
              scans={scans}
              selectedScanId={baseScanId}
              onSelectScan={setBaseScanId}
              label="Base Scan (Before)"
              placeholder="Select baseline scan..."
              excludeScanId={compareScanId || undefined}
              className="flex-1"
            />
            <div className="flex items-center justify-center pt-6">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
            <ScanSelector
              scans={scans}
              selectedScanId={compareScanId}
              onSelectScan={setCompareScanId}
              label="Compare Scan (After)"
              placeholder="Select comparison scan..."
              excludeScanId={baseScanId || undefined}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparisonResult && baseScan && compareScan && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            {/* Trend Card */}
            <Card className={cn('border-2', trendColors[comparisonResult.statistics.trend])}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = TrendIcon[comparisonResult.statistics.trend];
                    return <Icon className={cn('h-6 w-6', trendColors[comparisonResult.statistics.trend].split(' ')[0])} />;
                  })()}
                  <span className={cn('text-2xl font-bold', trendColors[comparisonResult.statistics.trend].split(' ')[0])}>
                    {trendLabels[comparisonResult.statistics.trend]}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* New Findings */}
            <Card className={comparisonResult.statistics.newCount > 0 ? 'border-red-500/50' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">New Findings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-red-500" />
                  <span className={cn('text-2xl font-bold', comparisonResult.statistics.newCount > 0 && 'text-red-600')}>
                    +{comparisonResult.statistics.newCount}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Resolved Findings */}
            <Card className={comparisonResult.statistics.resolvedCount > 0 ? 'border-green-500/50' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Minus className="h-5 w-5 text-green-500" />
                  <span className={cn('text-2xl font-bold', comparisonResult.statistics.resolvedCount > 0 && 'text-green-600')}>
                    -{comparisonResult.statistics.resolvedCount}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Persisted Findings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Persisted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Equal className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{comparisonResult.statistics.persistedCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scan Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Base Scan</span>
              <ScanBadge scan={baseScan} />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Compare Scan</span>
              <ScanBadge scan={compareScan} />
            </div>
          </div>

          {/* Findings Tabs */}
          <Card>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <CardHeader className="pb-0">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="new" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New ({comparisonResult.statistics.newCount})
                  </TabsTrigger>
                  <TabsTrigger value="resolved" className="gap-2">
                    <Minus className="h-4 w-4" />
                    Resolved ({comparisonResult.statistics.resolvedCount})
                  </TabsTrigger>
                  <TabsTrigger value="persisted" className="gap-2">
                    <Equal className="h-4 w-4" />
                    Persisted ({comparisonResult.statistics.persistedCount})
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-4">
                <TabsContent value="new" className="mt-0">
                  <FindingsTable
                    findings={comparisonResult.newFindings}
                    onFindingClick={handleFindingClick}
                    emptyMessage="No new findings in the comparison scan"
                    highlightColor="red"
                  />
                </TabsContent>
                <TabsContent value="resolved" className="mt-0">
                  <FindingsTable
                    findings={comparisonResult.resolvedFindings}
                    onFindingClick={handleFindingClick}
                    emptyMessage="No resolved findings between scans"
                    highlightColor="green"
                  />
                </TabsContent>
                <TabsContent value="persisted" className="mt-0">
                  <FindingsTable
                    findings={comparisonResult.persistedFindings}
                    onFindingClick={handleFindingClick}
                    emptyMessage="No persisted findings between scans"
                    highlightColor="gray"
                  />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </>
      )}

      {/* Prompt to select scans */}
      {(!baseScanId || !compareScanId) && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <GitCompare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Select Scans to Compare</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Choose a base scan and a comparison scan above to see what findings are new, resolved, or persisted between them.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Internal component for findings table
function FindingsTable({
  findings,
  onFindingClick,
  emptyMessage,
  highlightColor,
}: {
  findings: NucleiFinding[];
  onFindingClick: (finding: NucleiFinding) => void;
  emptyMessage: string;
  highlightColor: 'red' | 'green' | 'gray';
}) {
  if (findings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const highlightClasses = {
    red: 'hover:bg-red-500/5',
    green: 'hover:bg-green-500/5',
    gray: 'hover:bg-muted/50',
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Severity</TableHead>
          <TableHead>Template</TableHead>
          <TableHead>Host</TableHead>
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {findings.slice(0, 50).map((finding) => (
          <TableRow
            key={finding.id}
            className={cn('cursor-pointer', highlightClasses[highlightColor])}
            onClick={() => onFindingClick(finding)}
          >
            <TableCell>
              <SeverityBadge severity={finding.info.severity} />
            </TableCell>
            <TableCell className="font-mono text-sm">
              {finding.templateId}
            </TableCell>
            <TableCell className="max-w-[200px] truncate" title={finding.host}>
              {finding.host}
            </TableCell>
            <TableCell className="max-w-[300px] truncate" title={finding.info.name}>
              {finding.info.name}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
