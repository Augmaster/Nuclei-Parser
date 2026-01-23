import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Pencil,
  Trash2,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCompanies,
  useProjects,
  useActiveCompanyId,
  useOrganizationStore,
} from '@/store/organizationStore';
import { useUploadedFiles } from '@/store/findingsStore';
import { ProjectForm } from '@/components/organization/ProjectForm';
import type { Project } from '@/types/organization';

export function ProjectsPage() {
  const navigate = useNavigate();
  const companies = useCompanies();
  const allProjects = useProjects();
  const activeCompanyId = useActiveCompanyId();
  const uploadedFiles = useUploadedFiles();
  const deleteProject = useOrganizationStore(state => state.deleteProject);
  const setActiveProject = useOrganizationStore(state => state.setActiveProject);

  const [filterCompanyId, setFilterCompanyId] = useState<string>(activeCompanyId || 'all');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const filteredProjects = filterCompanyId === 'all'
    ? allProjects
    : allProjects.filter(p => p.companyId === filterCompanyId);

  const getCompanyName = (companyId: string) =>
    companies.find(c => c.id === companyId)?.name || 'Unknown';

  // Get stats for a project (files and findings count)
  const getProjectStats = (projectId: string) => {
    const projectFiles = uploadedFiles.filter(f => f.projectId === projectId);
    const findingsCount = projectFiles.reduce((sum, f) => sum + f.findingsCount, 0);
    return {
      filesCount: projectFiles.length,
      findingsCount,
    };
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowProjectForm(true);
  };

  const handleDeleteProject = async () => {
    if (deletingProject) {
      await deleteProject(deletingProject.id);
      setDeletingProject(null);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProject(projectId);
    navigate('/');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your projects across all companies
          </p>
        </div>
        <Button onClick={() => {
          setEditingProject(undefined);
          setShowProjectForm(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Filter by company:</label>
        <Select value={filterCompanyId} onValueChange={setFilterCompanyId}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map(company => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredProjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {filterCompanyId === 'all'
                ? 'Create your first project to start organizing findings.'
                : 'No projects in this company yet.'}
            </p>
            <Button onClick={() => setShowProjectForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map(project => (
            <Card
              key={project.id}
              className="group cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleSelectProject(project.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <FolderKanban className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {getCompanyName(project.companyId)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditProject(project)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingProject(project)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Project Form Dialog */}
      <ProjectForm
        open={showProjectForm}
        onOpenChange={(open) => {
          setShowProjectForm(open);
          if (!open) setEditingProject(undefined);
        }}
        project={editingProject}
        defaultCompanyId={filterCompanyId !== 'all' ? filterCompanyId : undefined}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingProject} onOpenChange={() => setDeletingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Are you sure you want to delete "{deletingProject?.name}"? This action cannot be undone.
                </p>
                {deletingProject && (() => {
                  const stats = getProjectStats(deletingProject.id);
                  if (stats.filesCount > 0 || stats.findingsCount > 0) {
                    return (
                      <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm">
                        <p className="font-medium text-destructive mb-1">This will permanently delete:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                          <li><span className="font-medium text-foreground">{stats.filesCount}</span> uploaded {stats.filesCount === 1 ? 'file' : 'files'}</li>
                          <li><span className="font-medium text-foreground">{stats.findingsCount}</span> {stats.findingsCount === 1 ? 'finding' : 'findings'}</li>
                        </ul>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingProject(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
