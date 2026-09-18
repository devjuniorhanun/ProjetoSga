import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminUserForm } from '@/pages/registrations/admin/users/AdminUserForm';
import { adminUsersService, AdminUser } from '@/lib/api-services-admin';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', 'me', user?.id],
    queryFn: async () => {
      const all = await adminUsersService.getAll();
      return (all.find((u) => String(u.id) === String(user?.id)) ?? null) as AdminUser | null;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">Edite seus dados de acesso</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          {data ? (
            <AdminUserForm
              item={data}
              onSave={() => {
                refetch();
                toast.success('Perfil atualizado!');
              }}
              onCancel={() => refetch()}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Cadastro não encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
