import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LogOut,
  Package,
  Users,
  ShoppingCart,
  LayoutDashboard,
  Image,
  Zap,
  ListTodo,
  Store,
  Menu,
  X,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Centro', icon: LayoutDashboard },
  { path: '/products', label: 'Productos', icon: Package },
  { path: '/creatives', label: 'Creativos', icon: Image },
  { path: '/sales', label: 'Ventas', icon: ShoppingCart },
  { path: '/tasks', label: 'Tareas', icon: ListTodo },
  { path: '/sellers', label: 'Vendedores', icon: Users },
  { path: '/tienda-config', label: 'Tienda', icon: Store, adminOnly: true },
];

export function CommandCenterNav() {
  const { profile, role, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { newOrderCount, markAsSeen } = useRealtimeOrders();

  useEffect(() => {
    if (location.pathname === '/sales') markAsSeen();
  }, [location.pathname, markAsSeen]);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      <nav style={{ background: '#111111', borderBottom: '1px solid #1f1f1f', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

            {/* Logo */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#C1272D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap style={{ width: '16px', height: '16px', color: 'white' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '17px', fontWeight: 700, color: 'white', letterSpacing: '-0.3px' }}>GRC</span>
                <span style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>AI OS</span>
              </div>
            </Link>

            {/* Desktop nav links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', overflow: 'hidden' }} className="hidden md:flex">
              {visibleItems.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                const showBadge = path === '/sales' && newOrderCount > 0;
                return (
                  <Link
                    key={path}
                    to={path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#C1272D' : '#aaa',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.15s, background 0.15s',
                      background: isActive ? 'rgba(193,39,45,0.08)' : 'transparent',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = '#C1272D';
                        (e.currentTarget as HTMLElement).style.background = 'rgba(193,39,45,0.06)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = '#aaa';
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }
                    }}
                  >
                    <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Icon className="w-4 h-4" />
                      {showBadge && (
                        <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#C1272D', color: 'white', borderRadius: '999px', fontSize: '9px', fontWeight: 700, minWidth: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '1.5px solid #111' }}>
                          {newOrderCount > 9 ? '9+' : newOrderCount}
                        </span>
                      )}
                    </span>
                    <span>{label}</span>
                    {isActive && (
                      <span style={{ position: 'absolute', bottom: 0, left: '14px', right: '14px', height: '2px', background: '#C1272D', borderRadius: '2px' }} />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>

              {/* User info + logout — desktop only */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="hidden md:flex">
                <Avatar style={{ height: '34px', width: '34px' }}>
                  <AvatarImage src={profile?.avatarUrl} />
                  <AvatarFallback style={{ background: '#C1272D', color: 'white', fontSize: '12px', fontWeight: 700 }}>
                    {profile ? getInitials(profile.fullName) : '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden xl:block">
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'white', lineHeight: 1, marginBottom: '4px' }}>
                    {profile?.fullName?.split(' ')[0]}
                  </p>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: role === 'admin' ? '#C1272D' : '#888', background: role === 'admin' ? 'rgba(193,39,45,0.12)' : 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                    {role === 'admin' ? '👑 Admin' : '👤 Colaborador'}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  title="Cerrar sesión"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#C1272D')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#666')}
                >
                  <LogOut style={{ width: '17px', height: '17px' }} />
                </button>
              </div>

              {/* Hamburger — mobile only */}
              <button
                onClick={() => setMobileOpen(o => !o)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                className="md:hidden"
              >
                <Menu style={{ width: '24px', height: '24px' }} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile fullscreen overlay */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            position: 'fixed',
            inset: 0,
            background: '#111111',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Top bar: logo + close */}
          <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid #1f1f1f', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#C1272D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap style={{ width: '16px', height: '16px', color: 'white' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '17px', fontWeight: 700, color: 'white', letterSpacing: '-0.3px' }}>GRC</span>
                <span style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>AI OS</span>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X style={{ width: '24px', height: '24px' }} />
            </button>
          </div>

          {/* Nav links */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {visibleItems.map(({ path, label, icon: Icon }, idx) => {
              const isActive = location.pathname === path;
              const showBadge = path === '/sales' && newOrderCount > 0;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    height: '48px',
                    padding: '0 20px',
                    textDecoration: 'none',
                    color: isActive ? '#C1272D' : '#ccc',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '16px',
                    borderLeft: isActive ? '3px solid #C1272D' : '3px solid transparent',
                    background: isActive ? 'rgba(193,39,45,0.06)' : 'transparent',
                    borderBottom: idx < visibleItems.length - 1 ? '1px solid #1a1a1a' : 'none',
                  }}
                >
                  <span style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <Icon className="w-5 h-5" />
                    {showBadge && (
                      <span style={{ position: 'absolute', top: '-5px', right: '-7px', background: '#C1272D', color: 'white', borderRadius: '999px', fontSize: '9px', fontWeight: 700, minWidth: '15px', height: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '1.5px solid #111' }}>
                        {newOrderCount > 9 ? '9+' : newOrderCount}
                      </span>
                    )}
                  </span>
                  {label}
                </Link>
              );
            })}
          </div>

          {/* User + logout at bottom */}
          <div style={{ borderTop: '1px solid #1f1f1f', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar style={{ height: '38px', width: '38px' }}>
                <AvatarImage src={profile?.avatarUrl} />
                <AvatarFallback style={{ background: '#C1272D', color: 'white', fontSize: '13px', fontWeight: 700 }}>
                  {profile ? getInitials(profile.fullName) : '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'white', margin: 0, lineHeight: 1.2 }}>{profile?.fullName}</p>
                <span style={{ fontSize: '11px', color: role === 'admin' ? '#C1272D' : '#888' }}>
                  {role === 'admin' ? '👑 Admin' : '👤 Colaborador'}
                </span>
              </div>
            </div>
            <button
              onClick={signOut}
              style={{ background: 'none', border: '1px solid #2a2a2a', cursor: 'pointer', color: '#888', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <LogOut style={{ width: '14px', height: '14px' }} />
              Salir
            </button>
          </div>
        </div>
      )}
    </>
  );
}
