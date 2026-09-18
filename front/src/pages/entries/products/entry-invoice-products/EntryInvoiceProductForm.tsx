import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EntryInvoiceProduct, EntryInvoiceItem, entryInvoiceProductsService } from '@/lib/api-services-entries';
import { suppliersService } from '@/lib/api-services';
import { producersService } from '@/lib/api-services';
import { productsService } from '@/lib/api-services-products';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  supplier_id: z.string().min(1, 'Fornecedor obrigatório'),
  producer_id: z.string().min(1, 'Produtor obrigatório'),
  note_number: z.string().trim().min(1, 'Número da nota obrigatório').max(50),
  serie: z.string().trim().max(10).optional().or(z.literal('')),
  mission_date: z.string().min(1, 'Data de emissão obrigatória'),
  arrival_date: z.string().min(1, 'Data de chegada obrigatória'),
  total_value: z.coerce.number().min(0),
  status: z.enum(['A', 'I']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: EntryInvoiceProduct | null;
  onSave: () => void;
  onCancel: () => void;
}

const itemSchema = z.object({
  product_id: z.string().min(1, 'Produto obrigatório'),
  quantity: z.coerce.number().min(0.01, 'Quantidade obrigatória'),
  unit_value: z.coerce.number().min(0.01, 'Valor unitário obrigatório'),
  total_value: z.coerce.number().min(0),
});

type ItemFormData = z.infer<typeof itemSchema>;

export function EntryInvoiceProductForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<EntryInvoiceItem[]>(item?.items ?? []);
  const [showItemModal, setShowItemModal] = useState(false);

  const { data: suppliers = [], isLoading: ls } = useQuery({ queryKey: ['suppliers'], queryFn: suppliersService.getAll });
  const { data: producers = [], isLoading: lp } = useQuery({ queryKey: ['producers'], queryFn: producersService.getAll });
  const { data: products = [], isLoading: lprod } = useQuery({ queryKey: ['products'], queryFn: productsService.getAll });

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item ? {
      supplier_id: item.supplier_id,
      producer_id: item.producer_id,
      note_number: item.note_number,
      serie: item.serie || '',
      mission_date: item.mission_date,
      arrival_date: item.arrival_date,
      total_value: item.total_value,
      status: item.status,
    } : { status: 'A', total_value: 0 },
  });

  // Item modal form
  const itemForm = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: { quantity: 0, unit_value: 0, total_value: 0 },
  });

  const recalcTotal = (newItems: EntryInvoiceItem[]) => {
    const total = newItems.reduce((sum, i) => sum + i.total_value, 0);
    setValue('total_value', total);
  };

  const handleAddItem = (data: ItemFormData) => {
    const product = products.find((p) => p.id === data.product_id);
    const newItem: EntryInvoiceItem = {
      product_id: data.product_id,
      product_name: product?.name || '',
      quantity: data.quantity,
      unit_value: data.unit_value,
      total_value: data.total_value,
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    recalcTotal(newItems);
    setShowItemModal(false);
    itemForm.reset({ quantity: 0, unit_value: 0, total_value: 0 });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    recalcTotal(newItems);
  };

  const handleUnitValueBlur = () => {
    const qty = itemForm.getValues('quantity');
    const uv = itemForm.getValues('unit_value');
    itemForm.setValue('total_value', Number((qty * uv).toFixed(2)));
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload = { ...data, items } as any;
      if (item) {
        await entryInvoiceProductsService.update(item.id, payload);
        toast.success('Nota fiscal atualizada!');
      } else {
        await entryInvoiceProductsService.create(payload);
        toast.success('Nota fiscal criada!');
      }
      queryClient.invalidateQueries({ queryKey: ['entry-invoice-products'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally {
      setLoading(false);
    }
  };

  const loadingRel = ls || lp || lprod;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {loadingRel ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
      ) : (
        <Tabs defaultValue="main" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="main" className="flex-1">Nota Fiscal</TabsTrigger>
            <TabsTrigger value="items" className="flex-1">Itens</TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select value={watch('supplier_id')} onValueChange={(v) => setValue('supplier_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.corporate_reason || s.fantasy_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Produtor</Label>
                <Select value={watch('producer_id')} onValueChange={(v) => setValue('producer_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {producers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.owner_name || p.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.producer_id && <p className="text-sm text-destructive">{errors.producer_id.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número da Nota</Label>
                <Input {...register('note_number')} placeholder="Ex: 001234" />
                {errors.note_number && <p className="text-sm text-destructive">{errors.note_number.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Série</Label>
                <Input {...register('serie')} placeholder="Ex: 001" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Emissão</Label>
                <Input type="date" {...register('mission_date')} />
                {errors.mission_date && <p className="text-sm text-destructive">{errors.mission_date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Data de Chegada</Label>
                <Input type="date" {...register('arrival_date')} />
                {errors.arrival_date && <p className="text-sm text-destructive">{errors.arrival_date.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Total</Label>
                <Input type="number" step="0.01" {...register('total_value')} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={watch('status')} onValueChange={(v) => setValue('status', v as 'A' | 'I')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Ativo</SelectItem>
                    <SelectItem value="I">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="items" className="space-y-4 pt-2">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Valor Unit.</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        Nenhum item adicionado
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((itm, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{itm.product_name}</TableCell>
                        <TableCell className="text-right">{itm.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(itm.unit_value)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(itm.total_value)}</TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveItem(idx)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <Button type="button" variant="outline" onClick={() => { itemForm.reset({ quantity: 0, unit_value: 0, total_value: 0, product_id: '' }); setShowItemModal(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Item
            </Button>
          </TabsContent>
        </Tabs>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (item ? 'Salvar' : 'Criar')}
        </Button>
      </div>

      {/* Modal de Itens */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Item</DialogTitle></DialogHeader>
          <form onSubmit={itemForm.handleSubmit(handleAddItem)} className="space-y-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={itemForm.watch('product_id')} onValueChange={(v) => itemForm.setValue('product_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {itemForm.formState.errors.product_id && <p className="text-sm text-destructive">{itemForm.formState.errors.product_id.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input type="number" step="0.01" {...itemForm.register('quantity')} />
                {itemForm.formState.errors.quantity && <p className="text-sm text-destructive">{itemForm.formState.errors.quantity.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Valor Unitário</Label>
                <Input type="number" step="0.01" {...itemForm.register('unit_value')} onBlur={handleUnitValueBlur} />
                {itemForm.formState.errors.unit_value && <p className="text-sm text-destructive">{itemForm.formState.errors.unit_value.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Valor Total</Label>
                <Input type="number" step="0.01" {...itemForm.register('total_value')} readOnly className="bg-muted" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowItemModal(false)}>Cancelar</Button>
              <Button type="submit">Adicionar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </form>
  );
}
