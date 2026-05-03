import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2, User, Mail, Lock, Phone, CheckCircle, Loader2 } from 'lucide-react';

type Field = 'empresa' | 'nombre' | 'email' | 'password' | 'whatsapp';

const FIELDS: { key: Field; label: string; placeholder: string; type: string; icon: React.ReactNode }[] = [
  { key: 'empresa',   label: 'Nombre de la empresa', placeholder: 'Ej: Mi Empresa S.A.S.',  type: 'text',     icon: <Building2 className="w-4 h-4" /> },
  { key: 'nombre',    label: 'Tu nombre completo',    placeholder: 'Juan Pérez',              type: 'text',     icon: <User      className="w-4 h-4" /> },
  { key: 'email',     label: 'Correo electrónico',    placeholder: 'tu@empresa.com',          type: 'email',    icon: <Mail      className="w-4 h-4" /> },
  { key: 'password',  label: 'Contraseña',            placeholder: 'Mínimo 6 caracteres',     type: 'password', icon: <Lock      className="w-4 h-4" /> },
  { key: 'whatsapp',  label: 'WhatsApp (con código)', placeholder: '573001234567',            type: 'tel',      icon: <Phone     className="w-4 h-4" /> },
];

export default function Registro() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [form, setForm] = useState<Record<Field, string>>({
    empresa: '', nombre: '', email: '', password: '', whatsapp: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate('/');
  }, [user, authLoading, navigate]);

  const set = (key: Field) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { empresa, nombre, email, password, whatsapp } = form;
    if (!empresa.trim() || !nombre.trim() || !email.trim() || !password || !whatsapp.trim()) {
      toast.error('Completa todos los campos');
      return;
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener mínimo 6 caracteres');
      return;
    }

    setSubmitting(true);

    // 1 — Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: nombre.trim(), role: 'admin' },
      },
    });

    if (error) {
      toast.error(
        error.message.includes('already registered')
          ? 'Este email ya está registrado. ¿Quieres iniciar sesión?'
          : error.message
      );
      setSubmitting(false);
      return;
    }

    // 2 — Sin sesión = confirmación de email pendiente
    if (!data.session) {
      setPendingConfirm(true);
      setSubmitting(false);
      return;
    }

    // 3 — Crear empresa vía RPC (SECURITY DEFINER)
    const { error: rpcError } = await (supabase as any).rpc('register_company', {
      p_user_id:   data.user!.id,
      p_name:      empresa.trim(),
      p_wa_number: whatsapp.trim(),
    });

    if (rpcError) {
      toast.error('Tu cuenta fue creada pero hubo un error al crear la empresa. Contacta soporte.');
      setSubmitting(false);
      return;
    }

    toast.success(`¡Bienvenido! La empresa "${empresa.trim()}" fue creada.`);
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (pendingConfirm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Confirma tu email</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Te enviamos un enlace de confirmación a <strong>{form.email}</strong>.
              Cuando confirmes, inicia sesión y tu empresa quedará lista.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
            Ir a iniciar sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Building2 className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Crea tu empresa</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Empieza a gestionar tus ventas y operaciones
          </p>
        </div>

        {/* Form */}
        <div className="sketch-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {FIELDS.map(({ key, label, placeholder, type, icon }) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key} className="flex items-center gap-1.5 text-sm">
                  {icon} {label}
                </Label>
                <Input
                  id={key}
                  type={type}
                  value={form[key]}
                  onChange={set(key)}
                  placeholder={placeholder}
                  className="sketch-border"
                  required
                  autoComplete={key === 'password' ? 'new-password' : undefined}
                />
              </div>
            ))}

            <Button type="submit" className="w-full mt-2" disabled={submitting}>
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creando empresa...</>
                : 'Crear empresa y comenzar'
              }
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/auth" className="text-primary hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
