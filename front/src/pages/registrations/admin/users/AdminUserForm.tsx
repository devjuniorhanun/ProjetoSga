import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/PasswordInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AdminUser, adminUsersService, rolesService } from '@/lib/api-services-admin';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { applyApiErrors } from '@/lib/form-errors';

const baseSchema = {
  name: z.string().trim().min(1, 'Nome obrigatório').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  role_ids: z.array(z.string()).min(1, 'Selecione ao menos um perfil'),
  status: z.enum(['A', 'I']),
};

const createSchema = z.object({ ...baseSchema, password: z.string().min(6, 'Mínimo 6 caracteres').max(100) });
const editSchema = z.object({ ...baseSchema, password: z.string().max(100).optional().or(z.literal('')) });

interface Props {
  item?: AdminUser | null;
  onSave: () => void;
  onCancel: () => void;
}

export function AdminUserForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const isOwnRecord = !!item && String(item.id) === String(currentUser?.id);
  const schema = item ? editSchema : createSchema;
  type FormData = z.infer<typeof createSchema>;

  const { data: roles = [] } = useQuery({ queryKey: ['admin-roles'], queryFn: rolesService.getAll });
  const abbr = (r: { abbreviation?: string; name: string }) => (r.abbreviation || r.name || '').trim().toUpperCase();
  const isSuperRole = (r: { abbreviation?: string; name: string }) => abbr(r) === 'SUPER';
  const isUserRole = (r: { abbreviation?: string; name: string }) =>
    ['USUARIO', 'USUÁRIO', 'USER', 'USU'].includes(abbr(r)) ||
    ['USUARIO', 'USUÁRIO', 'USER'].includes((r.name || '').trim().toUpperCase());

  const activeRoles = roles.filter((r) => r.status === 'A');
  const defaultUserRoleId = activeRoles.find(isUserRole)?.id;
  const itemRoleIds = (item?.role_ids ?? item?.roles?.map((r) => r.id) ?? []).map(String);
  // Perfil SUPER fica oculto e não pode ser alterado
  const hiddenRoleIds = roles.filter(isSuperRole).map((r) => String(r.id));
  const visibleRoles = isOwnRecord
    ? activeRoles.filter((r) => itemRoleIds.includes(String(r.id)) && !isSuperRole(r))
    : activeRoles.filter((r) => !isSuperRole(r));
  const rolesLocked = isOwnRecord;

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema as any),
    defaultValues: item
      ? {
          name: item.name,
          email: item.email,
          role_ids: (item.role_ids ?? item.roles?.map((r) => r.id) ?? []).map(String),
          status: item.status,
          password: '',
        }
      : { status: 'A', role_ids: [], password: '' },
  });

  const selectedRoleIds = (watch('role_ids') ?? []) as string[];

  // No cadastro novo, o perfil "Usuário" sempre vem marcado
  useEffect(() => {
    if (!item && defaultUserRoleId && !selectedRoleIds.includes(String(defaultUserRoleId))) {
      setValue('role_ids', [...selectedRoleIds, String(defaultUserRoleId)], { shouldValidate: true });
    }
  }, [item, defaultUserRoleId, selectedRoleIds, setValue]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload: any = { ...data };
      // preserva perfis ocultos (SUPER) já vinculados ao usuário
      const keptHidden = itemRoleIds.filter((id) => hiddenRoleIds.includes(id));
      payload.role_ids = Array.from(new Set([...(data.role_ids ?? []), ...keptHidden]));
      if (rolesLocked) payload.role_ids = itemRoleIds;
      if (item && !payload.password) delete payload.password;
      if (item) {
        await adminUsersService.update(item.id, payload);
        toast.success('Usuário atualizado!');
      } else {
        await adminUsersService.create(payload);
        toast.success('Usuário criado!');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar usuário.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input {...register('name')} placeholder="Nome completo" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" {...register('email')} placeholder="email@exemplo.com" />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Senha{item ? ' (deixe em branco para manter)' : ''}</Label>
        <PasswordInput {...register('password')} placeholder="••••••••" />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Perfis</Label>
        <div className="grid grid-cols-2 gap-2 rounded-md border p-3 max-h-48 overflow-y-auto">
          {visibleRoles.length === 0 && <p className="text-sm text-muted-foreground">Nenhum perfil disponível</p>}
          {visibleRoles.map((role) => {
            const id = String(role.id);
            const selected = selectedRoleIds;
            const locked = rolesLocked || (!item && isUserRole(role));
            return (
              <label key={id} className={`flex items-center gap-2 text-sm ${locked ? 'opacity-70' : 'cursor-pointer'}`}>
                <Checkbox
                  checked={selected.includes(id)}
                  disabled={locked}
                  onCheckedChange={(checked) =>
                    setValue(
                      'role_ids',
                      checked ? [...selected, id] : selected.filter((r) => r !== id),
                      { shouldValidate: true }
                    )
                  }
                />
                {role.name}
              </label>
            );
          })}
        </div>
        {errors.role_ids && <p className="text-sm text-destructive">{errors.role_ids.message as string}</p>}
      </div>


      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={watch('status')} onValueChange={(v) => setValue('status', v as 'A' | 'I')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="A">Ativo</SelectItem>
            <SelectItem value="I">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (item ? 'Salvar' : 'Criar')}
        </Button>
      </div>
    </form>
  );
}
