import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FleetBrand, fleetBrandsService } from '@/lib/api-services-vehicles';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(200),
});

type FormData = z.infer<typeof schema>;

interface Props { item?: FleetBrand | null; onSave: () => void; onCancel: () => void; }

export function FleetBrandForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item ? { name: item.name } : {},
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (item) { await fleetBrandsService.update(item.id, data); toast.success('Marca atualizada!'); }
      else { await fleetBrandsService.create(data as Omit<FleetBrand, 'id'>); toast.success('Marca criada!'); }
      queryClient.invalidateQueries({ queryKey: ['fleet-brands'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2"><Label>Nome</Label><Input {...register('name')} placeholder="Ex: Volvo" />{errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}</div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (item ? 'Salvar' : 'Criar')}</Button>
      </div>
    </form>
  );
}
