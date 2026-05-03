import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, Crown, ToggleRight, ToggleLeft, Calendar, Phone } from 'lucide-react';
import { toast } from 'sonner';

const db = supabase as any;

type Company = {
  id: string;
  name: string;
  plan: string;
  activo: boolean;
  is_grc: boolean;
  wa_number: string | null;
  created_at: string;
};

const PLAN_COLORS: Record<string, string> = {
  enterprise: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pro:        'bg-blue-100 text-blue-800 border-blue-200',
  gratis:     'bg-gray-100 text-gray-600 border-gray-200',
};

export default function SuperAdmin() {
  const qc = useQueryClient();
  const [toggling, setToggling] = useState<string | null>(null);

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ['superadmin-companies'],
    queryFn: async () => {
      const { data, error } = await db
        .from('companies')
        .select('id, name, plan, activo, is_grc, wa_number, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggleActivo = async (company: Company) => {
    setToggling(company.id);
    const { error } = await db
      .from('companies')
      .update({ activo: !company.activo })
      .eq('id', company.id);

    if (error) {
      toast.error('Error al actualizar: ' + error.message);
    } else {
      toast.success(`"${company.name}" ${!company.activo ? 'activada' : 'desactivada'}`);
      qc.invalidateQueries({ queryKey: ['superadmin-companies'] });
    }
    setToggling(null);
  };

  const total    = companies.length;
  const activas  = companies.filter(c => c.activo).length;
  const clientes = companies.filter(c => !c.is_grc).length;

  return (
    <div className="min-h-screen bg-background">
      <CommandCenterNav />

      <div className="container max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Super Admin</h1>
            <p className="text-sm text-muted-foreground">Panel exclusivo GRC — gestión de empresas</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total empresas', value: total },
            { label: 'Activas',        value: activas },
            { label: 'Clientes',       value: clientes },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No hay empresas registradas.
          </div>
        ) : (
          <div className="space-y-3">
            {companies.map(company => (
              <Card key={company.id} className={`transition-opacity ${!company.activo ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">

                    {/* Icono */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${company.is_grc ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      {company.is_grc
                        ? <Crown className="w-5 h-5" />
                        : <Building2 className="w-5 h-5" />
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {company.name}
                        </span>
                        {company.is_grc && (
                          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                            GRC
                          </Badge>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PLAN_COLORS[company.plan] ?? PLAN_COLORS.gratis}`}>
                          {company.plan}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${company.activo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                          {company.activo ? 'activa' : 'inactiva'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(company.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {company.wa_number && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {company.wa_number}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Toggle — no se puede desactivar GRC */}
                    {!company.is_grc && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 h-8 px-2"
                        disabled={toggling === company.id}
                        onClick={() => toggleActivo(company)}
                        title={company.activo ? 'Desactivar empresa' : 'Activar empresa'}
                      >
                        {toggling === company.id
                          ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          : company.activo
                            ? <ToggleRight className="w-7 h-7 text-primary" />
                            : <ToggleLeft  className="w-7 h-7 text-muted-foreground" />
                        }
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
