import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatTimestamp } from '@/lib/utils';
import { toast } from 'sonner';
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
  MoreHorizontal,
  Eye,
  Copy,
  ExternalLink,
  FileText,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { SeverityBadge } from './SeverityBadge';
import { BulkActionBar } from './BulkActionBar';
import {
  useFindingsStore,
  useFilteredFindings,
  useUniqueHosts,
  useUniqueTemplates,
  useUniqueTags,
  useUniqueTypes,
  useFilters,
} from '@/store/findingsStore';
import { formatAsMarkdown, formatAsGitHubIssue, copyToClipboard as copyFormat } from '@/lib/copyFormats';
import type { Severity, FindingStatus } from '@/types/nuclei';

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

// Severity options for multi-select
const severityOptions: MultiSelectOption[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'info', label: 'Info' },
];

// Helper to copy text to clipboard
const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  } catch {
    toast.error('Failed to copy to clipboard');
  }
};

// SortIcon component - moved outside to avoid recreation during render
interface SortIconProps {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
}

function SortIcon({ field, sortField, sortDirection }: SortIconProps) {
  if (sortField !== field) return <ChevronsUpDown className="h-4 w-4 ml-1 opacity-50" />;
  return sortDirection === 'asc' ? (
    <ChevronUp className="h-4 w-4 ml-1 text-primary" />
  ) : (
    <ChevronDown className="h-4 w-4 ml-1 text-primary" />
  );
}

export function FindingsTable() {
  const navigate = useNavigate();
  const findings = useFilteredFindings();
  const filters = useFilters();
  const setFilters = useFindingsStore(state => state.setFilters);
  const resetFilters = useFindingsStore(state => state.resetFilters);
  const bulkUpdateStatus = useFindingsStore(state => state.bulkUpdateStatus);
  const uniqueHosts = useUniqueHosts();
  const uniqueTemplates = useUniqueTemplates();
  const uniqueTags = useUniqueTags();
  const uniqueTypes = useUniqueTypes();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Convert to MultiSelectOption format
  const hostOptions: MultiSelectOption[] = useMemo(
    () => uniqueHosts.filter(h => h?.trim()).slice(0, 100).map(h => ({
      value: h,
      label: h.length > 40 ? h.slice(0, 40) + '...' : h,
    })),
    [uniqueHosts]
  );

  const templateOptions: MultiSelectOption[] = useMemo(
    () => uniqueTemplates.filter(t => t?.trim()).slice(0, 100).map(t => ({
      value: t,
      label: t.length > 40 ? t.slice(0, 40) + '...' : t,
    })),
    [uniqueTemplates]
  );

  const tagOptions: MultiSelectOption[] = useMemo(
    () => uniqueTags.filter(t => t?.trim()).slice(0, 100).map(t => ({
      value: t,
      label: t,
    })),
    [uniqueTags]
  );

  const typeOptions: MultiSelectOption[] = useMemo(
    () => uniqueTypes.filter(t => t?.trim()).map(t => ({
      value: t,
      label: t,
    })),
    [uniqueTypes]
  );

  const [sortField, setSortField] = useState<SortField>('severity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  // Selection helpers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkStatusChange = useCallback(async (status: FindingStatus, reason?: string) => {
    await bulkUpdateStatus(Array.from(selectedIds), status, reason);
  }, [selectedIds, bulkUpdateStatus]);

  // Get selected findings for bulk actions
  const selectedFindings = useMemo(() => {
    return findings.filter(f => selectedIds.has(f.id));
  }, [findings, selectedIds]);

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

  // Page-level selection helpers
  const selectedOnPage = useMemo(() => {
    return paginatedFindings.filter(f => selectedIds.has(f.id)).length;
  }, [paginatedFindings, selectedIds]);

  const isAllPageSelected = selectedOnPage === paginatedFindings.length && paginatedFindings.length > 0;
  const isPartialPageSelected = selectedOnPage > 0 && selectedOnPage < paginatedFindings.length;

  const togglePageSelection = useCallback(() => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (isAllPageSelected) {
        // Deselect all on page
        for (const f of paginatedFindings) {
          next.delete(f.id);
        }
      } else {
        // Select all on page
        for (const f of paginatedFindings) {
          next.add(f.id);
        }
      }
      return next;
    });
  }, [isAllPageSelected, paginatedFindings]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const hasActiveFilters =
    filters.search ||
    filters.severities.length > 0 ||
    filters.hosts.length > 0 ||
    filters.templates.length > 0 ||
    filters.tags.length > 0 ||
    filters.types.length > 0;

  const activeFilterCount = [
    filters.search ? 1 : 0,
    filters.severities.length,
    filters.hosts.length,
    filters.templates.length,
    filters.tags.length,
    filters.types.length,
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

            <MultiSelect
              options={severityOptions}
              selected={filters.severities}
              onChange={(severities) => setFilters({ severities: severities as Severity[] })}
              placeholder="Severity"
              className="w-[140px]"
            />

            <MultiSelect
              options={hostOptions}
              selected={filters.hosts}
              onChange={(hosts) => setFilters({ hosts })}
              placeholder="Host"
              className="w-[160px]"
            />

            <MultiSelect
              options={templateOptions}
              selected={filters.templates}
              onChange={(templates) => setFilters({ templates })}
              placeholder="Template"
              className="w-[160px]"
            />

            <MultiSelect
              options={tagOptions}
              selected={filters.tags}
              onChange={(tags) => setFilters({ tags })}
              placeholder="Tag"
              className="w-[140px]"
            />

            <MultiSelect
              options={typeOptions}
              selected={filters.types}
              onChange={(types) => setFilters({ types })}
              placeholder="Type"
              className="w-[120px]"
            />

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

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedFindings={selectedFindings}
        onClearSelection={clearSelection}
        onBulkStatusChange={handleBulkStatusChange}
      />

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={isAllPageSelected ? true : isPartialPageSelected ? 'indeterminate' : false}
                  onCheckedChange={togglePageSelection}
                  aria-label="Select all on page"
                />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:text-foreground transition-colors w-[110px]"
                onClick={() => handleSort('severity')}
                aria-sort={sortField === 'severity' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                role="columnheader"
              >
                <div className="flex items-center">
                  Severity
                  <SortIcon field="severity" sortField={sortField} sortDirection={sortDirection} />
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
                  <SortIcon field="templateId" sortField={sortField} sortDirection={sortDirection} />
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
                  <SortIcon field="host" sortField={sortField} sortDirection={sortDirection} />
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
                  <SortIcon field="timestamp" sortField={sortField} sortDirection={sortDirection} />
                </div>
              </TableHead>
              <TableHead className="w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFindings.map(finding => (
              <TableRow
                key={finding.id}
                className="cursor-pointer group"
                onClick={() => navigate(`/findings/${finding.id}`)}
                data-selected={selectedIds.has(finding.id) || undefined}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(finding.id)}
                    onCheckedChange={() => toggleSelection(finding.id)}
                    aria-label={`Select finding ${finding.info.name}`}
                  />
                </TableCell>
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
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/findings/${finding.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {finding.curlCommand && (
                        <DropdownMenuItem onClick={() => copyToClipboard(finding.curlCommand!, 'cURL command')}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy cURL
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => copyToClipboard(finding.matchedAt || finding.host, 'URL')}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => copyFormat(formatAsMarkdown([finding]), 'Markdown')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Copy as Markdown
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyFormat(formatAsGitHubIssue(finding), 'GitHub Issue')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Copy as GitHub Issue
                      </DropdownMenuItem>
                      {finding.templateUrl && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => window.open(finding.templateUrl, '_blank')}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Template
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
