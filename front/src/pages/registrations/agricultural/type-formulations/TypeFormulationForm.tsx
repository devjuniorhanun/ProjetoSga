import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TypeFormulation, typeFormulationsService } from '@/lib/api-services-agricultural';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  formulation: z.string().trim().min(1, 'Formulação obrigatória').max(200),
  abbreviation: z.string().trim().min(1, 'Abreviação obrigatória').max(50),
  order: z.coerce.number().min(0, 'Ordem inválida'),
  status: z.enum(['A', 'I']),
});
type FormData = z.infer<typeof schema>;
interface Props { item?: TypeFormulation | null; onSave: () => void; onCancel: () => void; }

export function TypeFormulationForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? { formulation: item.formulation, abbreviation: item.abbreviation, order: Number(item.order) || 0, status: item.status }
      : { status: 'A', order: 0, abbreviation: '' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (item) { await typeFormulationsService.update(item.id, data); toast.success('Tipo de formulação atualizado!'); }
      else { await typeFormulationsService.create(data as Omit<TypeFormulation, 'id'>); toast.success('Tipo de formulação criado!'); }
      queryClient.invalidateQueries({ queryKey: ['type-formulations'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2"><Label>Formulação</Label><Input {...register('formulation')} placeholder="Ex: SC - Suspensão Concentrada" />{errors.formulation && <p className="text-sm text-destructive">{errors.formulation.message}</p>}</div>
      <div className="space-y-2"><Label>Abreviação</Label><Input {...register('abbreviation')} placeholder="Ex: SC" />{errors.abbreviation && <p className="text-sm text-destructive">{errors.abbreviation.message}</p>}</div>
      <div className="space-y-2"><Label>Ordem</Label><Input type="number" {...register('order')} placeholder="Ex: 1" />{errors.order && <p className="text-sm text-destructive">{errors.order.message}</p>}</div>
      <div className="space-y-2"><Label>Status</Label><Select value={watch('status')} onValueChange={(v) => setValue('status', v as 'A' | 'I')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="A">Ativo</SelectItem><SelectItem value="I">Inativo</SelectItem></SelectContent></Select></div>
      <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button><Button type="submit" disabled={loading}>{loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (item ? 'Salvar' : 'Criar')}</Button></div>
    </form>
  );
}
