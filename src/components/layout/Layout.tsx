import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useActiveProjectId } from '@/store/organizationStore';
import { useFindingsStore } from '@/store/findingsStore';

export function Layout() {
  const activeProjectId = useActiveProjectId();
  const loadProjectData = useFindingsStore(state => state.loadProjectData);
  const clearProjectData = useFindingsStore(state => state.clearProjectData);

  // Load findings when active project changes
  useEffect(() => {
    if (activeProjectId) {
      loadProjectData(activeProjectId);
    } else {
      clearProjectData();
    }
  }, [activeProjectId, loadProjectData, clearProjectData]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="pl-64 pt-16">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
