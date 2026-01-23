import { useState, useEffect } from 'react';
import { FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  useOrganizationStore,
  useCompanies,
  useActiveCompanyId,
} from '@/store/organizationStore';
import type { Project } from '@/types/organization';

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project; // If provided, we're editing
  defaultCompanyId?: string; // Pre-select company
  onSuccess?: (project: Project) => void;
  autoSelect?: boolean; // Auto-select the project after creation (default: true)
}

export function ProjectForm({
  open,
  onOpenChange,
  project,
  defaultCompanyId,
  onSuccess,
  autoSelect = true,
}: ProjectFormProps) {
  const companies = useCompanies();
  const activeCompanyId = useActiveCompanyId();

  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [companyId, setCompanyId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addProject = useOrganizationStore(state => state.addProject);
  const updateProject = useOrganizationStore(state => state.updateProject);
  const setActiveProject = useOrganizationStore(state => state.setActiveProject);

  const isEditing = !!project;

  // Set form fields when dialog opens
  useEffect(() => {
    if (open) {
      // Set name and description from project (for editing) or empty (for creating)
      setName(project?.name || '');
      setDescription(project?.description || '');

      // Priority: project's company (editing) > defaultCompanyId prop > active company > first company
      const targetCompanyId = project?.companyId
        || defaultCompanyId
        || activeCompanyId
        || companies[0]?.id
        || '';
      setCompanyId(targetCompanyId);
    }
  }, [open, project, defaultCompanyId, activeCompanyId, companies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !companyId) return;

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateProject(project.id, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
        onSuccess?.(project);
      } else {
        const newProject = await addProject({
          companyId,
          name: name.trim(),
          description: description.trim() || undefined,
        });
        // Auto-select the newly created project
        if (autoSelect) {
          setActiveProject(newProject.id);
        }
        onSuccess?.(newProject);
      }
      onOpenChange(false);
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName(project?.name || '');
      setDescription(project?.description || '');
      setCompanyId(project?.companyId || defaultCompanyId || activeCompanyId || '');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            {isEditing ? 'Edit Project' : 'New Project'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the project details below.'
              : 'Create a new project to organize your findings.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {!isEditing && (
              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-medium">
                  Company <span className="text-destructive">*</span>
                </label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                placeholder="Project name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="description"
                placeholder="Optional description"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !companyId || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
