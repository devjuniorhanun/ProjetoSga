import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Product, productsService, productGroupsService } from '@/lib/api-services-products';
import { SubGroupProduct } from '@/lib/api-services-products';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { formatAreaDisplay, handleAreaMaskChange } from '@/lib/format-helpers';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  product_group_id: z.string().min(1, 'Grupo obrigatório'),
  sub_group_product_id: z.string().min(1, 'Sub grupo obrigatório'),
  name: z.string().trim().min(1, 'Nome obrigatório').max(200),
  stock: z.coerce.number().min(0).optional(),
  stock_location: z.string().trim().max(200).optional().or(z.literal('')),
  minimum_quantity: z.coerce.number().min(0).optional(),
  drum_box: z.string().trim().max(100).optional().or(z.literal('')),
  gallon_package: z.string().trim().max(100).optional().or(z.literal('')),
  unit: z.enum(['K', 'L']),
  status: z.enum(['A', 'I']),
});

type FormData = z.infer<typeof schema>;
interface Props { item?: Product | null; onSave: () => void; onCancel: () => void; }

export function ProductForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const { data: groups = [], isLoading: lg } = useQuery({ queryKey: ['product-groups'], queryFn: productGroupsService.getAll });
  const [subGroups, setSubGroups] = useState<SubGroupProduct[]>([]);
  const [loadingSubGroups, setLoadingSubGroups] = useState(false);

  const [stockDisplay, setStockDisplay] = useState(formatAreaDisplay(item?.stock));
  const [minQtyDisplay, setMinQtyDisplay] = useState(formatAreaDisplay(item?.minimum_quantity));

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item ? {
      product_group_id: item.product_group_id ?? item.group_product_id, sub_group_product_id: item.sub_group_product_id,
      name: item.name, stock: item.stock ?? 0,
      stock_location: item.stock_location, minimum_quantity: item.minimum_quantity ?? 0,
      drum_box: item.drum_box, gallon_package: item.gallon_package, unit: item.unit, status: item.status,
    } : { status: 'A', unit: 'K', stock: 0, minimum_quantity: 0 },
  });

  const fetchSubGroups = useCallback(async (groupId: string) => {
    if (!groupId) return;
    setLoadingSubGroups(true);
    try {
      const { data } = await api.get(`/registrations/products/product-groups/${groupId}/sub-group-products`);
      const result = data.data ?? data;
      setSubGroups(Array.isArray(result) ? result : []);
    } catch {
      setSubGroups([]);
    } finally {
      setLoadingSubGroups(false);
    }
  }, []);

  // Load sub-groups on edit
  useState(() => {
    if (item?.product_group_id || item?.group_product_id) {
      fetchSubGroups(item.product_group_id ?? item.group_product_id);
    }
  });

  const handleGroupChange = (v: string) => {
    setValue('product_group_id', v);
    setValue('sub_group_product_id', '');
    fetchSubGroups(v);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const payload = { ...data };
    try {
      if (item) { await productsService.update(item.id, payload as any); toast.success('Produto atualizado!'); }
      else { await productsService.create(payload as any); toast.success('Produto criado!'); }
      queryClient.invalidateQueries({ queryKey: ['products'] }); onSave();
    } catch (error: any) { applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' }); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {lg ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div> : (
        <>
          <div className="grid grid-cols-2 gap-4">
<div className="space-y-2"><Label>Grupo</Label><Combobox options={groups.filter((g) => g.status === 'A' || String(g.id) === String(item?.product_group_id)).map((g) => ({ value: g.id, label: g.name }))} value={watch('product_group_id')} onValueChange={handleGroupChange} placeholder="Selecione" searchPlaceholder="Buscar grupo..." emptyText="Nenhum grupo encontrado." />{errors.product_group_id && <p className="text-sm text-destructive">{errors.product_group_id.message}</p>}</div>
            <div className="space-y-2"><Label>Sub Grupo</Label>{loadingSubGroups ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div> : <Combobox options={subGroups.filter((s) => s.status === 'A' || String(s.id) === String(item?.sub_group_product_id)).map((s) => ({ value: s.id, label: s.name }))} value={watch('sub_group_product_id')} onValueChange={(v) => setValue('sub_group_product_id', v)} placeholder="Selecione" searchPlaceholder="Buscar sub grupo..." emptyText="Nenhum sub grupo encontrado." />}{errors.sub_group_product_id && <p className="text-sm text-destructive">{errors.sub_group_product_id.message}</p>}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nome</Label><Input {...register('name')} placeholder="Ex: Roundup" />{errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}</div>
            <div className="space-y-2"><Label>Unidade</Label><Select value={watch('unit')} onValueChange={(v) => setValue('unit', v as 'K' | 'L')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="K">Kilo</SelectItem><SelectItem value="L">Litro</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Estoque</Label><Input value={stockDisplay} onChange={(e) => handleAreaMaskChange(e, setStockDisplay, (v) => setValue('stock', v))} placeholder="0,00" />{errors.stock && <p className="text-sm text-destructive">{errors.stock.message}</p>}</div>
            <div className="space-y-2"><Label>Local do Estoque</Label><Input {...register('stock_location')} placeholder="Ex: Galpão 1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Quantidade Mínima</Label><Input value={minQtyDisplay} onChange={(e) => handleAreaMaskChange(e, setMinQtyDisplay, (v) => setValue('minimum_quantity', v))} placeholder="0,00" /></div>
                      </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Tambor/Caixa</Label><Input {...register('drum_box')} /></div>
            <div className="space-y-2"><Label>Galão/Pacote</Label><Input {...register('gallon_package')} /></div>
          </div>
          <div className="space-y-2"><Label>Status</Label><Select value={watch('status')} onValueChange={(v) => setValue('status', v as 'A' | 'I')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="A">Ativo</SelectItem><SelectItem value="I">Inativo</SelectItem></SelectContent></Select></div>
        </>
      )}
      <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button><Button type="submit" disabled={loading}>{loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (item ? 'Salvar' : 'Criar')}</Button></div>
    </form>
  );
}
