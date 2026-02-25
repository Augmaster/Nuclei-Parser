# Status Filtering and Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add status filtering and management to the Findings dashboard so users can track the triage lifecycle of each finding (New, In Progress, Verified, False Positive, Remediated, Accepted Risk, Closed) and filter the view by status.

**Architecture:** The `FindingStatus` type and `StatusWorkflow` UI already exist but aren't wired into filtering or default assignment. This plan connects those existing pieces: (1) default new findings to `status: 'new'` at parse time, (2) add `statuses` to `FilterState` and `applyFilters()`, (3) add a Status filter dropdown and Status column to `FindingsTable`, (4) add a status breakdown card to the Dashboard. All changes persist automatically via the existing IndexedDB/Zustand layer.

**Tech Stack:** React 19, TypeScript, Zustand, IndexedDB, Vite, Vitest (to be added), TailwindCSS, Radix UI, Recharts

---

### Task 1: Set Up Vitest Testing Infrastructure

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `package.json` (add vitest devDependencies and test script)
- Modify: `tsconfig.json` (add vitest types if needed)

**Step 1: Install Vitest and dependencies**

Run: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
Expected: packages install successfully

**Step 2: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

**Step 3: Create src/test/setup.ts**

```ts
import '@testing-library/jest-dom/vitest';
```

**Step 4: Add test script to package.json**

Add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 5: Run vitest to verify it works**

Run: `npx vitest run`
Expected: "No test files found" (success — infrastructure is ready)

**Step 6: Commit**

```bash
git add vitest.config.ts src/test/setup.ts package.json package-lock.json tsconfig.json
git commit -m "chore: add Vitest testing infrastructure"
```

---

### Task 2: Default New Findings to `status: 'new'` at Parse Time

**Files:**
- Modify: `src/services/parser/nucleiParser.ts:19-47` (add `status: 'new'` to `transformRawFinding`)
- Create: `src/services/parser/__tests__/nucleiParser.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { parseNucleiOutput } from '../nucleiParser';

describe('parseNucleiOutput', () => {
  const sampleJsonl = JSON.stringify({
    'template-id': 'cve-2021-44228',
    info: {
      name: 'Log4Shell',
      author: 'test',
      severity: 'critical',
    },
    type: 'http',
    host: 'https://example.com',
    'matched-at': 'https://example.com/api',
    timestamp: '2024-01-01T00:00:00Z',
  });

  it('should assign status "new" to parsed findings', () => {
    const result = parseNucleiOutput(sampleJsonl, 'file-1');
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].status).toBe('new');
  });

  it('should parse finding fields correctly', () => {
    const result = parseNucleiOutput(sampleJsonl, 'file-1');
    const finding = result.findings[0];
    expect(finding.templateId).toBe('cve-2021-44228');
    expect(finding.info.name).toBe('Log4Shell');
    expect(finding.info.severity).toBe('critical');
    expect(finding.host).toBe('https://example.com');
    expect(finding.sourceFile).toBe('file-1');
  });

  it('should parse JSON array format', () => {
    const jsonArray = JSON.stringify([
      {
        'template-id': 'test-1',
        info: { name: 'Test 1', author: 'a', severity: 'high' },
        type: 'http',
        host: 'https://example.com',
        timestamp: '2024-01-01T00:00:00Z',
      },
      {
        'template-id': 'test-2',
        info: { name: 'Test 2', author: 'b', severity: 'low' },
        type: 'http',
        host: 'https://example.com',
        timestamp: '2024-01-01T00:00:00Z',
      },
    ]);
    const result = parseNucleiOutput(jsonArray, 'file-2');
    expect(result.findings).toHaveLength(2);
    expect(result.findings[0].status).toBe('new');
    expect(result.findings[1].status).toBe('new');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/parser/__tests__/nucleiParser.test.ts`
Expected: FAIL — `findings[0].status` is `undefined`, not `'new'`

**Step 3: Write minimal implementation**

In `src/services/parser/nucleiParser.ts`, inside `transformRawFinding()`, add `status: 'new'` to the returned object (after the `sourceFile` line, around line 45):

```ts
    sourceFile: sourceFileId,
    status: 'new',
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/parser/__tests__/nucleiParser.test.ts`
Expected: PASS — all 3 tests pass

**Step 5: Commit**

```bash
git add src/services/parser/nucleiParser.ts src/services/parser/__tests__/nucleiParser.test.ts
git commit -m "feat: default new findings to status 'new' at parse time"
```

---

### Task 3: Add `statuses` to FilterState and `applyFilters()`

**Files:**
- Modify: `src/types/nuclei.ts:102-109` (add `statuses: FindingStatus[]` to `FilterState`)
- Modify: `src/store/findingsStore.ts:47-54` (add `statuses: []` to `defaultFilters`)
- Modify: `src/store/findingsStore.ts:121-164` (add status filtering to `applyFilters()`)
- Create: `src/store/__tests__/findingsStore.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useFindingsStore } from '../findingsStore';
import type { NucleiFinding, FilterState } from '@/types/nuclei';

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
    // Should match id '1' (status: 'new') and id '5' (undefined → treated as 'new')
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
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/__tests__/findingsStore.test.ts`
Expected: FAIL — TypeScript error (`statuses` doesn't exist on `FilterState`) or test assertion failures

**Step 3: Write minimal implementation**

**3a. Add `statuses` to `FilterState` in `src/types/nuclei.ts`:**

```ts
export interface FilterState {
  search: string;
  severities: Severity[];
  hosts: string[];
  templates: string[];
  tags: string[];
  types: string[];
  statuses: FindingStatus[];
}
```

**3b. Add `statuses: []` to `defaultFilters` in `src/store/findingsStore.ts`:**

```ts
const defaultFilters: FilterState = {
  search: '',
  severities: [],
  hosts: [],
  templates: [],
  tags: [],
  types: [],
  statuses: [],
};
```

**3c. Add status filter to `applyFilters()` in `src/store/findingsStore.ts` (after the type filter block, before `return true`):**

```ts
    // Status filter (undefined status treated as 'new')
    if (filters.statuses.length > 0) {
      const effectiveStatus = finding.status || 'new';
      if (!filters.statuses.includes(effectiveStatus)) return false;
    }
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/store/__tests__/findingsStore.test.ts`
Expected: PASS — all 3 tests pass

**Step 5: Commit**

```bash
git add src/types/nuclei.ts src/store/findingsStore.ts src/store/__tests__/findingsStore.test.ts
git commit -m "feat: add status filtering to FilterState and applyFilters"
```

---

### Task 4: Add Status Filter Dropdown to FindingsTable

**Files:**
- Modify: `src/components/findings/FindingsTable.tsx`

**Step 1: Add status filter options constant**

Add after the `severityOptions` constant (around line 75):

```ts
// Status options for multi-select
const statusFilterOptions: MultiSelectOption[] = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'verified', label: 'Verified' },
  { value: 'false_positive', label: 'False Positive' },
  { value: 'remediated', label: 'Remediated' },
  { value: 'accepted_risk', label: 'Accepted Risk' },
  { value: 'closed', label: 'Closed' },
];
```

**Step 2: Add the Status MultiSelect to the filter bar**

In the filter bar JSX (inside the `<div className="flex flex-wrap gap-3 items-center">` block), add a new `MultiSelect` after the Type filter (after the `</MultiSelect>` for types, before `{hasActiveFilters &&`):

```tsx
            <MultiSelect
              options={statusFilterOptions}
              selected={filters.statuses}
              onChange={(statuses) => setFilters({ statuses: statuses as FindingStatus[] })}
              placeholder="Status"
              className="w-[150px]"
            />
```

**Step 3: Update `hasActiveFilters` to include statuses**

Update the `hasActiveFilters` calculation to include:

```ts
  const hasActiveFilters =
    filters.search ||
    filters.severities.length > 0 ||
    filters.hosts.length > 0 ||
    filters.templates.length > 0 ||
    filters.tags.length > 0 ||
    filters.types.length > 0 ||
    filters.statuses.length > 0;
```

**Step 4: Update `activeFilterCount` to include statuses**

Update the `activeFilterCount` array:

```ts
  const activeFilterCount = [
    filters.search ? 1 : 0,
    filters.severities.length,
    filters.hosts.length,
    filters.templates.length,
    filters.tags.length,
    filters.types.length,
    filters.statuses.length,
  ].reduce((a, b) => a + b, 0);
```

**Step 5: Verify the build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 6: Commit**

```bash
git add src/components/findings/FindingsTable.tsx
git commit -m "feat: add Status filter dropdown to FindingsTable"
```

---

### Task 5: Add Status Column to FindingsTable

**Files:**
- Modify: `src/components/findings/FindingsTable.tsx`

**Step 1: Import StatusBadge**

Add to the imports from `./StatusWorkflow`:

```ts
import { StatusBadge } from './StatusWorkflow';
```

**Step 2: Add Status column header**

In the `<TableHeader>`, add a new `<TableHead>` after the Severity column header and before the Template column header:

```tsx
              <TableHead className="w-[130px]">Status</TableHead>
```

**Step 3: Add Status cell to each row**

In the `<TableRow>` map, add a new `<TableCell>` after the Severity cell and before the Template cell:

```tsx
                <TableCell>
                  <StatusBadge status={finding.status || 'new'} />
                </TableCell>
```

**Step 4: Verify the build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 5: Commit**

```bash
git add src/components/findings/FindingsTable.tsx
git commit -m "feat: add Status column to findings table"
```

---

### Task 6: Add Status Breakdown to Dashboard

**Files:**
- Modify: `src/types/nuclei.ts:111-118` (add `byStatus` to `Stats`)
- Modify: `src/store/findingsStore.ts:56-63` (update `defaultStats`)
- Modify: `src/store/findingsStore.ts:73-119` (update `computeData()`)
- Modify: `src/pages/Dashboard.tsx` (add status overview card)
- Create: `src/components/dashboard/StatusBreakdown.tsx`

**Step 1: Add `byStatus` to `Stats` type**

In `src/types/nuclei.ts`, update the `Stats` interface:

```ts
export interface Stats {
  total: number;
  bySeverity: Record<Severity, number>;
  byHost: Record<string, number>;
  byTemplate: Record<string, number>;
  byTag: Record<string, number>;
  byType: Record<string, number>;
  byStatus: Record<FindingStatus, number>;
}
```

**Step 2: Update `defaultStats` in findingsStore**

In `src/store/findingsStore.ts`, update `defaultStats`:

```ts
const defaultStats: Stats = {
  total: 0,
  bySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0, unknown: 0 },
  byHost: {},
  byTemplate: {},
  byTag: {},
  byType: {},
  byStatus: { new: 0, in_progress: 0, verified: 0, false_positive: 0, remediated: 0, accepted_risk: 0, closed: 0 },
};
```

**Step 3: Update `computeData()` to aggregate status counts**

In `src/store/findingsStore.ts`, add status aggregation inside the `for (const finding of findings)` loop in `computeData()`, after the tag block:

```ts
    // By status (undefined treated as 'new')
    const status = finding.status || 'new';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
```

**Step 4: Create `StatusBreakdown` component**

Create `src/components/dashboard/StatusBreakdown.tsx`:

```tsx
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { statusConfig } from '@/components/findings/StatusWorkflow';
import { cn } from '@/lib/utils';
import type { FindingStatus } from '@/types/nuclei';

interface StatusBreakdownProps {
  data: Record<FindingStatus, number>;
  onStatusClick?: (status: FindingStatus) => void;
}

// Display order for statuses
const statusOrder: FindingStatus[] = [
  'new',
  'in_progress',
  'verified',
  'false_positive',
  'remediated',
  'accepted_risk',
  'closed',
];

export function StatusBreakdown({ data, onStatusClick }: StatusBreakdownProps) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Triage Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statusOrder.map((status) => {
            const count = data[status] || 0;
            if (count === 0) return null;
            const config = statusConfig[status];
            const Icon = config.icon;
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div
                key={status}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg transition-colors',
                  onStatusClick && 'cursor-pointer hover:bg-accent/50'
                )}
                onClick={() => onStatusClick?.(status)}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', config.color)} />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', config.bgColor.replace('bg-', 'bg-').replace('/10', '/60'))}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
          {total === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No findings to display
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 5: Add StatusBreakdown to Dashboard**

In `src/pages/Dashboard.tsx`:

1. Add import:
```ts
import { StatusBreakdown } from '@/components/dashboard/StatusBreakdown';
import type { Severity, FindingStatus } from '@/types/nuclei';
```

2. Add click handler (after `handleSeverityClick`):
```ts
  const handleStatusClick = (status: FindingStatus) => {
    setFilters({ statuses: [status] });
    navigate('/findings');
  };
```

3. Add the StatusBreakdown card to the dashboard layout. In the second chart grid (`<div className="grid gap-6 md:grid-cols-2">`), replace the section that has SeverityChart + TopList to become a 2-column grid that also includes StatusBreakdown. Specifically, add a new grid section after the existing `{/* Charts */}` section:

```tsx
      {/* Status Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <StatusBreakdown
          data={stats.byStatus}
          onStatusClick={handleStatusClick}
        />
        <TopList
          title="Finding Types"
          data={stats.byType}
        />
      </div>
```

And move the "Finding Types" TopList into this new section (removing it from its original location).

**Step 6: Verify the build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 7: Commit**

```bash
git add src/types/nuclei.ts src/store/findingsStore.ts src/components/dashboard/StatusBreakdown.tsx src/pages/Dashboard.tsx
git commit -m "feat: add status breakdown to Dashboard"
```

---

### Task 7: Backfill Existing Findings Missing Status

**Files:**
- Modify: `src/store/findingsStore.ts:180-208` (backfill in `loadProjectData`)

**Step 1: Add backfill logic in `loadProjectData`**

In `src/store/findingsStore.ts`, inside `loadProjectData`, after findings are loaded from IndexedDB but before `computeData`, add logic to ensure all findings have a status. This handles data imported before this feature existed:

```ts
      // Backfill status for findings that predate the status feature
      const findingsNeedingStatus = findings.filter(f => !f.status);
      if (findingsNeedingStatus.length > 0) {
        for (const finding of findingsNeedingStatus) {
          finding.status = 'new';
          await db.updateFinding(finding);
        }
      }
```

Insert this after `const uploadedFiles = fileRecords.map(uploadedFileFromRecord);` (line 190) and before `const computed = computeData(findings);` (line 191).

**Step 2: Verify the build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/store/findingsStore.ts
git commit -m "feat: backfill existing findings with default 'new' status on load"
```

---

### Task 8: Final Integration Verification

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Run lint**

Run: `npm run lint`
Expected: No lint errors (or only pre-existing ones)

**Step 5: Commit any remaining fixes**

If any fixes were needed, commit them:
```bash
git add -A
git commit -m "fix: resolve lint/type issues from status filtering feature"
```

---

## Summary of All Changes

| File | Change |
|------|--------|
| `vitest.config.ts` | NEW — Vitest configuration |
| `src/test/setup.ts` | NEW — Test setup file |
| `package.json` | Add vitest devDeps + test scripts |
| `src/services/parser/nucleiParser.ts:45` | Add `status: 'new'` to `transformRawFinding` |
| `src/services/parser/__tests__/nucleiParser.test.ts` | NEW — Parser tests |
| `src/types/nuclei.ts:102-109` | Add `statuses: FindingStatus[]` to `FilterState` |
| `src/types/nuclei.ts:111-118` | Add `byStatus: Record<FindingStatus, number>` to `Stats` |
| `src/store/findingsStore.ts:47-54` | Add `statuses: []` to `defaultFilters` |
| `src/store/findingsStore.ts:56-63` | Add `byStatus` to `defaultStats` |
| `src/store/findingsStore.ts:73-119` | Add status aggregation to `computeData()` |
| `src/store/findingsStore.ts:121-164` | Add status filter to `applyFilters()` |
| `src/store/findingsStore.ts:180-208` | Backfill existing findings in `loadProjectData()` |
| `src/store/__tests__/findingsStore.test.ts` | NEW — Store filter tests |
| `src/components/findings/FindingsTable.tsx` | Add Status filter dropdown, Status column, update filter counts |
| `src/components/dashboard/StatusBreakdown.tsx` | NEW — Status breakdown chart component |
| `src/pages/Dashboard.tsx` | Add StatusBreakdown card + click handler |
