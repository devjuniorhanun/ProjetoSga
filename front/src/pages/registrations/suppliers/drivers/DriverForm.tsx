import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Driver, driversService, suppliersService, typeSuppliersService } from '@/lib/api-services';
import { formatPlateMercosul } from '@/lib/format-helpers';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  supplier_id: z.string().min(1, 'Fornecedor obrigatório'),
  name: z.string().trim().min(1, 'Nome obrigatório').max(200),
  code: z.string().trim().min(1, 'Código obrigatório').max(50),
  plate: z.string().trim().min(1, 'Placa obrigatória').max(20),
  status: z.enum(['A', 'I']),
});

type FormData = z.infer<typeof schema>;

interface Props { item?: Driver | null; onSave: () => void; onCancel: () => void; }

export function DriverForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({ queryKey: ['suppliers', 'active-options'], queryFn: () => suppliersService.getAll({ status: 'A' }) });
  const { data: typeSuppliers = [], isLoading: loadingTypes } = useQuery({ queryKey: ['type-suppliers', 'active-options'], queryFn: () => typeSuppliersService.getAll({ status: 'A' }) });

  const filteredSuppliers = useMemo(() => {
    const transportadorType = typeSuppliers.find((t) => t.name.toUpperCase().includes('TRANSPORTADOR'));
    const actives = suppliers.filter((s) => s.status === 'A' || String(s.id) === String(item?.supplier_id));
    if (!transportadorType) return actives;
    return actives.filter((s) => s.type_supplier_ids?.includes(transportadorType.id) || String(s.id) === String(item?.supplier_id));
  }, [suppliers, typeSuppliers, item]);

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item ? { supplier_id: item.supplier_id, name: item.name, code: item.code, plate: item.plate, status: item.status } : { status: 'A' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (item) { await driversService.update(item.id, data); toast.success('Motorista atualizado!'); }
      else { await driversService.create(data as Omit<Driver, 'id'>); toast.success('Motorista criado!'); }
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
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
            options={filteredSuppliers.map((s) => ({ value: String(s.id), label: s.fantasy_name || s.corporate_reason }))}
            value={watch('supplier_id')}
            onValueChange={(v) => setValue('supplier_id', v, { shouldValidate: true })}
            placeholder="Selecione o fornecedor"
            searchPlaceholder="Buscar fornecedor..."
            emptyText="Nenhum fornecedor encontrado."
          />
        )}
        {errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id.message}</p>}
      </div>
      <div className="space-y-2"><Label>Nome</Label><Input {...register('name')} placeholder="Ex: João Silva" />{errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}</div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Código</Label><Input {...register('code')} placeholder="Ex: MOT001" />{errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}</div>
        <div className="space-y-2"><Label>Placa</Label><Input value={watch('plate') || ''} onChange={(e) => setValue('plate', formatPlateMercosul(e.target.value))} placeholder="Ex: ABC1D23" maxLength={7} />{errors.plate && <p className="text-sm text-destructive">{errors.plate.message}</p>}</div>
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
