import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileJson, FileText, FileCode, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useFilteredFindings, useStats, useFilters } from '@/store/findingsStore';
import { downloadExport, getExportContent, type ExportFormat, type ExportOptions } from '@/services/exporters';

const formatOptions: {
  id: ExportFormat;
  name: string;
  description: string;
  icon: typeof FileJson;
}[] = [
  {
    id: 'json',
    name: 'JSON',
    description: 'Raw JSON array of findings. Best for programmatic access.',
    icon: FileJson,
  },
  {
    id: 'csv',
    name: 'CSV',
    description: 'Comma-separated values. Best for spreadsheets and data analysis.',
    icon: FileText,
  },
  {
    id: 'nessus',
    name: 'Nessus XML',
    description: 'NessusClientData_v2 format. Import into Tenable or Nessus.',
    icon: FileCode,
  },
];

export function ExportPage() {
  const navigate = useNavigate();
  const findings = useFilteredFindings();
  const stats = useStats();
  const filters = useFilters();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [exported, setExported] = useState(false);

  // Nessus export options
  const [assetGroup, setAssetGroup] = useState('');
  const [reportName, setReportName] = useState('');

  const hasActiveFilters =
    filters.search ||
    filters.severities.length > 0 ||
    filters.hosts.length > 0 ||
    filters.templates.length > 0;

  const getExportOptions = (): ExportOptions => {
    if (selectedFormat === 'nessus') {
      return {
        nessus: {
          assetGroup: assetGroup.trim() || undefined,
          reportName: reportName.trim() || undefined,
        },
      };
    }
    return {};
  };

  const handleExport = () => {
    downloadExport(findings, selectedFormat, undefined, getExportOptions());
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  if (stats.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Download className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">No Findings to Export</h1>
        <p className="text-muted-foreground mb-6">
          Upload Nuclei scan output files first
        </p>
        <Button onClick={() => navigate('/upload')}>Upload Files</Button>
      </div>
    );
  }

  const previewContent = getExportContent(findings.slice(0, 5), selectedFormat, getExportOptions());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Export</h1>
        <p className="text-muted-foreground">
          Export {findings.length} findings
          {hasActiveFilters && ' (filtered)'} to your preferred format
        </p>
      </div>

      {/* Format Selection */}
      <div className="grid gap-4 md:grid-cols-3">
        {formatOptions.map(format => (
          <Card
            key={format.id}
            className={`cursor-pointer transition-colors ${
              selectedFormat === format.id
                ? 'border-primary ring-1 ring-primary'
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedFormat(format.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <format.icon className="h-8 w-8 text-muted-foreground" />
                {selectedFormat === format.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
              <CardTitle className="text-lg">{format.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{format.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nessus Options */}
      {selectedFormat === 'nessus' && (
        <Card>
          <CardHeader>
            <CardTitle>Nessus Export Options</CardTitle>
            <CardDescription>
              Configure optional metadata for the Nessus XML export
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="assetGroup" className="text-sm font-medium">
                  Asset Group
                </label>
                <Input
                  id="assetGroup"
                  placeholder="e.g., Production Servers"
                  value={assetGroup}
                  onChange={(e) => setAssetGroup(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Optional asset group name for organization
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="reportName" className="text-sm font-medium">
                  Report Name
                </label>
                <Input
                  id="reportName"
                  placeholder="e.g., Q1 2024 Security Scan"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Custom name for the exported report
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Export Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Findings</p>
              <p className="text-2xl font-bold">{findings.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Critical</p>
              <p className="text-2xl font-bold text-red-500">
                {findings.filter(f => f.info.severity === 'critical').length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">High</p>
              <p className="text-2xl font-bold text-orange-500">
                {findings.filter(f => f.info.severity === 'high').length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Format</p>
              <p className="text-2xl font-bold">
                {formatOptions.find(f => f.id === selectedFormat)?.name}
              </p>
            </div>
          </div>

          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground">
              Note: Export includes only filtered results. Clear filters to export all findings.
            </p>
          )}

          <Button
            size="lg"
            className="w-full"
            onClick={handleExport}
            disabled={findings.length === 0}
          >
            {exported ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download {formatOptions.find(f => f.id === selectedFormat)?.name}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview (first 5 findings)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-96">
            {previewContent}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
