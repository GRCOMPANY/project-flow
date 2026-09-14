import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';
import { useCompany } from '@/hooks/useCompany';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function UserSelect({ value, onValueChange, placeholder = 'Seleccionar usuario' }: UserSelectProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { companyId, loading: companyLoading } = useCompany();

  useEffect(() => {
    if (companyLoading) return;
    if (!companyId) { setUsers([]); setLoading(false); return; }

    const fetchUsers = async () => {
      setLoading(true);

      // Solo los miembros de la empresa actual. profiles no tiene company_id,
      // así que la pertenencia se resuelve vía company_users.
      const { data: members } = await supabase
        .from('company_users')
        .select('user_id')
        .eq('company_id', companyId);

      const memberIds = (members ?? []).map((m) => m.user_id);
      if (memberIds.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', memberIds)
        .order('full_name');

      if (!error && data) {
        setUsers(
          data.map((u) => ({
            id: u.id,
            fullName: u.full_name,
            email: u.email,
            avatarUrl: u.avatar_url || undefined,
            createdAt: u.created_at,
          }))
        );
      }
      setLoading(false);
    };

    fetchUsers();
  }, [companyId, companyLoading]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className="sketch-border">
          <SelectValue placeholder="Cargando usuarios..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value || ''} onValueChange={onValueChange}>
      <SelectTrigger className="sketch-border">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Sin asignar</SelectItem>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <span>{user.fullName}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
