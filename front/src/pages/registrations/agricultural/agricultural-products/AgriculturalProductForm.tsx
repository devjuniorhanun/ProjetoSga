import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgriculturalProduct, ActiveIngredientItem, agriculturalProductsService, typeFormulationsService } from '@/lib/api-services-agricultural';
import { productsService } from '@/lib/api-services-products';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  product_id: z.string().min(1, 'Produto obrigatório'),
  type_formulation_id: z.string().min(1, 'Formulação obrigatória'),
  status: z.enum(['A', 'I']),
});
type FormData = z.infer<typeof schema>;
interface Props { item?: AgriculturalProduct | null; onSave: () => void; onCancel: () => void; }

function toIngredientList(value: unknown): ActiveIngredientItem[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === 'string'
        ? { active_ingredient: v, concentration: '' }
        : { active_ingredient: (v as any)?.active_ingredient ?? '', concentration: String((v as any)?.concentration ?? '') }))
      .filter((v) => v.active_ingredient);
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((v) => ({ active_ingredient: v.trim(), concentration: '' })).filter((v) => v.active_ingredient);
  }
  return [];
}

export function AgriculturalProductForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('data');

  const { data: products = [], isLoading: lp } = useQuery({ queryKey: ['products'], queryFn: productsService.getAll });
  const { data: formulations = [], isLoading: lf } = useQuery({ queryKey: ['type-formulations'], queryFn: typeFormulationsService.getAll });

  const [ingredients, setIngredients] = useState<ActiveIngredientItem[]>(() => toIngredientList(item?.active_ingredient));
  const [newIngredient, setNewIngredient] = useState('');
  const [newConcentration, setNewConcentration] = useState('');

  const productOptions = useMemo(() => {
    return products
      .filter((p) => {
        const group = String((p as any).group_product_name ?? (p as any).product_group_name ?? '').toUpperCase();
        return p.status === 'A' && group.includes('QUÍMIC');
      })
      .map((p) => ({ value: p.id, label: p.name }));
  }, [products]);

  const formulationOptions = useMemo(
    () => formulations.filter((f) => f.status === 'A').map((f) => ({ value: String(f.id), label: f.abbreviation })),
    [formulations]
  );

  const { handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? { product_id: item.product_id, type_formulation_id: item.type_formulation_id ? String(item.type_formulation_id) : '', status: item.status }
      : { status: 'A' },
  });

  const addIngredient = () => {
    const value = newIngredient.trim();
    if (!value) return;
    if (ingredients.some((i) => i.active_ingredient === value)) { toast.error('Ingrediente ativo já adicionado.'); return; }
    setIngredients((prev) => [...prev, { active_ingredient: value, concentration: newConcentration.trim() }]);
    setNewIngredient('');
    setNewConcentration('');
  };

  const onSubmit = async (data: FormData) => {
    if (ingredients.length === 0) {
      toast.error('Informe ao menos um ingrediente ativo.');
      setTab('ingredients');
      return;
    }
    setLoading(true);
    
    const payload = { ...data, active_ingredient: ingredients };
    
    try {
      if (item) { await agriculturalProductsService.update(item.id, payload as any); toast.success('Produto agrícola atualizado!'); }
      else { await agriculturalProductsService.create(payload as any); toast.success('Produto agrícola criado!'); }
      queryClient.invalidateQueries({ queryKey: ['agricultural-products'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="data">Dados</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredientes Ativos ({ingredients.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-4 pt-4">
          {lp || lf ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Produto</Label>
                <Combobox options={productOptions} value={watch('product_id')} onValueChange={(v) => setValue('product_id', v, { shouldValidate: true })} placeholder="Selecione o produto" searchPlaceholder="Buscar produto..." />
                {errors.product_id && <p className="text-sm text-destructive">{errors.product_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Formulação</Label>
                <Combobox options={formulationOptions} value={watch('type_formulation_id')} onValueChange={(v) => setValue('type_formulation_id', v, { shouldValidate: true })} placeholder="Selecione a formulação" searchPlaceholder="Buscar formulação..." />
                {errors.type_formulation_id && <p className="text-sm text-destructive">{errors.type_formulation_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={watch('status')} onValueChange={(v) => setValue('status', v as 'A' | 'I')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="A">Ativo</SelectItem><SelectItem value="I">Inativo</SelectItem></SelectContent></Select>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="ingredients" className="space-y-4 pt-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label>Ingrediente Ativo</Label>
              <Input
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addIngredient(); } }}
                placeholder="Ex: Glifosato"
              />
            </div>
            <div className="w-40 space-y-2">
              <Label>Concentração</Label>
              <Input
                value={newConcentration}
                onChange={(e) => setNewConcentration(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addIngredient(); } }}
                placeholder="Ex: 480 g/L"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={addIngredient}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
          {ingredients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum ingrediente ativo adicionado.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {ingredients.map((ing, idx) => (
                <li key={`${ing.active_ingredient}-${idx}`} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm">{ing.active_ingredient}{ing.concentration ? ` — ${ing.concentration}` : ''}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (item ? 'Salvar' : 'Criar')}</Button>
      </div>
    </form>
  );
}
