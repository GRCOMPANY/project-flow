import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, FolderKanban, LayoutDashboard, Package } from 'lucide-react';

export function Navbar() {
  const { profile, role, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-2xl font-bold text-foreground">
            TaskFlow
          </Link>
          
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === '/'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              Proyectos
            </Link>
            <Link
              to="/products"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === '/products'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Package className="w-4 h-4" />
              Productos
            </Link>
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === '/dashboard'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Mi Panel
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatarUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {profile ? getInitials(profile.fullName) : '?'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground leading-none mb-1">
                {profile?.fullName}
              </p>
              <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-xs h-5">
                {role === 'admin' ? '👑 Admin' : '👤 Colaborador'}
              </Badge>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
