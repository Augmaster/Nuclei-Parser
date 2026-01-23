import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FindingDetailComponent } from '@/components/findings/FindingDetail';
import { useFindingsStore } from '@/store/findingsStore';

export function FindingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const findings = useFindingsStore(state => state.findings);

  const finding = findings.find(f => f.id === id);

  if (!finding) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h1 className="text-2xl font-bold mb-2">Finding Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The requested finding could not be found
        </p>
        <Button onClick={() => navigate('/findings')}>Back to Findings</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="gap-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <FindingDetailComponent finding={finding} />
    </div>
  );
}
