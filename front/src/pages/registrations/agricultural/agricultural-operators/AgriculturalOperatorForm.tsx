import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { AgriculturalOperator, agriculturalOperatorsService } from '@/lib/api-services-agricultural';
import { suppliersService, typeSuppliersService } from '@/lib/api-services';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  supplier_id: z.string().min(1, 'Funcionário obrigatório'),
  status: z.enum(['A', 'I']),
});
type FormData = z.infer<typeof schema>;
interface Props { item?: AgriculturalOperator | null; onSave: () => void; onCancel: () => void; }

export function AgriculturalOperatorForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const { data: suppliers = [], isLoading: ls } = useQuery({ queryKey: ['suppliers', 'active-options'], queryFn: () => suppliersService.getAll({ status: 'A' }) });
  const { data: typeSuppliers = [], isLoading: lt } = useQuery({ queryKey: ['type-suppliers', 'active-options'], queryFn: () => typeSuppliersService.getAll({ status: 'A' }) });
  const le = ls || lt;

  const employees = useMemo(() => {
    const employeeType = typeSuppliers.find((t) => t.name.toUpperCase().includes('FUNCION'));
    const actives = suppliers.filter((s) => s.status === 'A' || String(s.id) === String(item?.supplier_id));
    if (!employeeType) return actives;
    return actives.filter((s) => s.type_supplier_ids?.map(String).includes(String(employeeType.id)) || String(s.id) === String(item?.supplier_id));
  }, [suppliers, typeSuppliers, item]);

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item ? { supplier_id: item.supplier_id, status: item.status } : { status: 'A' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (item) { await agriculturalOperatorsService.update(item.id, data); toast.success('Operador atualizado!'); }
      else { await agriculturalOperatorsService.create(data as Omit<AgriculturalOperator, 'id'>); toast.success('Operador criado!'); }
      queryClient.invalidateQueries({ queryKey: ['agricultural-operators'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Funcionário</Label>
        {le ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div> : (
          <Combobox
            options={employees.map((e) => ({ value: String(e.id), label: e.fantasy_name || e.corporate_reason }))}
            value={watch('supplier_id')}
            onValueChange={(v) => setValue('supplier_id', v, { shouldValidate: true })}
            placeholder="Selecione o funcionário"
            searchPlaceholder="Buscar funcionário..."
            emptyText="Nenhum funcionário encontrado."
          />
        )}
        {errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id.message}</p>}
      </div>
      
      <div className="space-y-2"><Label>Status</Label><Select value={watch('status')} onValueChange={(v) => setValue('status', v as 'A' | 'I')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="A">Ativo</SelectItem><SelectItem value="I">Inativo</SelectItem></SelectContent></Select></div>
      <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button><Button type="submit" disabled={loading}>{loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (item ? 'Salvar' : 'Criar')}</Button></div>
    </form>
  );
}
