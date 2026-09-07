import { ListChecks } from 'lucide-react';
import { useOnboarding, NonEmpresaKey } from '@/hooks/useOnboarding';

const NEXT_LABELS: Record<NonEmpresaKey, string> = {
  tienda:   'Configurar tu tienda',
  producto: 'Subir tu primer producto',
  tarea:    'Crear tu primera tarea',
  link:     'Compartir el link',
};

export function OnboardingHiddenStrip() {
  const { count, pct, nextKey, show } = useOnboarding();

  return (
    <div style={{
      padding: '16px 20px',
      borderRadius: '12px',
      border: '1px solid #E5E5E5',
      background: '#FAFAFA',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      flexWrap: 'wrap',
    }}>
      <ListChecks style={{ width: '18px', height: '18px', color: '#DC2626', flexShrink: 0 }} />

      <span style={{ fontSize: '14px', fontWeight: 600, color: '#111111', flexShrink: 0 }}>
        Puesta en marcha · {count} de 5
      </span>

      <div style={{ width: '120px', height: '6px', background: '#E5E5E5', borderRadius: '9999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, background: '#DC2626', borderRadius: '9999px' }} />
      </div>

      {nextKey && (
        <span style={{ fontSize: '13px', color: '#6B7280' }}>
          Sigue: {NEXT_LABELS[nextKey]}
        </span>
      )}

      <button
        onClick={show}
        style={{
          marginLeft: 'auto',
          height: '34px',
          padding: '0 14px',
          borderRadius: '8px',
          border: '1px solid #E5E5E5',
          background: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          color: '#6B7280',
          cursor: 'pointer',
          transition: 'border-color 120ms, color 120ms',
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = '#DC2626';
          (e.currentTarget as HTMLElement).style.color = '#DC2626';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = '#E5E5E5';
          (e.currentTarget as HTMLElement).style.color = '#6B7280';
        }}
      >
        Mostrar checklist
      </button>
    </div>
  );
}
