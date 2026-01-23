import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Server,
  AlertTriangle,
  Shield,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HostRiskCard, RiskScoreBadge } from '@/components/host/HostRiskCard';
import { useFilteredFindings, useFindingsStore } from '@/store/findingsStore';
import { useActiveProjectId, useActiveProject } from '@/store/organizationStore';
import {
  calculateAllHostRisks,
  getRiskSummaryStats,
} from '@/lib/riskScoring';

type SortField = 'host' | 'riskScore' | 'critical' | 'high' | 'total';
type SortDirection = 'asc' | 'desc';

export function HostRiskPage() {
  const navigate = useNavigate();
  const findings = useFilteredFindings();
  const setFilters = useFindingsStore(state => state.setFilters);
  const activeProjectId = useActiveProjectId();
  const activeProject = useActiveProject();

  const [sortField, setSortField] = useState<SortField>('riskScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Calculate host risks
  const hostRisks = useMemo(() => {
    return calculateAllHostRisks(findings);
  }, [findings]);

  // Sort host risks
  const sortedHostRisks = useMemo(() => {
    return [...hostRisks].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'host':
          comparison = a.host.localeCompare(b.host);
          break;
        case 'riskScore':
          comparison = a.riskScore - b.riskScore;
          break;
        case 'critical':
          comparison = a.severityBreakdown.critical - b.severityBreakdown.critical;
          break;
        case 'high':
          comparison = a.severityBreakdown.high - b.severityBreakdown.high;
          break;
        case 'total':
          comparison = a.totalFindings - b.totalFindings;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [hostRisks, sortField, sortDirection]);

  // Summary stats
  const summaryStats = useMemo(() => {
    return getRiskSummaryStats(hostRisks);
  }, [hostRisks]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleHostClick = (host: string) => {
    setFilters({ hosts: [host] });
    navigate('/findings');
  };

  // Show message if no project selected
  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
        <p className="text-muted-foreground">
          Select a project from the sidebar to view host risk analysis.
        </p>
      </div>
    );
  }

  // Show message if no findings
  if (findings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Server className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Findings</h2>
        <p className="text-muted-foreground mb-4">
          Upload Nuclei scan results to see host risk analysis.
        </p>
        <Button onClick={() => navigate('/upload')}>Upload Files</Button>
      </div>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 ml-1 text-primary" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1 text-primary" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Host Risk Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Risk assessment for <span className="text-foreground font-medium">{activeProject?.name}</span>
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Hosts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{hostRisks.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={summaryStats.criticalRiskHosts > 0 ? 'border-red-500/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-600">{summaryStats.criticalRiskHosts}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={summaryStats.highRiskHosts > 0 ? 'border-orange-500/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold text-orange-600">{summaryStats.highRiskHosts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Medium/Low Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">
                {summaryStats.mediumRiskHosts + summaryStats.lowRiskHosts + summaryStats.minimalRiskHosts}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{summaryStats.averageRiskScore}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {hostRisks.length} host{hostRisks.length !== 1 ? 's' : ''} analyzed
        </span>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            Cards
          </Button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead
                  className="cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort('host')}
                >
                  <div className="flex items-center">
                    Host
                    <SortIcon field="host" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-foreground transition-colors w-[120px]"
                  onClick={() => handleSort('riskScore')}
                >
                  <div className="flex items-center">
                    Risk Score
                    <SortIcon field="riskScore" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-foreground transition-colors w-[100px]"
                  onClick={() => handleSort('critical')}
                >
                  <div className="flex items-center">
                    Critical
                    <SortIcon field="critical" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-foreground transition-colors w-[100px]"
                  onClick={() => handleSort('high')}
                >
                  <div className="flex items-center">
                    High
                    <SortIcon field="high" />
                  </div>
                </TableHead>
                <TableHead className="w-[180px]">Distribution</TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-foreground transition-colors w-[80px]"
                  onClick={() => handleSort('total')}
                >
                  <div className="flex items-center">
                    Total
                    <SortIcon field="total" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHostRisks.map((hostRisk) => (
                <TableRow
                  key={hostRisk.host}
                  className="cursor-pointer"
                  onClick={() => handleHostClick(hostRisk.host)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium truncate max-w-[300px]" title={hostRisk.host}>
                        {hostRisk.host}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <RiskScoreBadge score={hostRisk.riskScore} level={hostRisk.riskLevel} />
                      <Progress value={hostRisk.riskScore} className="h-2 w-16" />
                    </div>
                  </TableCell>
                  <TableCell>
                    {hostRisk.severityBreakdown.critical > 0 ? (
                      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                        {hostRisk.severityBreakdown.critical}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {hostRisk.severityBreakdown.high > 0 ? (
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                        {hostRisk.severityBreakdown.high}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {hostRisk.severityBreakdown.critical > 0 && (
                        <div
                          className="h-2 bg-red-500 rounded-full"
                          style={{
                            width: `${(hostRisk.severityBreakdown.critical / hostRisk.totalFindings) * 100}%`,
                            minWidth: '4px',
                          }}
                          title={`${hostRisk.severityBreakdown.critical} critical`}
                        />
                      )}
                      {hostRisk.severityBreakdown.high > 0 && (
                        <div
                          className="h-2 bg-orange-500 rounded-full"
                          style={{
                            width: `${(hostRisk.severityBreakdown.high / hostRisk.totalFindings) * 100}%`,
                            minWidth: '4px',
                          }}
                          title={`${hostRisk.severityBreakdown.high} high`}
                        />
                      )}
                      {hostRisk.severityBreakdown.medium > 0 && (
                        <div
                          className="h-2 bg-yellow-500 rounded-full"
                          style={{
                            width: `${(hostRisk.severityBreakdown.medium / hostRisk.totalFindings) * 100}%`,
                            minWidth: '4px',
                          }}
                          title={`${hostRisk.severityBreakdown.medium} medium`}
                        />
                      )}
                      {hostRisk.severityBreakdown.low > 0 && (
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{
                            width: `${(hostRisk.severityBreakdown.low / hostRisk.totalFindings) * 100}%`,
                            minWidth: '4px',
                          }}
                          title={`${hostRisk.severityBreakdown.low} low`}
                        />
                      )}
                      {hostRisk.severityBreakdown.info > 0 && (
                        <div
                          className="h-2 bg-slate-400 rounded-full"
                          style={{
                            width: `${(hostRisk.severityBreakdown.info / hostRisk.totalFindings) * 100}%`,
                            minWidth: '4px',
                          }}
                          title={`${hostRisk.severityBreakdown.info} info`}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{hostRisk.totalFindings}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedHostRisks.map((hostRisk) => (
            <HostRiskCard
              key={hostRisk.host}
              data={hostRisk}
              onClick={() => handleHostClick(hostRisk.host)}
              showTopFindings
            />
          ))}
        </div>
      )}
    </div>
  );
}
