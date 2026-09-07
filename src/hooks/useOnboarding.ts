import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from './useCompany';

const db = supabase as any;

export type StepKey = 'empresa' | 'tienda' | 'producto' | 'tarea' | 'link';
export type NonEmpresaKey = Exclude<StepKey, 'empresa'>;

const STEP_ORDER: NonEmpresaKey[] = ['tienda', 'producto', 'tarea', 'link'];

export interface OnboardingSteps {
  empresa: boolean;
  tienda: boolean;
  producto: boolean;
  tarea: boolean;
  link: boolean;
}

export interface RawOnboarding {
  steps: OnboardingSteps;
  completedAt: string | null;
  dismissed: boolean;
}

const DEFAULT_STEPS: OnboardingSteps = {
  empresa: true,
  tienda: false,
  producto: false,
  tarea: false,
  link: false,
};

async function fetchAndReconcile(companyId: string): Promise<RawOnboarding | null> {
  const { data: company } = await db
    .from('companies')
    .select('onboarding')
    .eq('id', companyId)
    .maybeSingle();

  const stored: RawOnboarding | null = company?.onboarding ?? null;

  // Old company (pre-feature) — null means skip onboarding entirely
  if (!stored) return null;

  const [scRes, prodRes, taskRes, saleRes] = await Promise.all([
    db.from('store_config')
      .select('clave, valor')
      .eq('company_id', companyId)
      .in('clave', ['store_name', 'wa_number']),
    db.from('products')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
    db.from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
    db.from('sales')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
  ]);

  const scMap: Record<string, string> = {};
  (scRes.data ?? []).forEach((r: { clave: string; valor: string }) => {
    scMap[r.clave] = r.valor;
  });

  const hasStore = !!(scMap.store_name?.trim() && scMap.wa_number?.trim());
  const hasProd  = (prodRes.count ?? 0) >= 1;
  const hasTask  = (taskRes.count ?? 0) >= 1;
  const hasSale  = (saleRes.count ?? 0) >= 1;

  const reconciledSteps: OnboardingSteps = {
    empresa:  true,
    tienda:   stored.steps.tienda   || hasStore,
    producto: stored.steps.producto || hasProd,
    tarea:    stored.steps.tarea    || hasTask,
    link:     stored.steps.link     || hasSale,
  };

  const changed =
    reconciledSteps.tienda   !== stored.steps.tienda   ||
    reconciledSteps.producto !== stored.steps.producto ||
    reconciledSteps.tarea    !== stored.steps.tarea    ||
    reconciledSteps.link     !== stored.steps.link;

  const count = Object.values(reconciledSteps).filter(Boolean).length;
  const completedAt =
    stored.completedAt ?? (count === 5 ? new Date().toISOString() : null);

  const reconciled: RawOnboarding = {
    steps: reconciledSteps,
    completedAt,
    dismissed: stored.dismissed,
  };

  if (changed) {
    // Fire-and-forget background write — no await to unblock UI
    db.from('companies')
      .update({ onboarding: reconciled })
      .eq('id', companyId);
  }

  return reconciled;
}

export function useOnboarding() {
  const { companyId } = useCompany();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding', companyId],
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchAndReconcile(companyId!),
  });

  const writeOptimistic = useCallback(
    (next: RawOnboarding) => {
      qc.setQueryData(['onboarding', companyId], next);
      db.from('companies').update({ onboarding: next }).eq('id', companyId);
    },
    [companyId, qc],
  );

  const markStep = useCallback(
    (key: NonEmpresaKey) => {
      if (!data) return;
      const newSteps = { ...data.steps, [key]: true };
      const count = Object.values(newSteps).filter(Boolean).length;
      writeOptimistic({
        steps: newSteps,
        completedAt: count === 5 ? new Date().toISOString() : data.completedAt,
        dismissed: data.dismissed,
      });
    },
    [data, writeOptimistic],
  );

  const dismiss = useCallback(() => {
    if (!data) return;
    writeOptimistic({ ...data, dismissed: true });
  }, [data, writeOptimistic]);

  const show = useCallback(() => {
    if (!data) return;
    writeOptimistic({ ...data, dismissed: false });
  }, [data, writeOptimistic]);

  const steps = data?.steps ?? DEFAULT_STEPS;
  const count = Object.values(steps).filter(Boolean).length;
  const isCompleted = !!data?.completedAt;
  const setupOn = !!data && !isCompleted;
  const isDismissed = data?.dismissed ?? false;
  const nextKey: NonEmpresaKey | null = setupOn
    ? (STEP_ORDER.find(k => !steps[k]) ?? null)
    : null;

  return {
    steps,
    count,
    pct: count / 5,
    nextKey,
    setupOn,
    isDismissed,
    isCompleted,
    loading: isLoading,
    markStep,
    dismiss,
    show,
  };
}
