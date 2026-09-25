import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FleetModel, fleetModelsService, fleetBrandsService } from '@/lib/api-services-vehicles';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  fleet_brand_id: z.string().min(1, 'Marca obrigatória'),
  name: z.string().trim().min(1, 'Nome obrigatório').max(200),
});

type FormData = z.infer<typeof schema>;

interface Props { item?: FleetModel | null; onSave: () => void; onCancel: () => void; }

export function FleetModelForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const { data: brands = [], isLoading: loadingBrands } = useQuery({ queryKey: ['fleet-brands', 'active-options'], queryFn: () => fleetBrandsService.getAll({ status: 'A' }) });

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item ? { fleet_brand_id: item.fleet_brand_id, name: item.name } : {},
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (item) { await fleetModelsService.update(item.id, data); toast.success('Modelo atualizado!'); }
      else { await fleetModelsService.create(data as Omit<FleetModel, 'id'>); toast.success('Modelo criado!'); }
      queryClient.invalidateQueries({ queryKey: ['fleet-models'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Marca</Label>
        {loadingBrands ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div> : (
          <Combobox options={brands.map((b) => ({ value: String(b.id), label: b.name }))} value={watch('fleet_brand_id')} onValueChange={(v) => setValue('fleet_brand_id', v, { shouldValidate: true })} placeholder="Selecione a marca" searchPlaceholder="Buscar marca..." emptyText="Nenhuma marca encontrada." />
        )}
        {errors.fleet_brand_id && <p className="text-sm text-destructive">{errors.fleet_brand_id.message}</p>}
      </div>
      <div className="space-y-2"><Label>Nome</Label><Input {...register('name')} placeholder="Ex: FH 540" />{errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}</div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (item ? 'Salvar' : 'Criar')}</Button>
      </div>
    </form>
  );
}
