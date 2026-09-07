import { useNavigate } from 'react-router-dom';
import { Link } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';

interface Props {
  onClose: () => void;
}

export function OnboardingCelebration({ onClose }: Props) {
  const navigate = useNavigate();
  const { slug } = useCompany();
  const storeUrl = slug
    ? `grc.app/tienda/${slug}`
    : 'grc.app/tienda/mi-tienda';

  const handleClose = () => {
    onClose();
    navigate('/');
  };

  return (
    <div style={{
      background: '#0A0A0A',
      borderRadius: '16px',
      padding: '44px 40px',
      display: 'grid',
      gridTemplateColumns: '1fr 340px',
      gap: '48px',
      alignItems: 'center',
    }}
    className="max-md:grid-cols-1 max-md:gap-8 max-md:p-8"
    >
      {/* Left */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '9999px',
            background: '#DC2626',
            animation: 'pulseDot 2s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '11px',
            fontWeight: 700,
            color: '#DC2626',
            letterSpacing: '0.14em',
          }}>
            5 DE 5 · PUESTA EN MARCHA COMPLETA
          </span>
        </div>

        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          fontSize: '40px',
          lineHeight: 1.1,
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          marginBottom: '16px',
        }}>
          Tu tienda está en línea
        </h2>

        <p style={{
          fontSize: '15px',
          color: '#A3A3A3',
          maxWidth: '520px',
          lineHeight: 1.6,
          marginBottom: '28px',
        }}>
          Ya puedes recibir pedidos por WhatsApp. El checklist desaparece del Centro
          y las métricas quedan activas — de acá en adelante esta pantalla es tu tablero real.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleClose}
            style={{
              height: '46px',
              padding: '0 24px',
              borderRadius: '8px',
              background: '#DC2626',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              transition: 'background 120ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#B91C1C')}
            onMouseLeave={e => (e.currentTarget.style.background = '#DC2626')}
          >
            Ir a mi Centro de Comando
          </button>
          <button
            onClick={() => navigate('/sales')}
            style={{
              height: '46px',
              padding: '0 24px',
              borderRadius: '8px',
              background: 'transparent',
              color: '#F5F5F5',
              fontSize: '15px',
              fontWeight: 500,
              border: '1px solid #242424',
              cursor: 'pointer',
              transition: 'border-color 120ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#444')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#242424')}
          >
            Compartir el link otra vez
          </button>
        </div>
      </div>

      {/* Right */}
      <div style={{
        background: '#111111',
        border: '1px solid #242424',
        borderRadius: '14px',
        padding: '24px',
      }}>
        <p style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: '11px',
          fontWeight: 700,
          color: '#6B7280',
          letterSpacing: '0.1em',
          marginBottom: '10px',
        }}>
          TU LINK PÚBLICO
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Link style={{ width: '14px', height: '14px', color: '#6B7280', flexShrink: 0 }} />
          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '14px',
            color: '#FFFFFF',
            wordBreak: 'break-all',
          }}>
            {storeUrl}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            'Tienda configurada',
            '1 producto publicado',
            'Radar IA encendido',
          ].map(line => (
            <div key={line} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#DC2626', fontSize: '14px', fontWeight: 700 }}>✓</span>
              <span style={{ fontSize: '14px', color: '#A3A3A3' }}>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
