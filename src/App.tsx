import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Layout } from '@/components/layout/Layout';
import { DashboardPage } from '@/pages/Dashboard';
import { UploadPage } from '@/pages/Upload';
import { FindingsPage } from '@/pages/Findings';
import { FindingDetailPage } from '@/pages/FindingDetailPage';
import { HostsPage } from '@/pages/Hosts';
import { HostRiskPage } from '@/pages/HostRisk';
import { TemplatesPage } from '@/pages/Templates';
import { ScanComparisonPage } from '@/pages/ScanComparison';
import { ExportPage } from '@/pages/Export';
import { CompaniesPage } from '@/pages/Companies';
import { ProjectsPage } from '@/pages/Projects';
import { useOrganizationStore } from '@/store/organizationStore';

function App() {
  const initialize = useOrganizationStore(state => state.initialize);
  const isInitialized = useOrganizationStore(state => state.isInitialized);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Toaster position="top-right" richColors closeButton />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="findings" element={<FindingsPage />} />
            <Route path="findings/:id" element={<FindingDetailPage />} />
            <Route path="hosts" element={<HostsPage />} />
            <Route path="host-risk" element={<HostRiskPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="comparison" element={<ScanComparisonPage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="projects" element={<ProjectsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
