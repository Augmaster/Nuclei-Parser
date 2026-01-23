import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatTimestamp } from '@/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Upload,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SeverityBadge } from './SeverityBadge';
import {
  useFindingsStore,
  useFilteredFindings,
  useUniqueHosts,
  useUniqueTemplates,
  useFilters,
} from '@/store/findingsStore';
import type { Severity } from '@/types/nuclei';

type SortField = 'severity' | 'templateId' | 'host' | 'timestamp';
type SortDirection = 'asc' | 'desc';

const severityOrder: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
  unknown: 5,
};

export function FindingsTable() {
  const navigate = useNavigate();
  const findings = useFilteredFindings();
  const filters = useFilters();
  const setFilters = useFindingsStore(state => state.setFilters);
  const resetFilters = useFindingsStore(state => state.resetFilters);
  const uniqueHosts = useUniqueHosts();
  const uniqueTemplates = useUniqueTemplates();

  const [sortField, setSortField] = useState<SortField>('severity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const sortedFindings = useMemo(() => {
    return [...findings].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'severity':
          comparison =
            severityOrder[a.info.severity] - severityOrder[b.info.severity];
          break;
        case 'templateId':
          comparison = a.templateId.localeCompare(b.templateId);
          break;
        case 'host':
          comparison = a.host.localeCompare(b.host);
          break;
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [findings, sortField, sortDirection]);

  const paginatedFindings = useMemo(() => {
    const start = page * pageSize;
    return sortedFindings.slice(start, start + pageSize);
  }, [sortedFindings, page, pageSize]);

  const totalPages = Math.ceil(sortedFindings.length / pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 ml-1 text-primary" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1 text-primary" />
    );
  };

  const hasActiveFilters =
    filters.search ||
    filters.severities.length > 0 ||
    filters.hosts.length > 0 ||
    filters.templates.length > 0;

  const activeFilterCount = [
    filters.search ? 1 : 0,
    filters.severities.length,
    filters.hosts.length,
    filters.templates.length,
  ].reduce((a, b) => a + b, 0);

  if (findings.length === 0 && !hasActiveFilters) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Filter className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium mb-1">No findings loaded</p>
          <p className="text-sm text-muted-foreground mb-4">
            Upload Nuclei scan output files to see findings here
          </p>
          <Button onClick={() => navigate('/upload')} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Files
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by template, host, tag..."
                value={filters.search}
                onChange={e => setFilters({ search: e.target.value })}
                className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>

            <Select
              value={filters.severities[0] || 'all'}
              onValueChange={value =>
                setFilters({ severities: value === 'all' ? [] : [value as Severity] })
              }
            >
              <SelectTrigger className="w-[140px] bg-muted/50 border-0">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.hosts[0] || 'all'}
              onValueChange={value =>
                setFilters({ hosts: value === 'all' ? [] : [value] })
              }
            >
              <SelectTrigger className="w-[180px] bg-muted/50 border-0">
                <SelectValue placeholder="Host" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hosts</SelectItem>
                {uniqueHosts.filter(h => h && h.trim()).slice(0, 50).map(host => (
                  <SelectItem key={host} value={host}>
                    {host.length > 35 ? host.slice(0, 35) + '...' : host}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.templates[0] || 'all'}
              onValueChange={value =>
                setFilters({ templates: value === 'all' ? [] : [value] })
              }
            >
              <SelectTrigger className="w-[180px] bg-muted/50 border-0">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                {uniqueTemplates.filter(t => t && t.trim()).slice(0, 50).map(template => (
                  <SelectItem key={template} value={template}>
                    {template.length > 35 ? template.slice(0, 35) + '...' : template}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear ({activeFilterCount})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{paginatedFindings.length}</span> of{' '}
            <span className="font-medium text-foreground">{sortedFindings.length}</span> findings
          </span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              Filtered
            </Badge>
          )}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead
                className="cursor-pointer select-none hover:text-foreground transition-colors w-[110px]"
                onClick={() => handleSort('severity')}
                aria-sort={sortField === 'severity' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                role="columnheader"
              >
                <div className="flex items-center">
                  Severity
                  <SortIcon field="severity" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:text-foreground transition-colors"
                onClick={() => handleSort('templateId')}
                aria-sort={sortField === 'templateId' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                role="columnheader"
              >
                <div className="flex items-center">
                  Template
                  <SortIcon field="templateId" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:text-foreground transition-colors"
                onClick={() => handleSort('host')}
                aria-sort={sortField === 'host' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                role="columnheader"
              >
                <div className="flex items-center">
                  Host
                  <SortIcon field="host" />
                </div>
              </TableHead>
              <TableHead>Matched At</TableHead>
              <TableHead
                className="cursor-pointer select-none hover:text-foreground transition-colors"
                onClick={() => handleSort('timestamp')}
                aria-sort={sortField === 'timestamp' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                role="columnheader"
              >
                <div className="flex items-center">
                  Timestamp
                  <SortIcon field="timestamp" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFindings.map(finding => (
              <TableRow
                key={finding.id}
                className="cursor-pointer group"
                onClick={() => navigate(`/findings/${finding.id}`)}
              >
                <TableCell>
                  <SeverityBadge severity={finding.info.severity} />
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm group-hover:text-primary transition-colors">
                    {finding.templateId}
                  </span>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <span className="truncate block" title={finding.host || 'No host'}>
                    {finding.host || <span className="text-muted-foreground italic">N/A</span>}
                  </span>
                </TableCell>
                <TableCell className="max-w-[250px]">
                  <span className="truncate block text-muted-foreground text-sm" title={finding.matchedAt || 'No match location'}>
                    {finding.matchedAt || <span className="italic">N/A</span>}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatTimestamp(finding.timestamp)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Go to previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              aria-label="Go to next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
