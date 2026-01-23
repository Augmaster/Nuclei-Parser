import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  FolderKanban,
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
  useCompanies,
  useProjects,
  useOrganizationStore,
} from '@/store/organizationStore';
import { useUploadedFiles } from '@/store/findingsStore';
import { CompanyForm } from '@/components/organization/CompanyForm';
import { ProjectForm } from '@/components/organization/ProjectForm';
import type { Company } from '@/types/organization';

export function CompaniesPage() {
  const navigate = useNavigate();
  const companies = useCompanies();
  const projects = useProjects();
  const uploadedFiles = useUploadedFiles();
  const deleteCompany = useOrganizationStore(state => state.deleteCompany);
  const setActiveCompany = useOrganizationStore(state => state.setActiveCompany);
  const setActiveProject = useOrganizationStore(state => state.setActiveProject);

  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [selectedCompanyForProject, setSelectedCompanyForProject] = useState<string | undefined>();

  const getProjectCount = (companyId: string) =>
    projects.filter(p => p.companyId === companyId).length;

  // Get stats for a company (projects and findings count)
  const getCompanyStats = (companyId: string) => {
    const companyProjects = projects.filter(p => p.companyId === companyId);
    const projectIds = new Set(companyProjects.map(p => p.id));
    const companyFiles = uploadedFiles.filter(f => projectIds.has(f.projectId));
    const findingsCount = companyFiles.reduce((sum, f) => sum + f.findingsCount, 0);
    return {
      projectCount: companyProjects.length,
      filesCount: companyFiles.length,
      findingsCount,
    };
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setShowCompanyForm(true);
  };

  const handleDeleteCompany = async () => {
    if (deletingCompany) {
      await deleteCompany(deletingCompany.id);
      setDeletingCompany(null);
    }
  };

  const handleAddProject = (companyId: string) => {
    setSelectedCompanyForProject(companyId);
    setShowProjectForm(true);
  };

  const handleSelectCompany = (companyId: string) => {
    setActiveCompany(companyId);
    // Find first project of this company and select it
    const firstProject = projects.find(p => p.companyId === companyId);
    if (firstProject) {
      setActiveProject(firstProject.id);
    }
    navigate('/');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground mt-1">
            Manage your companies and their projects
          </p>
        </div>
        <Button onClick={() => {
          setEditingCompany(undefined);
          setShowCompanyForm(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          New Company
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first company to organize your security findings.
            </p>
            <Button onClick={() => setShowCompanyForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Company
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map(company => {
            const projectCount = getProjectCount(company.id);
            return (
              <Card
                key={company.id}
                className="group cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleSelectCompany(company.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{company.name}</CardTitle>
                        {company.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {company.description}
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
                      <FolderKanban className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {projectCount} {projectCount === 1 ? 'project' : 'projects'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleAddProject(company.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditCompany(company)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeletingCompany(company)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Company Form Dialog */}
      <CompanyForm
        open={showCompanyForm}
        onOpenChange={(open) => {
          setShowCompanyForm(open);
          if (!open) setEditingCompany(undefined);
        }}
        company={editingCompany}
      />

      {/* Project Form Dialog */}
      <ProjectForm
        open={showProjectForm}
        onOpenChange={(open) => {
          setShowProjectForm(open);
          if (!open) setSelectedCompanyForProject(undefined);
        }}
        defaultCompanyId={selectedCompanyForProject}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingCompany} onOpenChange={() => setDeletingCompany(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Are you sure you want to delete "{deletingCompany?.name}"? This action cannot be undone.
                </p>
                {deletingCompany && (() => {
                  const stats = getCompanyStats(deletingCompany.id);
                  if (stats.projectCount > 0 || stats.findingsCount > 0) {
                    return (
                      <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm">
                        <p className="font-medium text-destructive mb-1">This will permanently delete:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                          <li><span className="font-medium text-foreground">{stats.projectCount}</span> {stats.projectCount === 1 ? 'project' : 'projects'}</li>
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
            <Button variant="outline" onClick={() => setDeletingCompany(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCompany}>
              Delete Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
