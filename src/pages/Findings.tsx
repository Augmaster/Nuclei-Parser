import { FindingsTable } from '@/components/findings/FindingsTable';

export function FindingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Findings</h1>
        <p className="text-muted-foreground mt-1">
          Browse and filter all findings from your Nuclei scans
        </p>
      </div>

      <FindingsTable />
    </div>
  );
}
