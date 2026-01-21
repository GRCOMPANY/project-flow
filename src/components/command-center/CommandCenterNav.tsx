import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  Package, 
  Truck, 
  Users, 
  ShoppingCart, 
  LayoutDashboard,
  Image,
  Sparkles,
  Settings,
  Zap
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Centro de Control', icon: LayoutDashboard },
  { path: '/products', label: 'Productos', icon: Package },
  { path: '/creatives', label: 'Creativos', icon: Image },
  { path: '/sales', label: 'Ventas', icon: ShoppingCart },
  { path: '/suppliers', label: 'Proveedores', icon: Truck, adminOnly: true },
  { path: '/sellers', label: 'Vendedores', icon: Users },
  { path: '/ai', label: 'IA', icon: Sparkles, adminOnly: true },
];

export function CommandCenterNav() {
  const { profile, role, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

  return (
    <nav className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg grc-gradient flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-foreground">GRC</span>
              <span className="text-xs text-muted-foreground ml-1">AI OS</span>
            </div>
          </Link>
          
          {/* Navigation */}
          <div className="flex items-center gap-0.5 overflow-x-auto hide-scrollbar mx-4">
            {visibleItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm 
                    whitespace-nowrap transition-all duration-200
                    ${isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* User */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 ring-2 ring-border">
                <AvatarImage src={profile?.avatarUrl} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                  {profile ? getInitials(profile.fullName) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden xl:block">
                <p className="text-sm font-medium text-foreground leading-none mb-0.5">
                  {profile?.fullName?.split(' ')[0]}
                </p>
                <Badge 
                  variant={isAdmin ? 'default' : 'secondary'} 
                  className="text-[10px] h-4 px-1.5"
                >
                  {role === 'admin' ? '👑 Admin' : '👤 Colaborador'}
                </Badge>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={signOut} 
              className="text-muted-foreground hover:text-foreground h-8 w-8"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
