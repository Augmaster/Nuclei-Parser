import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FindingDetailComponent } from '@/components/findings/FindingDetail';
import { useFilteredFindings } from '@/store/findingsStore';

export function FindingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const filteredFindings = useFilteredFindings();

  // Find current position in filtered list and calculate navigation
  const { finding, prevId, nextId, position, total } = useMemo(() => {
    const index = filteredFindings.findIndex(f => f.id === id);
    if (index === -1) {
      return { finding: null, prevId: null, nextId: null, position: 0, total: 0 };
    }
    return {
      finding: filteredFindings[index],
      prevId: index > 0 ? filteredFindings[index - 1].id : null,
      nextId: index < filteredFindings.length - 1 ? filteredFindings[index + 1].id : null,
      position: index + 1,
      total: filteredFindings.length,
    };
  }, [filteredFindings, id]);

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
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {position} of {total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!prevId}
              onClick={() => prevId && navigate(`/findings/${prevId}`, { replace: true })}
              title="Previous finding"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!nextId}
              onClick={() => nextId && navigate(`/findings/${nextId}`, { replace: true })}
              title="Next finding"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <FindingDetailComponent finding={finding} />
    </div>
  );
}
