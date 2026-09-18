import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TypePayAccount, typePayAccountsService } from '@/lib/api-services-financial-entries';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  abbreviation: z.string().min(1, 'Abreviação obrigatória'),
  status: z.enum(['A', 'I']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: TypePayAccount | null;
  onSave: () => void;
  onCancel: () => void;
}

export function TypePayAccountForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { handleSubmit, setValue, watch, register, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? { name: item.name, abbreviation: item.abbreviation, status: item.status }
      : { status: 'A' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (item) {
        await typePayAccountsService.update(item.id, data);
        toast.success('Tipo de Conta atualizado!');
      } else {
        await typePayAccountsService.create(data as Omit<TypePayAccount, 'id'>);
        toast.success('Tipo de Conta criado!');
      }
      queryClient.invalidateQueries({ queryKey: ['type-pay-accounts'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input {...register('name')} placeholder="Nome do tipo de conta" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Abreviação</Label>
        <Input {...register('abbreviation')} placeholder="Abreviação" />
        {errors.abbreviation && <p className="text-sm text-destructive">{errors.abbreviation.message}</p>}
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
        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : (item ? 'Salvar' : 'Criar')}</Button>
      </div>
    </form>
  );
}
