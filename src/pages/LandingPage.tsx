import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PRODUCTS = [
  { emoji: '👜', name: 'Cartera Acolchada', public: '$89.900', wholesale: '$52.000' },
  { emoji: '🧴', name: 'Sérum Vitamina C', public: '$67.000', wholesale: '$38.000' },
  { emoji: '⌚', name: 'Reloj Minimalista', public: '$124.900', wholesale: '$74.000' },
  { emoji: '🎧', name: 'Audífonos BT Pro', public: '$98.500', wholesale: '$59.000' },
  { emoji: '👟', name: 'Tenis Boost Urban', public: '$159.000', wholesale: '$95.000' },
  { emoji: '🌿', name: 'Aceite Argán Puro', public: '$45.000', wholesale: '$26.000' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeScreen, setActiveScreen] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setActiveScreen(s => (s + 1) % 3);
        setFading(false);
      }, 300);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const goRegister = () => navigate('/auth?tab=register');
  const goLogin = () => navigate('/auth');

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#111', minHeight: '100vh' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ background: '#111', borderBottom: '1px solid #1f1f1f', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#C1272D', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '14px' }}>G</span>
            </div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>GRC AI OS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={goLogin} style={{ color: '#999', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
              Iniciar sesión
            </button>
            <button onClick={goRegister} style={{ background: '#C1272D', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              Empieza gratis
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: '#111', padding: '80px 24px 64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '64px', alignItems: 'center' }}>

          {/* Copy */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(193,39,45,0.12)', border: '1px solid rgba(193,39,45,0.3)', borderRadius: '999px', padding: '4px 14px', marginBottom: '24px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C1272D', animation: 'pulse-dot 2s infinite' }} />
              <span style={{ color: '#C1272D', fontSize: '12px', fontWeight: 600 }}>Sistema operativo para importadores</span>
            </div>
            <h1 style={{ color: 'white', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.15, marginBottom: '24px' }}>
              Sube un producto.{' '}
              <span style={{ color: '#C1272D' }}>Se crean dos tiendas solas.</span>{' '}
              Y sabes exactamente cuánto te deben.
            </h1>
            <p style={{ color: '#888', fontSize: '17px', lineHeight: 1.7, marginBottom: '36px' }}>
              GRC AI OS automatiza catálogo público, tienda mayorista y cobros inteligentes.
              Tu red de revendedores crece sola mientras el Radar IA persigue los pagos.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={goRegister} style={{ background: '#C1272D', color: 'white', border: 'none', borderRadius: '12px', padding: '14px 32px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Empieza gratis →
              </button>
              <button onClick={goLogin} style={{ background: 'none', color: '#ccc', border: '1px solid #333', borderRadius: '12px', padding: '14px 32px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Ver demo
              </button>
            </div>
          </div>

          {/* Browser Mockup */}
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>
            {/* Chrome */}
            <div style={{ background: '#222', borderBottom: '1px solid #333', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#febc2e' }} />
                <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#28c840' }} />
              </div>
              <div style={{ flex: 1, background: '#333', borderRadius: '6px', padding: '3px 10px', fontSize: '11px', color: '#666' }}>
                {activeScreen === 0 && 'app.grcaios.com/dashboard'}
                {activeScreen === 1 && 'app.grcaios.com/products'}
                {activeScreen === 2 && 'mitienda.grcaios.com'}
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    onClick={() => setActiveScreen(i)}
                    style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeScreen === i ? '#C1272D' : '#444', cursor: 'pointer', transition: 'background 0.2s' }}
                  />
                ))}
              </div>
            </div>

            {/* Screen */}
            <div style={{ height: '280px', overflow: 'hidden', opacity: fading ? 0 : 1, transition: 'opacity 0.3s ease' }}>

              {/* Screen 0 — Dashboard */}
              {activeScreen === 0 && (
                <div style={{ background: '#0f0f0f', padding: '16px', height: '100%' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                    {[
                      { label: 'Por cobrar', value: '$287K', color: '#C1272D' },
                      { label: 'Ventas mes', value: '$1.4M', color: '#22c55e' },
                      { label: 'Revendedores', value: '34', color: '#3b82f6' },
                    ].map(s => (
                      <div key={s.label} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ color: s.color, fontSize: '18px', fontWeight: 700 }}>{s.value}</div>
                        <div style={{ color: '#666', fontSize: '11px' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '12px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <span style={{ color: '#C1272D', fontSize: '11px', fontWeight: 700 }}>⚡ RADAR IA — Cobros urgentes</span>
                    </div>
                    {['María López — $45.000 — 12 días', 'Carlos Vega — $89.000 — 8 días', 'Ana Torres — $32.000 — 5 días'].map(t => (
                      <div key={t} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #222' }}>
                        <span style={{ color: '#aaa', fontSize: '11px' }}>{t}</span>
                        <div style={{ background: '#C1272D', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '4px' }}>Cobrar</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Screen 1 — Catalog */}
              {activeScreen === 1 && (
                <div style={{ background: '#0f0f0f', padding: '16px', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: '#666', fontSize: '12px' }}>6 productos activos</span>
                    <div style={{ background: '#C1272D', color: 'white', fontSize: '10px', padding: '3px 10px', borderRadius: '6px' }}>+ Agregar</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {PRODUCTS.slice(0, 4).map(p => (
                      <div key={p.name} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '24px', marginBottom: '4px' }}>{p.emoji}</div>
                        <div style={{ color: 'white', fontSize: '11px', fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                          <span style={{ color: '#22c55e', fontSize: '11px', fontWeight: 600 }}>{p.wholesale}</span>
                          <span style={{ color: '#666', fontSize: '11px' }}>{p.public}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Screen 2 — Public Store */}
              {activeScreen === 2 && (
                <div style={{ background: '#fafafa', padding: '16px', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ background: '#C1272D', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'white', fontSize: '11px', fontWeight: 800 }}>G</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>Mi Tienda GRC</span>
                    <div style={{ marginLeft: 'auto', background: '#C1272D', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '4px' }}>En vivo</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {PRODUCTS.map(p => (
                      <div key={p.name} style={{ background: 'white', border: '1px solid #eee', borderRadius: '10px', padding: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '22px', textAlign: 'center', marginBottom: '4px' }}>{p.emoji}</div>
                        <div style={{ fontSize: '10px', color: '#555', fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ color: '#C1272D', fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>{p.public}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ background: '#C1272D', padding: '40px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '24px', textAlign: 'center' }}>
          {[
            { value: '$287K', label: 'promedio por cobrar' },
            { value: '2x', label: 'tiendas por producto' },
            { value: '34+', label: 'revendedores en red' },
            { value: '100%', label: 'editable desde la app' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ color: 'white', fontSize: '32px', fontWeight: 800 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: '13px', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ background: '#0d0d0d', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ color: 'white', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, textAlign: 'center', marginBottom: '12px' }}>
            Todo en uno. Cero configuración.
          </h2>
          <p style={{ color: '#666', textAlign: 'center', marginBottom: '48px', fontSize: '16px' }}>
            Sube el producto una vez. El sistema hace el resto.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {[
              { icon: '💰', title: 'Precios duales automáticos', desc: 'Precio público y mayorista calculados automáticamente. Tu margen siempre protegido sin hacer nada.' },
              { icon: '🎯', title: 'Radar IA de cobros', desc: 'La IA detecta pagos pendientes y activa recordatorios inteligentes antes de que pierdas la plata.' },
              { icon: '🛍️', title: 'Tienda pública lista', desc: 'Tu catálogo se publica como tienda con tu marca. Sin código, sin hosting, sin costos extra.' },
              { icon: '🤝', title: 'Red de revendedores', desc: 'Cada revendedor accede a su precio mayorista. Tú ves quién vende, cuánto compró y qué te debe.' },
            ].map(f => (
              <div key={f.title} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '28px', transition: 'border-color 0.2s' }}>
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: '15px', marginBottom: '10px' }}>{f.title}</h3>
                <p style={{ color: '#666', fontSize: '13px', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 ROLES ── */}
      <section style={{ background: '#111', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ color: 'white', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, textAlign: 'center', marginBottom: '12px' }}>
            ¿Para quién es GRC AI OS?
          </h2>
          <p style={{ color: '#666', textAlign: 'center', marginBottom: '48px', fontSize: '16px' }}>
            El sistema se adapta a tu modelo de negocio.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              {
                icon: '📦',
                role: 'Importador',
                headline: 'Controla toda tu cadena.',
                desc: 'Ves costos FOB, márgenes, catálogo, revendedores y cobros en un solo panel. Nada se escapa del radar.',
                perks: ['Catálogo con precios duales', 'Radar IA de cobros automático', 'Dashboard financiero completo'],
              },
              {
                icon: '🚀',
                role: 'Revendedor',
                headline: 'Vende sin complicarte.',
                desc: 'Accedes al catálogo mayorista con tus precios. Compartes el link de tu tienda y cobras lo que es tuyo.',
                perks: ['Tu tienda lista en minutos', 'Precios mayoristas en tiempo real', 'Historial de compras y saldos'],
              },
              {
                icon: '✨',
                role: 'Emprendedor nuevo',
                headline: 'Empieza hoy, escala mañana.',
                desc: 'Registra tus primeros productos, crea tu tienda y empieza a vender sin necesitar desarrolladores.',
                perks: ['Setup en menos de 10 min', 'Tienda pública gratis', 'Soporte incluido'],
              },
            ].map(r => (
              <div key={r.role} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '20px', padding: '36px 28px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>{r.icon}</div>
                <div style={{ color: '#C1272D', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{r.role}</div>
                <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>{r.headline}</h3>
                <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px', flex: 1 }}>{r.desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {r.perks.map(p => (
                    <li key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#aaa', fontSize: '13px' }}>
                      <span style={{ color: '#C1272D', fontWeight: 700 }}>✓</span> {p}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={goRegister}
                  style={{ background: '#C1272D', color: 'white', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', width: '100%', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Empezar gratis
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section style={{ background: '#0d0d0d', padding: '80px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ color: 'white', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, textAlign: 'center', marginBottom: '12px' }}>
            Cómo funciona
          </h2>
          <p style={{ color: '#666', textAlign: 'center', marginBottom: '56px', fontSize: '16px' }}>
            De cero a operando en 4 pasos.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {[
              { n: '1', title: 'Crea tu cuenta', desc: 'Registra tu empresa en 2 minutos. Sin tarjeta de crédito, sin contratos.' },
              { n: '2', title: 'Sube tus productos', desc: 'Agrega nombre, costo y precio. El sistema calcula márgenes y crea el catálogo público y el mayorista.' },
              { n: '3', title: 'Comparte tu tienda', desc: 'Tienes una URL pública y una mayorista listas al instante. Compártelas con clientes y revendedores.' },
              { n: '4', title: 'El Radar IA trabaja solo', desc: 'Las ventas generan cobros automáticos. La IA te avisa quién debe, cuánto y cuándo actuar.' },
            ].map((s, i) => (
              <div key={s.n} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ background: '#C1272D', width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '18px' }}>
                  {s.n}
                </div>
                <div style={{ paddingTop: '8px' }}>
                  <h3 style={{ color: 'white', fontWeight: 700, fontSize: '17px', marginBottom: '6px' }}>{s.title}</h3>
                  <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ background: '#111', borderTop: '1px solid #1f1f1f', padding: '96px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ color: 'white', fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 800, marginBottom: '16px' }}>
            Deja de usar Excel para cobrar.
          </h2>
          <p style={{ color: '#777', fontSize: '17px', lineHeight: 1.7, marginBottom: '40px' }}>
            Únete a importadores y revendedores que ya automatizan su operación con GRC AI OS.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={goRegister} style={{ background: '#C1272D', color: 'white', border: 'none', borderRadius: '14px', padding: '16px 40px', fontSize: '17px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              Empieza gratis →
            </button>
            <button onClick={goLogin} style={{ background: 'none', color: '#aaa', border: '1px solid #333', borderRadius: '14px', padding: '16px 40px', fontSize: '17px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              Iniciar sesión
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0a0a0a', borderTop: '1px solid #1a1a1a', padding: '28px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#C1272D', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '11px' }}>G</span>
            </div>
            <span style={{ color: '#555', fontWeight: 700, fontSize: '14px' }}>GRC AI OS</span>
          </div>
          <p style={{ color: '#444', fontSize: '13px', margin: 0 }}>
            © {new Date().getFullYear()} GRC Company. Todos los derechos reservados.
          </p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <button onClick={goLogin} style={{ color: '#444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
              Iniciar sesión
            </button>
            <button onClick={goRegister} style={{ color: '#444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
              Registrarse
            </button>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
