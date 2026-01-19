import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, FolderKanban, Package, Truck, Users, ShoppingCart, LayoutDashboard } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Proyectos', icon: FolderKanban },
  { path: '/products', label: 'Productos', icon: Package },
  { path: '/suppliers', label: 'Proveedores', icon: Truck },
  { path: '/sellers', label: 'Vendedores', icon: Users },
  { path: '/sales', label: 'Ventas', icon: ShoppingCart },
  { path: '/dashboard', label: 'Panel', icon: LayoutDashboard },
];

export function Navbar() {
  const { profile, role, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">GRC</span>
            <span className="text-sm text-muted-foreground hidden sm:block">IMPORTACIONES</span>
          </Link>
          
          <div className="flex items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  location.pathname === path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatarUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {profile ? getInitials(profile.fullName) : '?'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-foreground leading-none mb-1">
                {profile?.fullName}
              </p>
              <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-xs h-5">
                {role === 'admin' ? '👑 Admin' : '👤 Colaborador'}
              </Badge>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
