import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type CompanyRole = 'owner' | 'admin' | 'collaborator' | 'seller';

export interface Company {
  id: string;
  name: string;
  ownerUserId: string;
  plan: string;
  linkedToGrc: boolean;
  isGrc: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyUser {
  id: string;
  userId: string;
  companyId: string;
  role: CompanyRole;
  status: string;
  createdAt: string;
}

interface CompanyContextType {
  currentCompany: Company | null;
  companies: Company[];
  companyRole: CompanyRole | null;
  isOwner: boolean;
  isCompanyAdmin: boolean;
  switchCompany: (companyId: string) => void;
  loading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const ACTIVE_COMPANY_KEY = 'grc_active_company_id';

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [companyRole, setCompanyRole] = useState<CompanyRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = useCallback(async (userId: string) => {
    // Fetch company_users for this user
    const { data: cuData, error: cuError } = await supabase
      .from('company_users')
      .select('*, company:companies(*)')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (cuError || !cuData) {
      console.error('Error fetching companies:', cuError);
      setLoading(false);
      return;
    }

    const mappedCompanies: (Company & { role: CompanyRole })[] = cuData
      .filter((cu: any) => cu.company)
      .map((cu: any) => ({
        id: cu.company.id,
        name: cu.company.name,
        ownerUserId: cu.company.owner_user_id,
        plan: cu.company.plan,
        linkedToGrc: cu.company.linked_to_grc,
        isGrc: cu.company.is_grc,
        createdAt: cu.company.created_at,
        updatedAt: cu.company.updated_at,
        role: cu.role as CompanyRole,
      }));

    setCompanies(mappedCompanies);

    // Determine active company
    const savedId = localStorage.getItem(ACTIVE_COMPANY_KEY);
    const saved = mappedCompanies.find(c => c.id === savedId);
    const active = saved || mappedCompanies[0];

    if (active) {
      setCurrentCompany(active);
      setCompanyRole(active.role);
      localStorage.setItem(ACTIVE_COMPANY_KEY, active.id);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchCompanies(user.id);
    } else {
      setCompanies([]);
      setCurrentCompany(null);
      setCompanyRole(null);
      setLoading(false);
    }
  }, [user, fetchCompanies]);

  const switchCompany = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setCurrentCompany(company);
      setCompanyRole((company as any).role || 'collaborator');
      localStorage.setItem(ACTIVE_COMPANY_KEY, companyId);
    }
  };

  const value: CompanyContextType = {
    currentCompany,
    companies,
    companyRole,
    isOwner: companyRole === 'owner',
    isCompanyAdmin: companyRole === 'owner' || companyRole === 'admin',
    switchCompany,
    loading,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
