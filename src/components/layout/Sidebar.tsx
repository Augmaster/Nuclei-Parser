import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  List,
  Download,
  Server,
  FileCode,
  Settings,
  ShieldAlert,
  GitCompare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStats } from '@/store/findingsStore';
import {
  useActiveProjectId,
  useActiveProject,
} from '@/store/organizationStore';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CompanySelector } from '@/components/organization/CompanySelector';
import { ProjectList } from '@/components/organization/ProjectList';
import { CompanyForm } from '@/components/organization/CompanyForm';
import { ProjectForm } from '@/components/organization/ProjectForm';
import type { Project } from '@/types/organization';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/findings', icon: List, label: 'Findings' },
  { to: '/hosts', icon: Server, label: 'By Host' },
  { to: '/host-risk', icon: ShieldAlert, label: 'Host Risk' },
  { to: '/templates', icon: FileCode, label: 'By Template' },
  { to: '/comparison', icon: GitCompare, label: 'Compare Scans' },
  { to: '/export', icon: Download, label: 'Export' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const stats = useStats();
  const activeProjectId = useActiveProjectId();
  const activeProject = useActiveProject();

  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowProjectForm(true);
  };

  const handleProjectFormClose = (open: boolean) => {
    setShowProjectForm(open);
    if (!open) {
      setEditingProject(undefined);
    }
  };

  return (
    <>
      <aside className="fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 border-r border-border/40 bg-background/50 backdrop-blur-sm flex flex-col">
        {/* Company Selector */}
        <div className="p-3 border-b border-border/40">
          <CompanySelector
            onCreateNew={() => setShowCompanyForm(true)}
            onManage={() => navigate('/companies')}
          />
        </div>

        {/* Project List */}
        <div className="flex-shrink-0 max-h-48 border-b border-border/40 overflow-hidden">
          <ProjectList
            onCreateNew={() => {
              setEditingProject(undefined);
              setShowProjectForm(true);
            }}
            onProjectSelect={() => {
              // Navigate to dashboard when project is selected
              navigate('/');
            }}
            onEditProject={handleEditProject}
          />
        </div>

        {/* Navigation - only show when project is selected */}
        <ScrollArea className="flex-1 py-4">
          {activeProjectId ? (
            <>
              {/* Active Project Indicator */}
              <div className="px-4 mb-4">
                <div className="text-xs text-muted-foreground mb-1">Active Project</div>
                <div className="text-sm font-medium truncate">{activeProject?.name}</div>
              </div>

              <nav className="space-y-1 px-4" role="navigation" aria-label="Main navigation">
                {navItems.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{label}</span>
                    {label === 'Findings' && stats.total > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {stats.total}
                      </Badge>
                    )}
                  </NavLink>
                ))}
              </nav>

              {stats.total > 0 && (
                <div className="mt-8 px-4">
                  <div className="rounded-lg border border-border/50 bg-card/50 p-4">
                    <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Severity Overview
                    </h3>
                    <div className="space-y-2">
                      {(['critical', 'high', 'medium', 'low', 'info'] as const).map(severity => {
                        const count = stats.bySeverity[severity] || 0;
                        if (count === 0) return null;
                        const percentage = Math.round((count / stats.total) * 100);
                        return (
                          <div key={severity} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <Badge variant={severity} className="capitalize">
                                {severity}
                              </Badge>
                              <span className="text-muted-foreground font-medium">{count}</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  severity === 'critical' && 'bg-red-500',
                                  severity === 'high' && 'bg-orange-500',
                                  severity === 'medium' && 'bg-amber-500',
                                  severity === 'low' && 'bg-blue-500',
                                  severity === 'info' && 'bg-slate-500'
                                )}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="px-4 py-8 text-center">
              <div className="text-muted-foreground text-sm mb-4">
                Select a project to view findings
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProjectForm(true)}
              >
                Create Project
              </Button>
            </div>
          )}
        </ScrollArea>

        {/* Bottom Management Link */}
        <div className="p-3 border-t border-border/40">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => navigate('/companies')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Organizations
          </Button>
        </div>
      </aside>

      {/* Dialogs */}
      <CompanyForm
        open={showCompanyForm}
        onOpenChange={setShowCompanyForm}
      />
      <ProjectForm
        open={showProjectForm}
        onOpenChange={handleProjectFormClose}
        project={editingProject}
      />
    </>
  );
}
