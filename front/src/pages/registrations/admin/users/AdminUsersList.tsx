import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { adminUsersService, AdminUser, rolesService } from '@/lib/api-services-admin';
import { useCrud } from '@/hooks/use-crud';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Eye, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdminUserForm } from './AdminUserForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/contexts/RolesContext';

export default function AdminUsersList() {
  const { user } = useAuth();
  const { hasRole } = useRoles();
  const canManageAll = hasRole('SUPER', 'ADM');
  const { data, isLoading } = useCrud<AdminUser>('admin-users', adminUsersService);
  const { data: roles = [] } = useQuery({ queryKey: ['admin-roles'], queryFn: rolesService.getAll });
  const [editItem, setEditItem] = useState<AdminUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<AdminUser | null>(null);

  const visibleData = canManageAll
    ? data
    : data.filter((u) => String(u.id) === String(user?.id));

  const roleName = (item: AdminUser) => {
    if (item.role_names?.length) return item.role_names.join(', ');
    if (item.roles?.length) return item.roles.map((r) => r.name).join(', ');
    const ids = (item.role_ids ?? []).map(String);
    const names = roles.filter((r) => ids.includes(String(r.id))).map((r) => r.name);
    return names.length ? names.join(', ') : '-';
  };

  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'role_id', label: 'Perfil', render: (item: AdminUser) => roleName(item) },
    { key: 'status', label: 'Status', render: (item: AdminUser) => <StatusBadge status={item.status} /> },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-muted-foreground mt-1">Gerencie os usuários do sistema</p>
        </div>
        {canManageAll && (
          <Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Novo</Button>
        )}
      </div>

      <DataTable data={visibleData} columns={columns} searchKeys={['name', 'email']} searchPlaceholder="Buscar usuário..."
        actions={(item) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(item)}><Eye className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
          </div>
        )}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Novo'} Usuário</DialogTitle></DialogHeader>
          <AdminUserForm item={editItem} onSave={() => { setShowForm(false); setEditItem(null); }} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes do Usuário</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div><span className="text-sm text-muted-foreground">Nome:</span><p className="font-medium">{viewItem.name}</p></div>
              <div><span className="text-sm text-muted-foreground">Email:</span><p className="font-medium">{viewItem.email}</p></div>
              <div><span className="text-sm text-muted-foreground">Perfil:</span><p className="font-medium">{roleName(viewItem)}</p></div>
              <div><span className="text-sm text-muted-foreground">Status:</span><p><StatusBadge status={viewItem.status} /></p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
