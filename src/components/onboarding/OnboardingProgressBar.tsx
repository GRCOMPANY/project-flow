import { useNavigate } from 'react-router-dom';
import { useOnboarding, NonEmpresaKey } from '@/hooks/useOnboarding';

const PILLS: { key: NonEmpresaKey; label: string; route: string }[] = [
  { key: 'tienda',   label: 'Tienda',    route: '/tienda-config' },
  { key: 'producto', label: 'Producto',  route: '/products' },
  { key: 'tarea',    label: 'Tarea',     route: '/tasks' },
  { key: 'link',     label: 'Compartir', route: '/sales' },
];

export function OnboardingProgressBar() {
  const navigate = useNavigate();
  const { steps, count, pct, nextKey, setupOn, isCompleted } = useOnboarding();

  if (!setupOn && !isCompleted) return null;
  if (count >= 5) return null;

  return (
    <div style={{ background: '#0A0A0A', borderBottom: '1px solid #1a1a1a' }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        flexWrap: 'wrap',
      }}>
        <span style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: '11px',
          fontWeight: 700,
          color: '#DC2626',
          letterSpacing: '0.12em',
          flexShrink: 0,
        }}>
          PUESTA EN MARCHA
        </span>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {PILLS.map(({ key, label, route }) => {
            const done = steps[key];
            const isActive = key === nextKey;
            return (
              <button
                key={key}
                onClick={() => navigate(route)}
                style={{
                  height: '26px',
                  padding: '0 10px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'background 120ms',
                  background: done ? '#242424' : isActive ? '#DC2626' : '#242424',
                  color: done ? '#F5F5F5' : isActive ? '#fff' : '#A3A3A3',
                }}
              >
                <span>{done ? '✓' : '○'}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <span style={{ fontSize: '12px', color: '#A3A3A3', marginLeft: '2px' }}>
          {count} de 5
        </span>

        <div style={{ width: '140px', height: '6px', background: '#242424', borderRadius: '9999px', overflow: 'hidden', marginLeft: 'auto' }}>
          <div style={{ height: '100%', width: `${pct * 100}%`, background: '#DC2626', borderRadius: '9999px', transition: 'width 400ms' }} />
        </div>
      </div>
    </div>
  );
}
