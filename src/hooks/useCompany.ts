import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useCompany() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCompanyId(null);
      setLoading(false);
      return;
    }

    const fetchCompany = async () => {
      const { data, error } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (!error && data) {
        setCompanyId(data.company_id);
      }
      setLoading(false);
    };

    fetchCompany();
  }, [user]);

  return { companyId, loading };
}
