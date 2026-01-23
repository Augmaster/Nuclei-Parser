import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { RemediationProgress, RemediationProgressStatus } from '@/types/nuclei';
import {
  getRemediationProgress as getFromDB,
  getRemediationProgressByProject,
  addRemediationProgress,
  updateRemediationProgress,
} from '@/services/db/indexedDB';

interface RemediationStats {
  total: number;
  notStarted: number;
  inProgress: number;
  blocked: number;
  completed: number;
  overdueCount: number;
}

interface RemediationState {
  // State
  progress: Map<string, RemediationProgress>;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProgress: (projectId: string) => Promise<void>;
  getProgress: (findingId: string) => RemediationProgress | undefined;
  initializeProgress: (
    findingId: string,
    projectId: string,
    totalSteps: number
  ) => Promise<RemediationProgress>;
  toggleStep: (findingId: string, stepIndex: number) => Promise<void>;
  setTargetDate: (findingId: string, date: string | undefined) => Promise<void>;
  updateNotes: (findingId: string, notes: string) => Promise<void>;
  setStatus: (
    findingId: string,
    status: RemediationProgressStatus,
    blockerReason?: string
  ) => Promise<void>;
  markComplete: (findingId: string) => Promise<void>;
  markBlocked: (findingId: string, reason: string) => Promise<void>;

  // Computed
  getOverdueFindings: () => string[];
  getRemediationStats: () => RemediationStats;
}

export const useRemediationStore = create<RemediationState>((set, get) => ({
  progress: new Map(),
  isLoading: false,
  error: null,

  loadProgress: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const progressList = await getRemediationProgressByProject(projectId);
      const progressMap = new Map(progressList.map(p => [p.findingId, p]));
      set({ progress: progressMap, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load progress',
        isLoading: false,
      });
    }
  },

  getProgress: (findingId: string) => {
    return get().progress.get(findingId);
  },

  initializeProgress: async (findingId: string, projectId: string, _totalSteps: number) => {
    // Check if already exists
    let existing = get().progress.get(findingId);
    if (existing) {
      return existing;
    }

    // Try to load from DB
    try {
      existing = await getFromDB(findingId);
      if (existing) {
        const newMap = new Map(get().progress);
        newMap.set(findingId, existing);
        set({ progress: newMap });
        return existing;
      }
    } catch {
      // Ignore and create new
    }

    // Create new progress
    const newProgress: RemediationProgress = {
      id: uuidv4(),
      findingId,
      projectId,
      completedSteps: [],
      customNotes: '',
      status: 'not_started',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    try {
      await addRemediationProgress(newProgress);
      const newMap = new Map(get().progress);
      newMap.set(findingId, newProgress);
      set({ progress: newMap });
    } catch (error) {
      console.error('Failed to create remediation progress:', error);
    }

    return newProgress;
  },

  toggleStep: async (findingId: string, stepIndex: number) => {
    const progress = get().progress.get(findingId);
    if (!progress) return;

    const completedSteps = [...progress.completedSteps];
    const idx = completedSteps.indexOf(stepIndex);

    if (idx === -1) {
      completedSteps.push(stepIndex);
    } else {
      completedSteps.splice(idx, 1);
    }

    // Determine new status based on completion
    let status: RemediationProgressStatus = progress.status;
    if (completedSteps.length > 0 && status === 'not_started') {
      status = 'in_progress';
    }

    const updated: RemediationProgress = {
      ...progress,
      completedSteps,
      status,
      lastUpdated: new Date().toISOString(),
    };

    try {
      await updateRemediationProgress(updated);
      const newMap = new Map(get().progress);
      newMap.set(findingId, updated);
      set({ progress: newMap });
    } catch (error) {
      console.error('Failed to toggle step:', error);
    }
  },

  setTargetDate: async (findingId: string, date: string | undefined) => {
    const progress = get().progress.get(findingId);
    if (!progress) return;

    const updated: RemediationProgress = {
      ...progress,
      targetDate: date,
      lastUpdated: new Date().toISOString(),
    };

    try {
      await updateRemediationProgress(updated);
      const newMap = new Map(get().progress);
      newMap.set(findingId, updated);
      set({ progress: newMap });
    } catch (error) {
      console.error('Failed to set target date:', error);
    }
  },

  updateNotes: async (findingId: string, notes: string) => {
    const progress = get().progress.get(findingId);
    if (!progress) return;

    const updated: RemediationProgress = {
      ...progress,
      customNotes: notes,
      lastUpdated: new Date().toISOString(),
    };

    try {
      await updateRemediationProgress(updated);
      const newMap = new Map(get().progress);
      newMap.set(findingId, updated);
      set({ progress: newMap });
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  },

  setStatus: async (
    findingId: string,
    status: RemediationProgressStatus,
    blockerReason?: string
  ) => {
    const progress = get().progress.get(findingId);
    if (!progress) return;

    const updated: RemediationProgress = {
      ...progress,
      status,
      blockerReason: status === 'blocked' ? blockerReason : undefined,
      lastUpdated: new Date().toISOString(),
    };

    try {
      await updateRemediationProgress(updated);
      const newMap = new Map(get().progress);
      newMap.set(findingId, updated);
      set({ progress: newMap });
    } catch (error) {
      console.error('Failed to set status:', error);
    }
  },

  markComplete: async (findingId: string) => {
    await get().setStatus(findingId, 'completed');
  },

  markBlocked: async (findingId: string, reason: string) => {
    await get().setStatus(findingId, 'blocked', reason);
  },

  getOverdueFindings: () => {
    const now = new Date();
    const overdue: string[] = [];

    for (const [findingId, progress] of get().progress) {
      if (
        progress.targetDate &&
        progress.status !== 'completed' &&
        new Date(progress.targetDate) < now
      ) {
        overdue.push(findingId);
      }
    }

    return overdue;
  },

  getRemediationStats: () => {
    const now = new Date();
    const stats: RemediationStats = {
      total: 0,
      notStarted: 0,
      inProgress: 0,
      blocked: 0,
      completed: 0,
      overdueCount: 0,
    };

    for (const progress of get().progress.values()) {
      stats.total++;
      switch (progress.status) {
        case 'not_started':
          stats.notStarted++;
          break;
        case 'in_progress':
          stats.inProgress++;
          break;
        case 'blocked':
          stats.blocked++;
          break;
        case 'completed':
          stats.completed++;
          break;
      }

      if (
        progress.targetDate &&
        progress.status !== 'completed' &&
        new Date(progress.targetDate) < now
      ) {
        stats.overdueCount++;
      }
    }

    return stats;
  },
}));

// Selector hooks
export function useRemediationProgress(findingId: string) {
  return useRemediationStore(state => state.progress.get(findingId));
}

export function useRemediationStats() {
  return useRemediationStore(state => state.getRemediationStats());
}

export function useOverdueFindings() {
  return useRemediationStore(state => state.getOverdueFindings());
}
