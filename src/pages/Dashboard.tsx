import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bug, Server, FileCode, Upload, Zap, FolderKanban, RefreshCw } from 'lucide-react';
import { useStats, useFindingsStore, useIsLoadingFindings, useFilteredFindings } from '@/store/findingsStore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useActiveProjectId, useActiveProject, useActiveCompany } from '@/store/organizationStore';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SeverityChart } from '@/components/dashboard/SeverityChart';
import { TopList } from '@/components/dashboard/TopList';
import { Button } from '@/components/ui/button';
import { ProjectForm } from '@/components/organization/ProjectForm';
import { PDFReportDialog } from '@/components/reports/PDFReportDialog';
import { cn } from '@/lib/utils';
import type { Severity } from '@/types/nuclei';

export function DashboardPage() {
  const navigate = useNavigate();
  const stats = useStats();
  const findings = useFilteredFindings();
  const setFilters = useFindingsStore(state => state.setFilters);
  const activeProjectId = useActiveProjectId();
  const activeProject = useActiveProject();
  const activeCompany = useActiveCompany();
  const isLoading = useIsLoadingFindings();
  const error = useFindingsStore(state => state.error);
  const loadProjectData = useFindingsStore(state => state.loadProjectData);
  const [showProjectForm, setShowProjectForm] = useState(false);

  const uniqueHosts = Object.keys(stats.byHost).length;
  const uniqueTemplates = Object.keys(stats.byTemplate).length;

  const handleHostClick = (host: string) => {
    setFilters({ hosts: [host] });
    navigate('/findings');
  };

  const handleTemplateClick = (template: string) => {
    setFilters({ templates: [template] });
    navigate('/findings');
  };

  const handleSeverityClick = (severity: Severity) => {
    setFilters({ severities: [severity] });
    navigate('/findings');
  };

  // Show project selection prompt if no project is active
  if (!activeProjectId) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <FolderKanban className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Select a Project</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Choose a project from the sidebar to view its findings, or create a new project to get started.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => setShowProjectForm(true)}>
              Create New Project
            </Button>
            <Button variant="outline" onClick={() => navigate('/projects')}>
              Browse Projects
            </Button>
          </div>
        </div>
        <ProjectForm
          open={showProjectForm}
          onOpenChange={setShowProjectForm}
        />
      </>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
        <p className="text-muted-foreground">Loading project data...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Alert variant="destructive" className="max-w-md mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          onClick={() => activeProjectId && loadProjectData(activeProjectId)}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (stats.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="relative mb-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="h-10 w-10 text-primary" />
          </div>
          <div className="absolute inset-0 h-20 w-20 rounded-full bg-primary/20 animate-ping" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Welcome to Nuclei Viewer</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Upload your Nuclei scan output files to visualize findings, filter by severity, and export reports.
        </p>
        <Button size="lg" onClick={() => navigate('/upload')} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Scan Files
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview for <span className="text-foreground font-medium">{activeProject?.name}</span>
          </p>
        </div>
        <PDFReportDialog
          findings={findings}
          stats={stats}
          projectName={activeProject?.name}
          companyName={activeCompany?.name}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Findings"
          value={stats.total}
          icon={Bug}
          className="bg-gradient-to-br from-primary/10 via-transparent to-transparent"
        />
        <StatsCard
          title="Critical & High"
          value={stats.bySeverity.critical + stats.bySeverity.high}
          description={`${stats.bySeverity.critical} critical, ${stats.bySeverity.high} high`}
          icon={AlertTriangle}
          className={cn(
            stats.bySeverity.critical > 0
              ? 'border-red-500/50 bg-gradient-to-br from-red-500/10 via-transparent to-transparent'
              : stats.bySeverity.high > 0
              ? 'border-orange-500/50 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent'
              : ''
          )}
        />
        <StatsCard
          title="Unique Hosts"
          value={uniqueHosts}
          icon={Server}
          className="bg-gradient-to-br from-blue-500/10 via-transparent to-transparent"
        />
        <StatsCard
          title="Templates Triggered"
          value={uniqueTemplates}
          icon={FileCode}
          className="bg-gradient-to-br from-purple-500/10 via-transparent to-transparent"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <SeverityChart data={stats.bySeverity} onSeverityClick={handleSeverityClick} />
        <TopList
          title="Top Affected Hosts"
          data={stats.byHost}
          onItemClick={handleHostClick}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <TopList
          title="Top Templates"
          data={stats.byTemplate}
          onItemClick={handleTemplateClick}
        />
        <TopList
          title="Finding Types"
          data={stats.byType}
        />
      </div>
    </div>
  );
}
