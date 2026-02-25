import { describe, it, expect, beforeEach } from 'vitest';
import { useFindingsStore } from '../findingsStore';
import type { NucleiFinding } from '@/types/nuclei';

// Helper to create a minimal finding
function makeFinding(overrides: Partial<NucleiFinding> = {}): NucleiFinding {
  return {
    id: crypto.randomUUID(),
    templateId: 'test-template',
    info: {
      name: 'Test Finding',
      author: ['tester'],
      tags: ['test'],
      severity: 'medium',
      reference: [],
    },
    type: 'http',
    host: 'https://example.com',
    matchedAt: 'https://example.com/path',
    extractedResults: [],
    timestamp: '2024-01-01T00:00:00Z',
    matcherStatus: true,
    status: 'new',
    ...overrides,
  };
}

describe('findingsStore - status filtering', () => {
  beforeEach(() => {
    useFindingsStore.setState({
      findings: [
        makeFinding({ id: '1', status: 'new' }),
        makeFinding({ id: '2', status: 'in_progress' }),
        makeFinding({ id: '3', status: 'false_positive' }),
        makeFinding({ id: '4', status: 'remediated' }),
        makeFinding({ id: '5', status: undefined }),
      ],
      filters: {
        search: '',
        severities: [],
        hosts: [],
        templates: [],
        tags: [],
        types: [],
        statuses: [],
      },
    });
  });

  it('should return all findings when statuses filter is empty', () => {
    const state = useFindingsStore.getState();
    state.setFilters({ statuses: [] });
    const filtered = useFindingsStore.getState().filteredFindings;
    expect(filtered).toHaveLength(5);
  });

  it('should filter findings by single status', () => {
    const state = useFindingsStore.getState();
    state.setFilters({ statuses: ['new'] });
    const filtered = useFindingsStore.getState().filteredFindings;
    // Should match id '1' (status: 'new') and id '5' (undefined treated as 'new')
    expect(filtered).toHaveLength(2);
    expect(filtered.map(f => f.id).sort()).toEqual(['1', '5']);
  });

  it('should filter findings by multiple statuses', () => {
    const state = useFindingsStore.getState();
    state.setFilters({ statuses: ['in_progress', 'false_positive'] });
    const filtered = useFindingsStore.getState().filteredFindings;
    expect(filtered).toHaveLength(2);
    expect(filtered.map(f => f.id).sort()).toEqual(['2', '3']);
  });
});
