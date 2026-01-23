import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import type { Company, Project } from '@/types/organization';
import {
  companyFromRecord,
  companyToRecord,
  projectFromRecord,
  projectToRecord,
} from '@/types/organization';
import * as db from '@/services/db/indexedDB';
import { ensureDefaults } from '@/services/db/migration';

interface OrganizationState {
  // Data
  companies: Company[];
  projects: Project[];

  // Selection Context
  activeCompanyId: string | null;
  activeProjectId: string | null;

  // Loading state
  isInitialized: boolean;
  isLoading: boolean;

  // Company Actions
  addCompany: (data: { name: string; description?: string }) => Promise<Company>;
  updateCompany: (id: string, updates: { name?: string; description?: string }) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;

  // Project Actions
  addProject: (data: { companyId: string; name: string; description?: string }) => Promise<Project>;
  updateProject: (id: string, updates: { name?: string; description?: string }) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Selection Actions
  setActiveCompany: (companyId: string | null) => void;
  setActiveProject: (projectId: string | null) => void;

  // Initialization
  initialize: () => Promise<void>;
}

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  companies: [],
  projects: [],
  activeCompanyId: null,
  activeProjectId: null,
  isInitialized: false,
  isLoading: false,

  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true });

    try {
      // Ensure default company and project exist
      await ensureDefaults();

      // Load companies from IndexedDB
      const companyRecords = await db.getAllCompanies();
      const companies = companyRecords.map(companyFromRecord);

      // Load projects from IndexedDB
      const projectRecords = await db.getAllProjects();
      const projects = projectRecords.map(projectFromRecord);

      // Try to restore active selection from localStorage
      const savedCompanyId = localStorage.getItem('nuclei-viewer-active-company');
      const savedProjectId = localStorage.getItem('nuclei-viewer-active-project');

      // Validate saved selections still exist
      const activeCompanyId = savedCompanyId && companies.some(c => c.id === savedCompanyId)
        ? savedCompanyId
        : null;
      const activeProjectId = savedProjectId && projects.some(p => p.id === savedProjectId)
        ? savedProjectId
        : null;

      set({
        companies,
        projects,
        activeCompanyId,
        activeProjectId,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to initialize organization store:', error);
      toast.error('Failed to load organizations. Please refresh the page.');
      set({ isLoading: false, isInitialized: true });
    }
  },

  addCompany: async (data) => {
    const now = new Date();
    const company: Company = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      createdAt: now,
      updatedAt: now,
    };

    // Save to IndexedDB
    await db.addCompany(companyToRecord(company));

    // Update state
    set(state => ({
      companies: [...state.companies, company],
    }));

    return company;
  },

  updateCompany: async (id, updates) => {
    const { companies } = get();
    const existing = companies.find(c => c.id === id);
    if (!existing) throw new Error(`Company not found: ${id}`);

    const updated: Company = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    // Save to IndexedDB
    await db.updateCompany(companyToRecord(updated));

    // Update state
    set(state => ({
      companies: state.companies.map(c => (c.id === id ? updated : c)),
    }));
  },

  deleteCompany: async (id) => {
    // Cascade delete in IndexedDB (projects, findings, files)
    await db.cascadeDeleteCompany(id);

    // Update state
    set(state => {
      const newState: Partial<OrganizationState> = {
        companies: state.companies.filter(c => c.id !== id),
        projects: state.projects.filter(p => p.companyId !== id),
      };

      // Clear active selections if deleted
      if (state.activeCompanyId === id) {
        newState.activeCompanyId = null;
        newState.activeProjectId = null;
        localStorage.removeItem('nuclei-viewer-active-company');
        localStorage.removeItem('nuclei-viewer-active-project');
      }

      return newState;
    });
  },

  addProject: async (data) => {
    const now = new Date();
    const project: Project = {
      id: uuidv4(),
      companyId: data.companyId,
      name: data.name,
      description: data.description,
      createdAt: now,
      updatedAt: now,
    };

    // Save to IndexedDB
    await db.addProject(projectToRecord(project));

    // Update state
    set(state => ({
      projects: [...state.projects, project],
    }));

    return project;
  },

  updateProject: async (id, updates) => {
    const { projects } = get();
    const existing = projects.find(p => p.id === id);
    if (!existing) throw new Error(`Project not found: ${id}`);

    const updated: Project = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    // Save to IndexedDB
    await db.updateProject(projectToRecord(updated));

    // Update state
    set(state => ({
      projects: state.projects.map(p => (p.id === id ? updated : p)),
    }));
  },

  deleteProject: async (id) => {
    // Cascade delete in IndexedDB (findings, files)
    await db.cascadeDeleteProject(id);

    // Update state
    set(state => {
      const newState: Partial<OrganizationState> = {
        projects: state.projects.filter(p => p.id !== id),
      };

      // Clear active selection if deleted
      if (state.activeProjectId === id) {
        newState.activeProjectId = null;
        localStorage.removeItem('nuclei-viewer-active-project');
      }

      return newState;
    });
  },

  setActiveCompany: (companyId) => {
    set(state => {
      // When changing company, clear project selection if it doesn't belong to new company
      let newProjectId = state.activeProjectId;
      if (companyId !== state.activeCompanyId) {
        const projectBelongsToCompany = state.projects.some(
          p => p.id === state.activeProjectId && p.companyId === companyId
        );
        if (!projectBelongsToCompany) {
          newProjectId = null;
          localStorage.removeItem('nuclei-viewer-active-project');
        }
      }

      // Persist to localStorage
      if (companyId) {
        localStorage.setItem('nuclei-viewer-active-company', companyId);
      } else {
        localStorage.removeItem('nuclei-viewer-active-company');
      }

      return {
        activeCompanyId: companyId,
        activeProjectId: newProjectId,
      };
    });
  },

  setActiveProject: (projectId) => {
    const { projects } = get();

    // If setting a project, also set its company as active
    let companyId = get().activeCompanyId;
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        companyId = project.companyId;
        localStorage.setItem('nuclei-viewer-active-company', companyId);
      }
    }

    // Persist to localStorage
    if (projectId) {
      localStorage.setItem('nuclei-viewer-active-project', projectId);
    } else {
      localStorage.removeItem('nuclei-viewer-active-project');
    }

    set({
      activeCompanyId: companyId,
      activeProjectId: projectId,
    });
  },
}));

// Selector hooks - use primitive selectors to avoid infinite loops
export const useCompanies = () => useOrganizationStore(state => state.companies);
export const useProjects = () => useOrganizationStore(state => state.projects);
export const useActiveCompanyId = () => useOrganizationStore(state => state.activeCompanyId);
export const useActiveProjectId = () => useOrganizationStore(state => state.activeProjectId);
export const useIsOrganizationInitialized = () => useOrganizationStore(state => state.isInitialized);

// Get projects for a specific company - computed outside selector to avoid new array each render
export const useProjectsByCompany = (companyId: string | null) => {
  const projects = useOrganizationStore(state => state.projects);
  if (!companyId) return [];
  return projects.filter(p => p.companyId === companyId);
};

// Get the active company object - use separate selectors for stable reference
export const useActiveCompany = () => {
  const companies = useOrganizationStore(state => state.companies);
  const activeCompanyId = useOrganizationStore(state => state.activeCompanyId);
  if (!activeCompanyId) return null;
  return companies.find(c => c.id === activeCompanyId) || null;
};

// Get the active project object - use separate selectors for stable reference
export const useActiveProject = () => {
  const projects = useOrganizationStore(state => state.projects);
  const activeProjectId = useOrganizationStore(state => state.activeProjectId);
  if (!activeProjectId) return null;
  return projects.find(p => p.id === activeProjectId) || null;
};
