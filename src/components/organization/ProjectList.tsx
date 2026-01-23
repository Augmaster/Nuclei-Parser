import { useState } from 'react';
import { FolderKanban, Plus, Check, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useActiveCompanyId,
  useActiveProjectId,
  useProjectsByCompany,
  useOrganizationStore,
} from '@/store/organizationStore';
import { useUploadedFiles } from '@/store/findingsStore';
import { cn } from '@/lib/utils';
import type { Project } from '@/types/organization';

interface ProjectListProps {
  onCreateNew?: () => void;
  onProjectSelect?: (projectId: string) => void;
  onEditProject?: (project: Project) => void;
}

export function ProjectList({ onCreateNew, onProjectSelect, onEditProject }: ProjectListProps) {
  const activeCompanyId = useActiveCompanyId();
  const activeProjectId = useActiveProjectId();
  const projects = useProjectsByCompany(activeCompanyId);
  const uploadedFiles = useUploadedFiles();
  const setActiveProject = useOrganizationStore(state => state.setActiveProject);
  const deleteProject = useOrganizationStore(state => state.deleteProject);

  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const handleProjectClick = (projectId: string) => {
    setActiveProject(projectId);
    onProjectSelect?.(projectId);
  };

  const getProjectStats = (projectId: string) => {
    const projectFiles = uploadedFiles.filter(f => f.projectId === projectId);
    const findingsCount = projectFiles.reduce((sum, f) => sum + f.findingsCount, 0);
    return {
      filesCount: projectFiles.length,
      findingsCount,
    };
  };

  const handleDeleteProject = async () => {
    if (deletingProject) {
      await deleteProject(deletingProject.id);
      setDeletingProject(null);
    }
  };

  if (!activeCompanyId) {
    return (
      <div className="px-3 py-4 text-sm text-muted-foreground text-center">
        Select a company first
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Projects
        </span>
        {onCreateNew && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCreateNew}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 px-2">
          {projects.map(project => (
            <div
              key={project.id}
              className={cn(
                'group flex items-center gap-1 rounded-md text-sm transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                activeProjectId === project.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <button
                onClick={() => handleProjectClick(project.id)}
                className="flex-1 flex items-center gap-2 px-2 py-1.5 min-w-0"
              >
                <FolderKanban className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1 text-left">{project.name}</span>
                {activeProjectId === project.id && (
                  <Check className="h-4 w-4 shrink-0" />
                )}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 mr-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  {onEditProject && (
                    <DropdownMenuItem onClick={() => onEditProject(project)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => setDeletingProject(project)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No projects yet
            </div>
          )}
        </div>
      </ScrollArea>

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
