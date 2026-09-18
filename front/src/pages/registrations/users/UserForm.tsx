import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, usersService } from '@/lib/api-services';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { applyApiErrors } from '@/lib/form-errors';

const createSchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(100),
  role: z.enum(['admin', 'user']),
});

const editSchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  password: z.string().max(100).optional().or(z.literal('')),
  role: z.enum(['admin', 'user']),
});

interface Props {
  item?: User | null;
  onSave: () => void;
  onCancel: () => void;
}

export function UserForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const schema = item ? editSchema : createSchema;
  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item ? { name: item.name, email: item.email, role: item.role, password: '' } : { role: 'user' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload = { ...data };
      if (item && !payload.password) {
        delete (payload as any).password;
      }
      if (item) {
        await usersService.update(item.id, payload);
        toast.success('Usuário atualizado!');
      } else {
        await usersService.create(payload as Omit<User, 'id'>);
        toast.success('Usuário criado!');
      }
      queryClient.invalidateQueries({ queryKey: ['users'] });
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
        <Input type="password" {...register('password')} placeholder="••••••••" />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Perfil</Label>
        <Select value={watch('role')} onValueChange={(v) => setValue('role', v as 'admin' | 'user')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="user">Usuário</SelectItem>
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
