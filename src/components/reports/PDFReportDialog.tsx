import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { NucleiFinding, Severity, Stats } from '@/types/nuclei';
import { generatePDFReport, type PDFReportOptions } from '@/services/exporters/pdfExporter';
import { toast } from 'sonner';

interface PDFReportDialogProps {
  findings: NucleiFinding[];
  stats: Stats;
  projectName?: string;
  companyName?: string;
  disabled?: boolean;
}

const severityOptions: { value: Severity; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'info', label: 'Info' },
];

export function PDFReportDialog({
  findings,
  stats,
  projectName = '',
  companyName = '',
  disabled = false,
}: PDFReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<PDFReportOptions>({
    title: 'Security Assessment Report',
    projectName,
    companyName,
    preparedBy: '',
    includeDescription: true,
    includeRemediation: true,
    includeCurl: false,
    severityFilter: [],
    maxFindings: 0,
  });

  const handleSeverityToggle = (severity: Severity) => {
    setOptions((prev) => {
      const current = prev.severityFilter || [];
      if (current.includes(severity)) {
        return {
          ...prev,
          severityFilter: current.filter((s) => s !== severity),
        };
      }
      return {
        ...prev,
        severityFilter: [...current, severity],
      };
    });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generatePDFReport(findings, stats, options);
      toast.success('PDF report generated successfully!');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={disabled || findings.length === 0}>
          <FileText className="h-4 w-4" />
          Export PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate PDF Report</DialogTitle>
          <DialogDescription>
            Configure your security assessment report options.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Report Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Report Title</Label>
            <Input
              id="title"
              value={options.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setOptions((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Security Assessment Report"
            />
          </div>

          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={options.projectName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setOptions((prev) => ({ ...prev, projectName: e.target.value }))
              }
              placeholder="My Project"
            />
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={options.companyName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setOptions((prev) => ({ ...prev, companyName: e.target.value }))
              }
              placeholder="Acme Corp"
            />
          </div>

          {/* Prepared By */}
          <div className="space-y-2">
            <Label htmlFor="preparedBy">Prepared By</Label>
            <Input
              id="preparedBy"
              value={options.preparedBy}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setOptions((prev) => ({ ...prev, preparedBy: e.target.value }))
              }
              placeholder="Security Team"
            />
          </div>

          {/* Severity Filter */}
          <div className="space-y-2">
            <Label>Filter by Severity</Label>
            <p className="text-xs text-muted-foreground">
              Leave all unchecked to include all severities
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              {severityOptions.map((sev) => (
                <div key={sev.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`sev-${sev.value}`}
                    checked={options.severityFilter?.includes(sev.value)}
                    onCheckedChange={() => handleSeverityToggle(sev.value)}
                  />
                  <Label
                    htmlFor={`sev-${sev.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {sev.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Include Options */}
          <div className="space-y-3">
            <Label>Include in Report</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeDesc"
                  checked={options.includeDescription}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeDescription: checked === true,
                    }))
                  }
                />
                <Label htmlFor="includeDesc" className="text-sm font-normal cursor-pointer">
                  Finding descriptions
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeRem"
                  checked={options.includeRemediation}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeRemediation: checked === true,
                    }))
                  }
                />
                <Label htmlFor="includeRem" className="text-sm font-normal cursor-pointer">
                  Remediation guidance
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeCurl"
                  checked={options.includeCurl}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeCurl: checked === true,
                    }))
                  }
                />
                <Label htmlFor="includeCurl" className="text-sm font-normal cursor-pointer">
                  cURL commands
                </Label>
              </div>
            </div>
          </div>

          {/* Max Findings */}
          <div className="space-y-2">
            <Label htmlFor="maxFindings">Max Findings (0 = unlimited)</Label>
            <Input
              id="maxFindings"
              type="number"
              min={0}
              value={options.maxFindings}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setOptions((prev) => ({
                  ...prev,
                  maxFindings: parseInt(e.target.value) || 0,
                }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Generate PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
