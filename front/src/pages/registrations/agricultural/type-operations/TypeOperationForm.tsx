import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { TypeOperation, typeOperationsService, operationDefensivesService } from '@/lib/api-services-agricultural';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  operation_defensive_id: z.string().min(1, 'Operação obrigatória'),
  name: z.string().trim().min(1, 'Nome obrigatório').max(200),
  status: z.enum(['A', 'I']),
});
type FormData = z.infer<typeof schema>;
interface Props { item?: TypeOperation | null; onSave: () => void; onCancel: () => void; }

export function TypeOperationForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const { data: operations = [] } = useQuery({
    queryKey: ['operation-defensives'],
    queryFn: () => operationDefensivesService.getAll({ status: 'A' }),
  });

  const operationOptions = useMemo(
    () => operations
      .filter((o) => o.status === 'A' || String(o.id) === String(item?.operation_defensive_id))
      .map((o) => ({ value: String(o.id), label: o.name })),
    [operations, item],
  );

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? { operation_defensive_id: String(item.operation_defensive_id ?? ''), name: item.name, status: item.status }
      : { operation_defensive_id: '', status: 'A' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (item) { await typeOperationsService.update(item.id, data); toast.success('Tipo de operação atualizado!'); }
      else { await typeOperationsService.create(data as Omit<TypeOperation, 'id'>); toast.success('Tipo de operação criado!'); }
      queryClient.invalidateQueries({ queryKey: ['type-operations'] });
      onSave();
    } catch (error) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Operação de Defensivo</Label>
        <Combobox
          options={operationOptions}
          value={watch('operation_defensive_id')}
          onValueChange={(v) => setValue('operation_defensive_id', v, { shouldValidate: true })}
          placeholder="Selecione a operação"
          searchPlaceholder="Buscar operação..."
        />
        {errors.operation_defensive_id && <p className="text-sm text-destructive">{errors.operation_defensive_id.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input {...register('name')} placeholder="Ex: Plantio" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={watch('status')} onValueChange={(v) => setValue('status', v as 'A' | 'I')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="A">Ativo</SelectItem><SelectItem value="I">Inativo</SelectItem></SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (item ? 'Salvar' : 'Criar')}</Button>
      </div>
    </form>
  );
}
