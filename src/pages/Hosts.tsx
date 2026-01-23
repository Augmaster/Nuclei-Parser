import { useNavigate } from 'react-router-dom';
import { Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFindingsStore, useStats } from '@/store/findingsStore';
import type { Severity } from '@/types/nuclei';

export function HostsPage() {
  const navigate = useNavigate();
  const stats = useStats();
  const findings = useFindingsStore(state => state.findings);
  const setFilters = useFindingsStore(state => state.setFilters);

  // Group findings by host with severity counts
  const hostData = Object.entries(stats.byHost)
    .map(([host, count]) => {
      const hostFindings = findings.filter(f => f.host === host);
      const severityCounts: Record<Severity, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
        unknown: 0,
      };
      hostFindings.forEach(f => {
        severityCounts[f.info.severity]++;
      });
      return { host, count, severityCounts };
    })
    .sort((a, b) => {
      // Sort by critical, then high, then total
      if (a.severityCounts.critical !== b.severityCounts.critical) {
        return b.severityCounts.critical - a.severityCounts.critical;
      }
      if (a.severityCounts.high !== b.severityCounts.high) {
        return b.severityCounts.high - a.severityCounts.high;
      }
      return b.count - a.count;
    });

  const handleHostClick = (host: string) => {
    setFilters({ hosts: [host] });
    navigate('/findings');
  };

  if (hostData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Server className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">No Hosts</h1>
        <p className="text-muted-foreground mb-6">
          Upload Nuclei scan output files to see affected hosts
        </p>
        <Button onClick={() => navigate('/upload')}>Upload Files</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hosts</h1>
        <p className="text-muted-foreground">
          {hostData.length} unique hosts with findings
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {hostData.map(({ host, count, severityCounts }) => (
          <Card
            key={host}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => handleHostClick(host)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium truncate" title={host}>
                {host}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold">{count}</span>
                <span className="text-sm text-muted-foreground">findings</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(['critical', 'high', 'medium', 'low', 'info'] as const).map(severity => {
                  const severityCount = severityCounts[severity];
                  if (severityCount === 0) return null;
                  return (
                    <Badge key={severity} variant={severity} className="text-xs">
                      {severityCount}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
