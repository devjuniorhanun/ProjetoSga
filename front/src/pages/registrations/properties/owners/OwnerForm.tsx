import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Owner, ownersService } from '@/lib/api-services';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  corporate_name: z.string().trim().min(1, 'Razão social obrigatória').max(200),
  fantasy_name: z.string().trim().min(1, 'Nome fantasia obrigatório').max(200),
  payment_type: z.enum(['D', 'T'], { required_error: 'Tipo de pagamento obrigatório' }),
  status: z.enum(['A', 'I']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: Owner | null;
  onSave: () => void;
  onCancel: () => void;
}

export function OwnerForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? { corporate_name: item.corporate_name, fantasy_name: item.fantasy_name, payment_type: item.payment_type as 'D' | 'T', status: item.status }
      : { status: 'A' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (item) {
        await ownersService.update(item.id, data);
        toast.success('Proprietário atualizado!');
      } else {
        await ownersService.create(data as Omit<Owner, 'id'>);
        toast.success('Proprietário criado!');
      }
      queryClient.invalidateQueries({ queryKey: ['owners'] });
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
        <Label>Razão Social</Label>
        <Input {...register('corporate_name')} placeholder="Ex: Fazenda São João Ltda" />
        {errors.corporate_name && <p className="text-sm text-destructive">{errors.corporate_name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Nome Fantasia</Label>
        <Input {...register('fantasy_name')} placeholder="Ex: Fazenda São João" />
        {errors.fantasy_name && <p className="text-sm text-destructive">{errors.fantasy_name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Tipo de Pagamento</Label>
        <Select value={watch('payment_type')} onValueChange={(v) => setValue('payment_type', v as 'D' | 'T')}>
          <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="D">Depósito</SelectItem>
            <SelectItem value="T">Transferência</SelectItem>
          </SelectContent>
        </Select>
        {errors.payment_type && <p className="text-sm text-destructive">{errors.payment_type.message}</p>}
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
