import { create } from 'zustand';
import { toast } from 'sonner';
import type { NucleiFinding, UploadedFile, FilterState, Stats, FindingStatus, FindingStatusChange } from '@/types/nuclei';
import { uploadedFileFromRecord, uploadedFileToRecord } from '@/types/nuclei';
import * as db from '@/services/db/indexedDB';

interface FindingsState {
  // Data
  findings: NucleiFinding[];
  uploadedFiles: UploadedFile[];

  // Current project context
  currentProjectId: string | null;

  // Filters
  filters: FilterState;

  // Computed
  filteredFindings: NucleiFinding[];
  stats: Stats;

  // Cached unique values for dropdowns
  uniqueHosts: string[];
  uniqueTemplates: string[];
  uniqueTags: string[];
  uniqueTypes: string[];

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  addFindings: (findings: NucleiFinding[], file: UploadedFile) => Promise<void>;
  removeFile: (fileId: string) => Promise<void>;
  clearAll: () => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  updateFinding: (finding: NucleiFinding) => void;
  bulkUpdateStatus: (ids: string[], status: FindingStatus, reason?: string) => Promise<void>;

  // Project-scoped loading
  loadProjectData: (projectId: string) => Promise<void>;
  clearProjectData: () => void;
  clearError: () => void;
}

const defaultFilters: FilterState = {
  search: '',
  severities: [],
  hosts: [],
  templates: [],
  tags: [],
  types: [],
  statuses: [],
};

const defaultStats: Stats = {
  total: 0,
  bySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0, unknown: 0 },
  byHost: {},
  byTemplate: {},
  byTag: {},
  byType: {},
  byStatus: { new: 0, in_progress: 0, verified: 0, false_positive: 0, remediated: 0, accepted_risk: 0, closed: 0 },
};

interface ComputedData {
  stats: Stats;
  uniqueHosts: string[];
  uniqueTemplates: string[];
  uniqueTags: string[];
  uniqueTypes: string[];
}

function computeData(findings: NucleiFinding[]): ComputedData {
  const stats: Stats = {
    total: findings.length,
    bySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0, unknown: 0 },
    byHost: {},
    byTemplate: {},
    byTag: {},
    byType: {},
    byStatus: { new: 0, in_progress: 0, verified: 0, false_positive: 0, remediated: 0, accepted_risk: 0, closed: 0 },
  };

  const hostsSet = new Set<string>();
  const templatesSet = new Set<string>();
  const tagsSet = new Set<string>();
  const typesSet = new Set<string>();

  for (const finding of findings) {
    // By severity
    const severity = finding.info.severity || 'unknown';
    stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;

    // By host
    stats.byHost[finding.host] = (stats.byHost[finding.host] || 0) + 1;
    hostsSet.add(finding.host);

    // By template
    stats.byTemplate[finding.templateId] = (stats.byTemplate[finding.templateId] || 0) + 1;
    templatesSet.add(finding.templateId);

    // By type
    stats.byType[finding.type] = (stats.byType[finding.type] || 0) + 1;
    typesSet.add(finding.type);

    // By tag
    for (const tag of finding.info.tags) {
      stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
      tagsSet.add(tag);
    }

    // By status (undefined treated as 'new')
    const status = finding.status || 'new';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
  }

  return {
    stats,
    uniqueHosts: [...hostsSet].sort(),
    uniqueTemplates: [...templatesSet].sort(),
    uniqueTags: [...tagsSet].sort(),
    uniqueTypes: [...typesSet].sort(),
  };
}

function applyFilters(findings: NucleiFinding[], filters: FilterState): NucleiFinding[] {
  return findings.filter(finding => {
    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch =
        finding.templateId.toLowerCase().includes(search) ||
        finding.info.name.toLowerCase().includes(search) ||
        finding.host.toLowerCase().includes(search) ||
        finding.matchedAt.toLowerCase().includes(search) ||
        (finding.info.description?.toLowerCase().includes(search)) ||
        finding.info.tags.some(tag => tag.toLowerCase().includes(search));

      if (!matchesSearch) return false;
    }

    // Severity filter
    if (filters.severities.length > 0) {
      if (!filters.severities.includes(finding.info.severity)) return false;
    }

    // Host filter
    if (filters.hosts.length > 0) {
      if (!filters.hosts.includes(finding.host)) return false;
    }

    // Template filter
    if (filters.templates.length > 0) {
      if (!filters.templates.includes(finding.templateId)) return false;
    }

    // Tags filter
    if (filters.tags.length > 0) {
      if (!finding.info.tags.some(tag => filters.tags.includes(tag))) return false;
    }

    // Type filter
    if (filters.types.length > 0) {
      if (!filters.types.includes(finding.type)) return false;
    }

    // Status filter (undefined status treated as 'new')
    if (filters.statuses.length > 0) {
      const effectiveStatus = finding.status || 'new';
      if (!filters.statuses.includes(effectiveStatus)) return false;
    }

    return true;
  });
}

export const useFindingsStore = create<FindingsState>((set, get) => ({
  findings: [],
  uploadedFiles: [],
  currentProjectId: null,
  filters: defaultFilters,
  filteredFindings: [],
  stats: defaultStats,
  uniqueHosts: [],
  uniqueTemplates: [],
  uniqueTags: [],
  uniqueTypes: [],
  isLoading: false,
  error: null,

  loadProjectData: async (projectId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Load findings and files from IndexedDB for this project
      const [findings, fileRecords] = await Promise.all([
        db.getFindingsByProject(projectId),
        db.getUploadedFilesByProject(projectId),
      ]);

      const uploadedFiles = fileRecords.map(uploadedFileFromRecord);
      const computed = computeData(findings);
      const filteredFindings = applyFilters(findings, get().filters);

      set({
        findings,
        uploadedFiles,
        currentProjectId: projectId,
        filteredFindings,
        ...computed,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to load project data:', error);
      toast.error('Failed to load project data. Please try again.');
      set({ isLoading: false, error: 'Failed to load project data. Please try again.' });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  clearProjectData: () => {
    set({
      findings: [],
      uploadedFiles: [],
      currentProjectId: null,
      filteredFindings: [],
      stats: defaultStats,
      filters: defaultFilters,
      uniqueHosts: [],
      uniqueTemplates: [],
      uniqueTags: [],
      uniqueTypes: [],
    });
  },

  addFindings: async (newFindings, file) => {
    const { currentProjectId } = get();

    // Ensure findings and file have projectId
    const findingsWithProject = newFindings.map(f => ({
      ...f,
      projectId: currentProjectId || f.projectId,
    }));

    const fileWithProject: UploadedFile = {
      ...file,
      projectId: currentProjectId || file.projectId,
    };

    // Save to IndexedDB
    await db.addFindings(findingsWithProject);
    await db.addUploadedFile(uploadedFileToRecord(fileWithProject));

    // Update in-memory state
    set(state => {
      const findings = [...state.findings, ...findingsWithProject];
      const uploadedFiles = [...state.uploadedFiles, fileWithProject];
      const filteredFindings = applyFilters(findings, state.filters);
      const computed = computeData(findings);

      return { findings, uploadedFiles, filteredFindings, ...computed };
    });
  },

  removeFile: async (fileId: string) => {
    // Delete from IndexedDB
    await db.deleteFindingsByFile(fileId);
    await db.deleteUploadedFile(fileId);

    // Update in-memory state
    set(state => {
      const uploadedFiles = state.uploadedFiles.filter(f => f.id !== fileId);
      const findings = state.findings.filter(f => f.sourceFile !== fileId);
      const filteredFindings = applyFilters(findings, state.filters);
      const computed = computeData(findings);

      return { findings, uploadedFiles, filteredFindings, ...computed };
    });
  },

  clearAll: () => {
    set({
      findings: [],
      uploadedFiles: [],
      filteredFindings: [],
      stats: defaultStats,
      filters: defaultFilters,
      uniqueHosts: [],
      uniqueTemplates: [],
      uniqueTags: [],
      uniqueTypes: [],
    });
  },

  setFilters: (newFilters) => {
    set(state => {
      const filters = { ...state.filters, ...newFilters };
      const filteredFindings = applyFilters(state.findings, filters);

      return { filters, filteredFindings };
    });
  },

  resetFilters: () => {
    set(state => ({
      filters: defaultFilters,
      filteredFindings: state.findings,
    }));
  },

  updateFinding: (updatedFinding: NucleiFinding) => {
    set(state => {
      const findings = state.findings.map(f =>
        f.id === updatedFinding.id ? updatedFinding : f
      );
      const filteredFindings = applyFilters(findings, state.filters);

      return { findings, filteredFindings };
    });
  },

  bulkUpdateStatus: async (ids: string[], status: FindingStatus, reason?: string) => {
    const { findings } = get();
    const updatedFindings: NucleiFinding[] = [];
    const statusChanges: FindingStatusChange[] = [];
    const timestamp = new Date().toISOString();

    // Prepare updates
    for (const id of ids) {
      const finding = findings.find(f => f.id === id);
      if (finding) {
        const currentStatus = finding.status || 'new';
        if (currentStatus !== status) {
          const updatedFinding: NucleiFinding = {
            ...finding,
            status,
          };
          updatedFindings.push(updatedFinding);

          // Create status change record
          statusChanges.push({
            id: crypto.randomUUID(),
            findingId: id,
            fromStatus: currentStatus,
            toStatus: status,
            changedBy: 'Tester', // TODO: configurable user
            reason,
            changedAt: timestamp,
          });
        }
      }
    }

    // Persist to IndexedDB
    for (const finding of updatedFindings) {
      await db.updateFinding(finding);
    }
    for (const change of statusChanges) {
      await db.addStatusChange(change);
    }

    // Update in-memory state
    set(state => {
      const updatedIds = new Set(updatedFindings.map(f => f.id));
      const newFindings = state.findings.map(f =>
        updatedIds.has(f.id) ? updatedFindings.find(uf => uf.id === f.id)! : f
      );
      const filteredFindings = applyFilters(newFindings, state.filters);

      return { findings: newFindings, filteredFindings };
    });

    toast.success(`Updated status for ${updatedFindings.length} finding${updatedFindings.length !== 1 ? 's' : ''}`);
  },
}));

// Selector hooks for commonly used derived state
export const useFilteredFindings = () => useFindingsStore(state => state.filteredFindings);
export const useStats = () => useFindingsStore(state => state.stats);
export const useUploadedFiles = () => useFindingsStore(state => state.uploadedFiles);
export const useFilters = () => useFindingsStore(state => state.filters);
export const useCurrentProjectId = () => useFindingsStore(state => state.currentProjectId);
export const useIsLoadingFindings = () => useFindingsStore(state => state.isLoading);

// Get unique values for filter dropdowns - these now return cached arrays from the store
export const useUniqueHosts = () => useFindingsStore(state => state.uniqueHosts);
export const useUniqueTemplates = () => useFindingsStore(state => state.uniqueTemplates);
export const useUniqueTags = () => useFindingsStore(state => state.uniqueTags);
export const useUniqueTypes = () => useFindingsStore(state => state.uniqueTypes);
