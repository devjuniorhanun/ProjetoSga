import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { SupplierProduct, supplierProductsService, productsService } from '@/lib/api-services-products';
import { suppliersService } from '@/lib/api-services';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  supplier_id: z.string().min(1, 'Fornecedor obrigatório'),
  product_id: z.string().min(1, 'Produto obrigatório'),
  product_code: z.string().trim().min(1, 'Código obrigatório').max(100),
  volume: z.string().trim().max(100).optional().or(z.literal('')),
  status: z.enum(['A', 'I']),
});
type FormData = z.infer<typeof schema>;
interface Props { item?: SupplierProduct | null; onSave: () => void; onCancel: () => void; }

export function SupplierProductForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const { data: suppliers = [], isLoading: ls } = useQuery({ queryKey: ['suppliers'], queryFn: suppliersService.getAll });
  const { data: products = [], isLoading: lp } = useQuery({ queryKey: ['products'], queryFn: productsService.getAll });

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item ? { supplier_id: item.supplier_id, product_id: item.product_id, product_code: item.product_code, volume: item.volume, status: item.status } : { status: 'A' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (item) { await supplierProductsService.update(item.id, data); toast.success('Produto fornecedor atualizado!'); }
      else { await supplierProductsService.create(data as Omit<SupplierProduct, 'id'>); toast.success('Produto fornecedor criado!'); }
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] }); onSave();
    } catch (error: any) { applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' }); } finally { setLoading(false); }
  };

  const supplierOptions = useMemo(() => suppliers.filter((s) => s.status === 'A' || String(s.id) === String(item?.supplier_id)).map((s) => ({ value: s.id, label: s.fantasy_name })), [suppliers, item]);
  const productOptions = useMemo(() => products.filter((p) => p.status === 'A' || String(p.id) === String(item?.product_id)).map((p) => ({ value: p.id, label: p.name })), [products, item]);

  const loadingRel = ls || lp;
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {loadingRel ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div> : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Fornecedor</Label><Combobox options={supplierOptions} value={watch('supplier_id')} onValueChange={(v) => setValue('supplier_id', v)} placeholder="Selecione o fornecedor" searchPlaceholder="Buscar fornecedor..." />{errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id.message}</p>}</div>
            <div className="space-y-2"><Label>Produto</Label><Combobox options={productOptions} value={watch('product_id')} onValueChange={(v) => setValue('product_id', v)} placeholder="Selecione o produto" searchPlaceholder="Buscar produto..." />{errors.product_id && <p className="text-sm text-destructive">{errors.product_id.message}</p>}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Código do Produto</Label><Input {...register('product_code')} placeholder="Ex: PRD-001" />{errors.product_code && <p className="text-sm text-destructive">{errors.product_code.message}</p>}</div>
            <div className="space-y-2"><Label>Volume</Label><Input {...register('volume')} placeholder="Ex: 20L" /></div>
          </div>
          <div className="space-y-2"><Label>Status</Label><Select value={watch('status')} onValueChange={(v) => setValue('status', v as 'A' | 'I')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="A">Ativo</SelectItem><SelectItem value="I">Inativo</SelectItem></SelectContent></Select></div>
        </>
      )}
      <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button><Button type="submit" disabled={loading}>{loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (item ? 'Salvar' : 'Criar')}</Button></div>
    </form>
  );
}
