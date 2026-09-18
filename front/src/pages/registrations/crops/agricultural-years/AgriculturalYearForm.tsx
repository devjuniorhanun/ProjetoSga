import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AgriculturalYear, agriculturalYearsService } from '@/lib/api-services';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(100),
  opening_date: z.string().min(1, 'Data obrigatória'),
  closing_date: z.string().min(1, 'Data obrigatória'),
  status: z.enum(['A', 'I']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: AgriculturalYear | null;
  onSave: () => void;
  onCancel: () => void;
}

export function AgriculturalYearForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item ? {
      name: item.name,
      opening_date: item.opening_date,
      closing_date: item.closing_date,
      status: item.status,
    } : { status: 'A' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (item) {
        await agriculturalYearsService.update(item.id, data);
        toast.success('Registro atualizado!');
      } else {
        await agriculturalYearsService.create(data as Omit<AgriculturalYear, 'id'>);
        toast.success('Registro criado!');
      }
      queryClient.invalidateQueries({ queryKey: ['agricultural-years'] });
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
        <Input {...register('name')} placeholder="Ex: Ano Agrícola 2024/2025" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data Abertura</Label>
          <Input type="date" {...register('opening_date')} />
          {errors.opening_date && <p className="text-sm text-destructive">{errors.opening_date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Data Fechamento</Label>
          <Input type="date" {...register('closing_date')} />
          {errors.closing_date && <p className="text-sm text-destructive">{errors.closing_date.message}</p>}
        </div>
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
