import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, EyeOff } from 'lucide-react';
import { useOnboarding, StepKey, NonEmpresaKey, OnboardingSteps } from '@/hooks/useOnboarding';

interface StepMeta {
  key: StepKey;
  num: number;
  title: string;
  sub: string;
  duration: string | null;
  route: string | null;
}

const STEPS_META: StepMeta[] = [
  { key: 'empresa',  num: 1, title: 'Crear tu empresa',                                      sub: 'Tu empresa · creada hoy',                              duration: null,    route: null },
  { key: 'tienda',   num: 2, title: 'Configurar tu tienda',                                   sub: 'Nombre público, WhatsApp de pedidos y link',            duration: '2 min', route: '/tienda-config' },
  { key: 'producto', num: 3, title: 'Subir tu primer producto',                               sub: 'Costo y precio — el margen se calcula solo',            duration: '3 min', route: '/products' },
  { key: 'tarea',    num: 4, title: 'Crear tu primera tarea',                                 sub: 'Lo que tienes que hacer esta semana',                   duration: '1 min', route: '/tasks' },
  { key: 'link',     num: 5, title: 'Compartir el link y registrar tu primera venta',         sub: 'El Radar IA se enciende con la primera venta',          duration: '1 min', route: '/sales' },
];

function headerTitle(steps: OnboardingSteps): string {
  if (!steps.tienda) return 'Tu tienda todavía no está en línea';
  const count = Object.values(steps).filter(Boolean).length;
  if (count === 5) return 'Todo listo — ya puedes vender';
  return 'Te falta poco para vender';
}

interface StepRowProps {
  meta: StepMeta;
  done: boolean;
  isActive: boolean;
}

function StepRow({ meta, done, isActive }: StepRowProps) {
  const navigate = useNavigate();
  const borderColor = isActive ? '#DC2626' : '#E5E5E5';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '18px 20px',
      borderRadius: '12px',
      background: '#fff',
      border: `1px solid ${borderColor}`,
    }}>
      {/* Indicator */}
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '9999px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: done ? '#111111' : 'transparent',
        border: done ? 'none' : `2px solid ${isActive ? '#DC2626' : '#E5E5E5'}`,
      }}>
        {done
          ? <Check style={{ width: '18px', height: '18px', color: '#fff' }} />
          : <span style={{ fontSize: '14px', fontWeight: 700, color: isActive ? '#DC2626' : '#E5E5E5' }}>{meta.num}</span>
        }
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '16px',
          fontWeight: 600,
          color: done ? '#6B7280' : '#111111',
          textDecoration: done ? 'line-through' : 'none',
          margin: 0,
        }}>
          {meta.title}
        </p>
        <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0' }}>
          {meta.sub}
        </p>
      </div>

      {/* Duration */}
      {meta.duration && (
        <span style={{ fontSize: '12px', color: '#6B7280', flexShrink: 0 }}>
          {meta.duration}
        </span>
      )}

      {/* CTA */}
      {meta.route && (
        done ? (
          <button
            onClick={() => navigate(meta.route!)}
            style={{
              height: '40px',
              padding: '0 14px',
              borderRadius: '8px',
              border: '1px solid #E5E5E5',
              background: '#fff',
              color: '#6B7280',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'border-color 120ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#DC2626')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E5E5')}
          >
            Ver
          </button>
        ) : (
          <button
            onClick={() => navigate(meta.route!)}
            style={{
              height: '40px',
              padding: '0 18px',
              borderRadius: '8px',
              border: 'none',
              background: isActive ? '#DC2626' : '#F5F5F5',
              color: isActive ? '#fff' : '#6B7280',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              transition: 'background 120ms',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = isActive ? '#B91C1C' : '#E5E5E5';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = isActive ? '#DC2626' : '#F5F5F5';
            }}
          >
            {isActive ? `Ir a ${meta.key === 'tienda' ? 'Tienda' : meta.key === 'producto' ? 'Productos' : meta.key === 'tarea' ? 'Tareas' : 'Ventas'}` : 'Pendiente'}
            {isActive && <ArrowRight style={{ width: '16px', height: '16px' }} />}
          </button>
        )
      )}
    </div>
  );
}

interface Props {
  companyName?: string;
}

export function OnboardingChecklist({ companyName }: Props) {
  const { steps, count, pct, nextKey, dismiss } = useOnboarding();
  const remaining = 5 - count;

  // Replace empresa subtitle with actual company name
  const stepsWithMeta = STEPS_META.map(m =>
    m.key === 'empresa' && companyName
      ? { ...m, sub: `${companyName} · creada hoy` }
      : m
  );

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E5E5',
      borderRadius: '16px',
      padding: '36px 40px',
      boxShadow: '0 4px 32px -4px rgba(0,0,0,.08)',
    }}>
      {/* Header grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: '48px',
        alignItems: 'start',
      }}
      className="max-md:grid-cols-1 max-md:gap-6"
      >
        {/* Left */}
        <div>
          <p style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '12px',
            fontWeight: 700,
            color: '#6B7280',
            letterSpacing: '0.15em',
            marginBottom: '10px',
          }}>
            PARA VENDER NECESITAS 5 COSAS
          </p>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 600,
            fontSize: '30px',
            color: '#111111',
            letterSpacing: '-0.02em',
            marginBottom: '10px',
            lineHeight: 1.2,
          }}>
            {headerTitle(steps)}
          </h2>
          <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.5 }}>
            Cada paso te abre la sección donde de verdad se hace. Terminas ahí y vuelves solo.
          </p>
        </div>

        {/* Right */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
            <span style={{ fontSize: '40px', fontWeight: 700, color: '#111111', fontFeatureSettings: "'tnum'" }}>
              {count}
            </span>
            <span style={{ fontSize: '16px', color: '#6B7280' }}>de 5 listos</span>
          </div>

          <div style={{ height: '8px', background: '#F5F5F5', borderRadius: '9999px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{ height: '100%', width: `${pct * 100}%`, background: '#DC2626', borderRadius: '9999px', transition: 'width 400ms' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>
              {count === 5
                ? 'Todo listo — el Centro vuelve a la normalidad'
                : remaining === 1
                  ? '1 paso restante'
                  : `${remaining} pasos restantes`}
            </span>
            <button
              onClick={dismiss}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color: '#6B7280',
                padding: '4px 0',
                transition: 'color 120ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#DC2626')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
            >
              <EyeOff style={{ width: '14px', height: '14px' }} />
              Ocultar
            </button>
          </div>
        </div>
      </div>

      {/* Steps list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '32px' }}>
        {stepsWithMeta.map(meta => (
          <StepRow
            key={meta.key}
            meta={meta}
            done={steps[meta.key]}
            isActive={meta.key === nextKey}
          />
        ))}
      </div>
    </div>
  );
}
