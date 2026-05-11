import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Role } from '@/types';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');

const LEFT_FEATURES = [
  'Catálogo público y mayorista generados automáticamente',
  'Radar IA detecta y persigue cobros pendientes',
  'Red de revendedores con precios duales en tiempo real',
  'Dashboard financiero con márgenes y cobros en vivo',
  '100% editable desde la app — cero desarrollo',
];

const LEFT_STATS = [
  { value: '$287K', label: 'Cobros activos promedio' },
  { value: '2x', label: 'Tiendas por producto' },
  { value: '34+', label: 'Revendedores en red' },
];

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, signIn, signUp } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(
    searchParams.get('tab') === 'register' ? 'register' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const validateInputs = (isSignUp: boolean) => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (isSignUp && !fullName.trim()) {
        toast.error('El nombre es requerido');
        return false;
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs(false)) return;
    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    setIsSubmitting(false);
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Credenciales inválidas. Verifica tu email y contraseña.');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Por favor confirma tu email antes de iniciar sesión.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('¡Bienvenido de vuelta!');
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs(true)) return;
    setIsSubmitting(true);
    const { error } = await signUp(email, password, fullName, role);
    setIsSubmitting(false);
    if (error) {
      if (error.message.includes('User already registered')) {
        toast.error('Este email ya está registrado. Intenta iniciar sesión.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('¡Cuenta creada! Revisa tu email para confirmar.');
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#0f0f0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ color: '#555' }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── LEFT PANEL ── */}
      <div style={{ background: '#0f0f0f', borderRight: '1px solid #1f1f1f', width: '50%', minHeight: '100vh', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} className="hidden md:flex">

        {/* Logo */}
        <button
          onClick={() => navigate('/landing')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div style={{ background: '#C1272D', width: '34px', height: '34px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '15px' }}>G</span>
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '19px', fontFamily: "'DM Sans', sans-serif" }}>GRC AI OS</span>
        </button>

        {/* Main content */}
        <div>
          <h2 style={{ color: 'white', fontSize: 'clamp(22px, 2.5vw, 32px)', fontWeight: 800, lineHeight: 1.25, marginBottom: '32px' }}>
            Tu operación de importación,{' '}
            <span style={{ color: '#C1272D' }}>completamente automatizada.</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>
            {LEFT_FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: '#C1272D', fontWeight: 700, flexShrink: 0, marginTop: '2px' }}>✓</span>
                <span style={{ color: '#888', fontSize: '14px', lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '20px' }}>
            <p style={{ color: '#aaa', fontSize: '14px', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '12px' }}>
              "Antes tardaba 2 horas cobrando por WhatsApp. Ahora el Radar lo hace solo y recibí $340K en una semana."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#C1272D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>M</div>
              <div>
                <div style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>María González</div>
                <div style={{ color: '#555', fontSize: '12px' }}>Importadora — Bogotá</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {LEFT_STATS.map(s => (
            <div key={s.label}>
              <div style={{ color: '#C1272D', fontSize: '24px', fontWeight: 800 }}>{s.value}</div>
              <div style={{ color: '#555', fontSize: '11px', marginTop: '4px', lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="px-5 py-10 sm:px-8 md:px-10">

        {/* Mobile logo */}
        <button
          onClick={() => navigate('/landing')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '32px' }}
          className="md:hidden"
        >
          <div style={{ background: '#C1272D', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '14px' }}>G</span>
          </div>
          <span style={{ color: '#111', fontWeight: 700, fontSize: '18px', fontFamily: "'DM Sans', sans-serif" }}>GRC AI OS</span>
        </button>

        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Heading */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ color: '#111', fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>
              {activeTab === 'login' ? 'Bienvenido de vuelta' : 'Crea tu empresa'}
            </h1>
            <p style={{ color: '#999', fontSize: '14px' }}>
              {activeTab === 'login'
                ? 'Inicia sesión para acceder a tu panel'
                : 'Configura tu cuenta en 2 minutos, sin tarjeta'}
            </p>
          </div>

          {/* Tabs */}
          <div style={{ background: '#f3f4f6', borderRadius: '12px', padding: '4px', display: 'flex', marginBottom: '28px' }}>
            {(['login', 'register'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  background: activeTab === tab ? 'white' : 'transparent',
                  color: activeTab === tab ? '#111' : '#888',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '10px 16px',
                  minHeight: '44px',
                  fontSize: '15px',
                  fontWeight: activeTab === tab ? 600 : 400,
                  cursor: 'pointer',
                  boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {tab === 'login' ? 'Iniciar sesión' : 'Crear empresa'}
              </button>
            ))}
          </div>

          {/* ── LOGIN FORM ── */}
          {activeTab === 'login' && (
            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <Label htmlFor="login-email" style={{ color: '#374151', fontWeight: 500, fontSize: '13px' }}>
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  style={{ marginTop: '6px', borderColor: '#e5e7eb', fontSize: '16px' }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="login-password" style={{ color: '#374151', fontWeight: 500, fontSize: '13px' }}>
                  Contraseña
                </Label>
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ borderColor: '#e5e7eb', paddingRight: '40px', fontSize: '16px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ background: isSubmitting ? '#ccc' : '#C1272D', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', minHeight: '48px', fontSize: '16px', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s', fontFamily: "'DM Sans', sans-serif" }}
              >
                {isSubmitting ? 'Ingresando...' : 'Ingresar'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#999', margin: 0 }}>
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  style={{ color: '#C1272D', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Crear empresa gratis
                </button>
              </p>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {activeTab === 'register' && (
            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <Label htmlFor="register-name" style={{ color: '#374151', fontWeight: 500, fontSize: '13px' }}>
                  Nombre completo
                </Label>
                <Input
                  id="register-name"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Juan Pérez"
                  style={{ marginTop: '6px', borderColor: '#e5e7eb', fontSize: '16px' }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="register-email" style={{ color: '#374151', fontWeight: 500, fontSize: '13px' }}>
                  Email de empresa
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  style={{ marginTop: '6px', borderColor: '#e5e7eb', fontSize: '16px' }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="register-password" style={{ color: '#374151', fontWeight: 500, fontSize: '13px' }}>
                  Contraseña
                </Label>
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    style={{ borderColor: '#e5e7eb', paddingRight: '40px', fontSize: '16px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div>
                <Label style={{ color: '#374151', fontWeight: 500, fontSize: '13px' }}>Rol</Label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                  {[
                    { value: 'admin' as Role, label: '👑 Administrador', desc: 'Control total' },
                    { value: 'colaborador' as Role, label: '👤 Colaborador', desc: 'Acceso básico' },
                  ].map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      style={{
                        border: role === r.value ? '2px solid #C1272D' : '2px solid #e5e7eb',
                        background: role === r.value ? 'rgba(193,39,45,0.04)' : 'white',
                        borderRadius: '10px',
                        padding: '12px',
                        minHeight: '52px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{r.label}</div>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ background: isSubmitting ? '#ccc' : '#C1272D', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', minHeight: '48px', fontSize: '16px', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s', fontFamily: "'DM Sans', sans-serif" }}
              >
                {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta gratis'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#999', margin: 0 }}>
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  style={{ color: '#C1272D', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Iniciar sesión
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
