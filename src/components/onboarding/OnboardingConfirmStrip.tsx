import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { NonEmpresaKey } from '@/hooks/useOnboarding';

const STEP_TITLES: Record<NonEmpresaKey, string> = {
  tienda:   'Configurar tu tienda',
  producto: 'Subir tu primer producto',
  tarea:    'Crear tu primera tarea',
  link:     'Compartir el link',
};

const STEP_ROUTES: Record<NonEmpresaKey, string> = {
  tienda:   '/tienda-config',
  producto: '/products',
  tarea:    '/tasks',
  link:     '/sales',
};

interface Props {
  savedKey: NonEmpresaKey;
  nextKey: NonEmpresaKey | null;
  onDismiss: () => void;
}

export function OnboardingConfirmStrip({ savedKey, nextKey, onDismiss }: Props) {
  const navigate = useNavigate();

  return (
    <div style={{
      background: '#0A0A0A',
      borderRadius: '12px',
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '0',
      flexWrap: 'wrap',
    }}>
      <CheckCircle2 style={{ width: '18px', height: '18px', color: '#DC2626', flexShrink: 0 }} />

      <span style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', flexShrink: 0 }}>
        Guardado: {STEP_TITLES[savedKey]}
      </span>

      {nextKey && (
        <span style={{ fontSize: '14px', color: '#A3A3A3' }}>
          Retomamos donde quedaste: sigue{' '}
          <strong style={{ color: '#FFFFFF', fontWeight: 600 }}>{STEP_TITLES[nextKey]}</strong>
        </span>
      )}

      <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
        {nextKey && (
          <button
            onClick={() => navigate(STEP_ROUTES[nextKey])}
            style={{
              height: '34px',
              padding: '0 14px',
              borderRadius: '8px',
              background: '#DC2626',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              transition: 'background 120ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#B91C1C')}
            onMouseLeave={e => (e.currentTarget.style.background = '#DC2626')}
          >
            Continuar
          </button>
        )}
        <button
          onClick={onDismiss}
          style={{
            height: '34px',
            padding: '0 12px',
            borderRadius: '8px',
            background: 'transparent',
            color: '#A3A3A3',
            fontSize: '13px',
            border: '1px solid #242424',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
