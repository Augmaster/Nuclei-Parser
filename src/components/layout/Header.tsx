import { Link } from 'react-router-dom';
import { Moon, Sun, Monitor, Shield, ChevronRight, Building2, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useThemeStore, applyTheme } from '@/store/themeStore';
import { useEffect } from 'react';
import { useStats } from '@/store/findingsStore';
import { useActiveCompany, useActiveProject } from '@/store/organizationStore';

export function Header() {
  const { theme, setTheme } = useThemeStore();
  const stats = useStats();
  const activeCompany = useActiveCompany();
  const activeProject = useActiveProject();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        <Link to="/" className="flex items-center gap-3 mr-6 hover:opacity-80 transition-opacity">
          <div className="relative">
            <Shield className="h-8 w-8 text-primary" />
            <div className="absolute inset-0 h-8 w-8 text-primary blur-sm opacity-50">
              <Shield className="h-8 w-8" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight">Nuclei Viewer</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Security Scanner Dashboard</span>
          </div>
        </Link>

        {/* Breadcrumb */}
        {activeCompany && (
          <div className="hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground mr-4">
            <Building2 className="h-4 w-4" />
            <span className="font-medium text-foreground">{activeCompany.name}</span>
            {activeProject && (
              <>
                <ChevronRight className="h-4 w-4" />
                <FolderKanban className="h-4 w-4" />
                <span className="font-medium text-foreground">{activeProject.name}</span>
              </>
            )}
          </div>
        )}

        {stats.total > 0 && (
          <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-muted/50 border border-border/50">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium">{stats.bySeverity.critical} Critical</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-xs font-medium">{stats.bySeverity.high} High</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-xs font-medium">{stats.bySeverity.medium} Medium</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-xs font-medium">{stats.bySeverity.low} Low</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-slate-400" />
              <span className="text-xs font-medium">{stats.bySeverity.info} Info</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs text-muted-foreground">{stats.total} Total</span>
          </div>
        )}

        <div className="flex flex-1 items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
