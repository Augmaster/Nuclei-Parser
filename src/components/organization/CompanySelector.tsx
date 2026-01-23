import { Building2, ChevronDown, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useCompanies,
  useActiveCompanyId,
  useOrganizationStore,
} from '@/store/organizationStore';

interface CompanySelectorProps {
  onCreateNew?: () => void;
  onManage?: () => void;
}

export function CompanySelector({ onCreateNew, onManage }: CompanySelectorProps) {
  const companies = useCompanies();
  const activeCompanyId = useActiveCompanyId();
  const setActiveCompany = useOrganizationStore(state => state.setActiveCompany);

  const activeCompany = companies.find(c => c.id === activeCompanyId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-auto py-2 px-3"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium">
              {activeCompany?.name || 'Select Company'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {companies.map(company => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => setActiveCompany(company.id)}
            className={activeCompanyId === company.id ? 'bg-accent' : ''}
          >
            <Building2 className="h-4 w-4 mr-2" />
            <span className="truncate">{company.name}</span>
          </DropdownMenuItem>
        ))}
        {companies.length === 0 && (
          <DropdownMenuItem disabled>
            <span className="text-muted-foreground">No companies yet</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {onCreateNew && (
          <DropdownMenuItem onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Company
          </DropdownMenuItem>
        )}
        {onManage && (
          <DropdownMenuItem onClick={onManage}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Companies
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
