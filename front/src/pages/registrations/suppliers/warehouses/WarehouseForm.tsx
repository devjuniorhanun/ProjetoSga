import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Warehouse, warehousesService, suppliersService, typeSuppliersService } from '@/lib/api-services';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  supplier_id: z.string().min(1, 'Fornecedor obrigatório'),
  name: z.string().trim().min(1, 'Nome obrigatório').max(200),
  city: z.string().trim().min(1, 'Cidade obrigatória').max(100),
  route: z.string().trim().min(1, 'Rota obrigatória').max(200),
  type: z.enum(['P', 'T']),
  status: z.enum(['A', 'I']),
});

type FormData = z.infer<typeof schema>;

interface Props { item?: Warehouse | null; onSave: () => void; onCancel: () => void; }

export function WarehouseForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({ queryKey: ['suppliers', 'active-options'], queryFn: () => suppliersService.getAll({ status: 'A' }) });
  const { data: typeSuppliers = [], isLoading: loadingTypes } = useQuery({ queryKey: ['type-suppliers', 'active-options'], queryFn: () => typeSuppliersService.getAll({ status: 'A' }) });

  const warehouseSuppliers = useMemo(() => {
    const armazemType = typeSuppliers.find((t) => t.name.toUpperCase().includes('ARMAZ'));
    const actives = suppliers.filter((s) => s.status === 'A' || String(s.id) === String(item?.supplier_id));
    if (!armazemType) return actives;
    return actives.filter((s) => s.type_supplier_ids?.includes(armazemType.id) || String(s.id) === String(item?.supplier_id));
  }, [suppliers, typeSuppliers, item]);

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item ? { supplier_id: item.supplier_id, name: item.name, city: item.city, route: item.route, type: item.type, status: item.status } : { type: 'P', status: 'A' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (item) { await warehousesService.update(item.id, data); toast.success('Armazém atualizado!'); }
      else { await warehousesService.create(data as Omit<Warehouse, 'id'>); toast.success('Armazém criado!'); }
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Fornecedor</Label>
        {(loadingSuppliers || loadingTypes) ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div> : (
          <Combobox
            options={warehouseSuppliers.map((s) => ({ value: String(s.id), label: s.fantasy_name || s.corporate_reason }))}
            value={watch('supplier_id')}
            onValueChange={(v) => setValue('supplier_id', v, { shouldValidate: true })}
            placeholder="Selecione o fornecedor"
            searchPlaceholder="Buscar fornecedor..."
            emptyText="Nenhum fornecedor encontrado."
          />
        )}
        {errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id.message}</p>}
      </div>
      <div className="space-y-2"><Label>Nome</Label><Input {...register('name')} placeholder="Ex: Armazém Central" />{errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}</div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Cidade</Label><Input {...register('city')} placeholder="Ex: Goiânia" />{errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}</div>
        <div className="space-y-2"><Label>Rota</Label><Input {...register('route')} placeholder="Ex: BR-153" />{errors.route && <p className="text-sm text-destructive">{errors.route.message}</p>}</div>
      </div>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select value={watch('type')} onValueChange={(v) => setValue('type', v as 'P' | 'T')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="P">Próprio</SelectItem><SelectItem value="T">Terceiro</SelectItem></SelectContent></Select>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={watch('status')} onValueChange={(v) => setValue('status', v as 'A' | 'I')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="A">Ativo</SelectItem><SelectItem value="I">Inativo</SelectItem></SelectContent></Select>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (item ? 'Salvar' : 'Criar')}</Button>
      </div>
    </form>
  );
}
