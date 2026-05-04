import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const db = supabase as any;

export function useCompany() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isGRC, setIsGRC] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCompanyId(null);
      setIsGRC(false);
      setLoading(false);
      return;
    }

    const fetchCompany = async () => {
      const { data: cu } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (cu?.company_id) {
        setCompanyId(cu.company_id);
        const { data: co } = await db
          .from('companies')
          .select('is_grc')
          .eq('id', cu.company_id)
          .maybeSingle();
        setIsGRC(co?.is_grc === true);
      }
      setLoading(false);
    };

    fetchCompany();
  }, [user]);

  return { companyId, isGRC, loading };
}
