import { useCompany } from '@/contexts/CompanyContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function CompanySwitcher() {
  const { currentCompany, companies, switchCompany } = useCompany();

  if (!currentCompany) return null;

  if (companies.length <= 1) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1">
        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
          {currentCompany.name}
        </span>
        {currentCompany.isGrc && (
          <Badge variant="default" className="text-[9px] h-3.5 px-1">GRC</Badge>
        )}
      </div>
    );
  }

  return (
    <Select value={currentCompany.id} onValueChange={switchCompany}>
      <SelectTrigger className="h-8 w-[140px] text-xs border-none bg-secondary/50">
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {companies.map((c) => (
          <SelectItem key={c.id} value={c.id} className="text-xs">
            <div className="flex items-center gap-1.5">
              {c.name}
              {c.isGrc && <Badge variant="default" className="text-[9px] h-3.5 px-1 ml-1">GRC</Badge>}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
