import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';

interface Props {
  paso: 2 | 3 | 4 | 5;
  label: string;
}

const PASO_LABELS: Record<number, string> = {
  2: 'Configurar tu tienda',
  3: 'Subir tu primer producto',
  4: 'Crear tu primera tarea',
  5: 'Compartir el link',
};

export function OnboardingSectionHeader({ paso, label }: Props) {
  const navigate = useNavigate();
  const { count, setupOn } = useOnboarding();

  if (!setupOn) return null;

  const pct = (count / 5) * 100;

  return (
    <div style={{
      paddingBottom: '22px',
      borderBottom: '1px solid #E5E5E5',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '28px',
      flexWrap: 'wrap',
    }}>
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: '38px',
          padding: '0 14px',
          border: '1px solid #E5E5E5',
          borderRadius: '8px',
          background: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          color: '#111111',
          cursor: 'pointer',
          transition: 'border-color 120ms',
          flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#DC2626')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E5E5')}
      >
        <ArrowLeft style={{ width: '14px', height: '14px' }} />
        Volver al Centro
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: '11px',
          fontWeight: 700,
          color: '#DC2626',
          letterSpacing: '0.1em',
          display: 'block',
          marginBottom: '2px',
        }}>
          PASO {paso} DE 5
        </span>
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#111111' }}>
          {label || PASO_LABELS[paso]}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <span style={{ fontSize: '13px', color: '#6B7280' }}>{count} de 5 listos</span>
        <div style={{ width: '120px', height: '6px', background: '#F5F5F5', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#DC2626', borderRadius: '9999px', transition: 'width 300ms' }} />
        </div>
      </div>
    </div>
  );
}
