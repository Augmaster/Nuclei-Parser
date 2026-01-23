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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
      >
        Skip to main content
      </a>
      <Header />
      <Sidebar />
      <main id="main-content" className="pl-64 pt-16" tabIndex={-1}>
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
