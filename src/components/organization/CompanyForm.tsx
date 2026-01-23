import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
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
import { useOrganizationStore } from '@/store/organizationStore';
import type { Company } from '@/types/organization';

interface CompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company; // If provided, we're editing
  onSuccess?: (company: Company) => void;
  autoSelect?: boolean; // Auto-select the company after creation (default: true)
}

export function CompanyForm({ open, onOpenChange, company, onSuccess, autoSelect = true }: CompanyFormProps) {
  const [name, setName] = useState(company?.name || '');
  const [description, setDescription] = useState(company?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addCompany = useOrganizationStore(state => state.addCompany);
  const updateCompany = useOrganizationStore(state => state.updateCompany);
  const setActiveCompany = useOrganizationStore(state => state.setActiveCompany);

  const isEditing = !!company;

  // Set form fields when dialog opens
  useEffect(() => {
    if (open) {
      setName(company?.name || '');
      setDescription(company?.description || '');
    }
  }, [open, company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateCompany(company.id, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
        onSuccess?.(company);
      } else {
        const newCompany = await addCompany({
          name: name.trim(),
          description: description.trim() || undefined,
        });
        // Auto-select the newly created company
        if (autoSelect) {
          setActiveCompany(newCompany.id);
        }
        onSuccess?.(newCompany);
      }
      onOpenChange(false);
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Failed to save company:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName(company?.name || '');
      setDescription(company?.description || '');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isEditing ? 'Edit Company' : 'New Company'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the company details below.'
              : 'Create a new company to organize your projects.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                placeholder="Company name"
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
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
