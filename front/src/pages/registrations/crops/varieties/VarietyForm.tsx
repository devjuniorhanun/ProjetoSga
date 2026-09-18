import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VarietyCulture, Culture, varietiesService } from '@/lib/api-services';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(100),
  culture_id: z.string().min(1, 'Cultura obrigatória'),
  technology: z.string().trim().min(1, 'Tecnologia obrigatória').max(100),
  cycle: z.string().trim().min(1, 'Ciclo obrigatório').max(50),
  flowering_days: z.coerce.number().min(0, 'Valor inválido').optional(),
  status: z.enum(['A', 'I']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: VarietyCulture | null;
  cultures: Culture[];
  onSave: () => void;
  onCancel: () => void;
}

export function VarietyForm({ item, cultures, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item ? {
      name: item.name,
      culture_id: item.culture_id,
      technology: item.technology,
      cycle: item.cycle,
      flowering_days: item.flowering_days ?? undefined,
      status: item.status,
    } : { status: 'A' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (item) {
        await varietiesService.update(item.id, data);
        toast.success('Variedade atualizada!');
      } else {
        await varietiesService.create(data as Omit<VarietyCulture, 'id'>);
        toast.success('Variedade criada!');
      }
      queryClient.invalidateQueries({ queryKey: ['varieties'] });
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
        <Label>Cultura</Label>
        <Select value={watch('culture_id')} onValueChange={(v) => setValue('culture_id', v)}>
          <SelectTrigger><SelectValue placeholder="Selecione a cultura" /></SelectTrigger>
          <SelectContent>
            {cultures.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.culture_id && <p className="text-sm text-destructive">{errors.culture_id.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input {...register('name')} placeholder="Ex: TMG 2381" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tecnologia</Label>
          <Input {...register('technology')} placeholder="Ex: IPRO" />
          {errors.technology && <p className="text-sm text-destructive">{errors.technology.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Ciclo</Label>
          <Input {...register('cycle')} placeholder="Ex: Precoce" />
          {errors.cycle && <p className="text-sm text-destructive">{errors.cycle.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Dias de Florescimento</Label>
          <Input type="number" {...register('flowering_days', { valueAsNumber: true })} placeholder="Ex: 45" />
          {errors.flowering_days && <p className="text-sm text-destructive">{errors.flowering_days.message}</p>}
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
