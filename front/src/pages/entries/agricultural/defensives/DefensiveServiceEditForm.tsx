import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, useMemo, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  AgriculturalDefensiveOrder,
  AgriculturalDefensiveOrderOperator,
  AgriculturalDefensiveOrderProduct,
  AgriculturalDefensiveOrderPreviousOrder,
  defensiveOrdersService,
} from '@/lib/api-services-entries';
import { cropsService } from '@/lib/api-services';
import { typeOperationsService } from '@/lib/api-services-agricultural';
import { agriculturalOperatorsService } from '@/lib/api-services-agricultural';
import { fieldsService } from '@/lib/api-services';
import { productsService } from '@/lib/api-services-products';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { formatAreaDisplay, handleAreaMaskChange } from '@/lib/format-helpers';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { applyApiErrors } from '@/lib/form-errors';
import { useFleetsByFunction } from '@/hooks/use-fleets-by-function';

const schema = z.object({
  crop_id: z.string().min(1, 'Safra obrigatória'),
  culture_id: z.string().min(1, 'Cultura obrigatória'),
  type_operation_id: z.string().min(1, 'Tipo de operação obrigatório'),
  application_date: z.string().min(1, 'Data obrigatória'),
  pump_volume: z.coerce.number().min(0),
  flow: z.coerce.number().min(0),
  pump_capacity: z.coerce.number().min(0),
  field_id: z.string().min(1, 'Talhão obrigatório'),
  area: z.coerce.number().min(0),
  recommended_pump: z.coerce.number().min(0),
  observation: z.string().optional().or(z.literal('')),
  status: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

const operatorSchema = z.object({
  operator_id: z.string().min(1, 'Operador obrigatório'),
  fleet_id: z.string().min(1, 'Frota obrigatória'),
  function: z.enum(['O', 'T']),
});
type OperatorFormData = z.infer<typeof operatorSchema>;

const productSchema = z.object({
  product_id: z.string().min(1, 'Produto obrigatório'),
  dose: z.coerce.number().gt(0, 'Dose deve ser maior que zero'),
  pump: z.coerce.number().gt(0, 'Bomba deve ser maior que zero'),
});
type ProductFormData = z.infer<typeof productSchema>;

const previousOSSchema = z.object({
  os_number: z.string().min(1, 'Número de O.S obrigatório'),
  quantity_used: z.coerce.number().min(0, 'Quantidade obrigatória'),
});
type PreviousOSFormData = z.infer<typeof previousOSSchema>;

interface Props {
  item: AgriculturalDefensiveOrder;
  onSave: () => void;
  onCancel: () => void;
}

export function DefensiveServiceEditForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const [operators, setOperators] = useState<AgriculturalDefensiveOrderOperator[]>(item.operators ?? []);
  const [products, setProducts] = useState<AgriculturalDefensiveOrderProduct[]>(item.products ?? []);
  const [previousOS, setPreviousOS] = useState<AgriculturalDefensiveOrderPreviousOrder[]>(item.previous_os ?? []);
  const [appliedAreaDisplay, setAppliedAreaDisplay] = useState(formatAreaDisplay(item.area ?? 0));

  const [showOperatorModal, setShowOperatorModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPreviousOSModal, setShowPreviousOSModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showReissueDialog, setShowReissueDialog] = useState(false);

  const { data: crops = [], isLoading: l1 } = useQuery({ queryKey: ['crops'], queryFn: cropsService.getAll });
  const [cropCultures, setCropCultures] = useState<{ id: string; name: string }[]>([]);
  const [loadingCropCultures, setLoadingCropCultures] = useState(false);
  const { data: typeOperations = [], isLoading: l3 } = useQuery({ queryKey: ['type-operations'], queryFn: typeOperationsService.getAll });
  const { data: fieldsList = [], isLoading: l4 } = useQuery({ queryKey: ['fields'], queryFn: fieldsService.getAll });
  const { data: agriOperators = [], isLoading: l5 } = useQuery({ queryKey: ['agricultural-operators'], queryFn: agriculturalOperatorsService.getAll });



  const { data: productsList = [], isLoading: l7 } = useQuery({ queryKey: ['products'], queryFn: productsService.getAll });

  const operatorOptions = useMemo(() => agriOperators.filter((o: any) => o.status === undefined || o.status === 'A').map((o) => ({ value: o.id, label: o.supplier_name || o.id })), [agriOperators]);
  const productOptions = useMemo(() => productsList.filter((p: any) => p.status === undefined || p.status === 'A').map((p) => ({ value: p.id, label: p.name })), [productsList]);

  const fetchCulturesByCrop = async (cropId: string) => {
    if (!cropId) return;
    setLoadingCropCultures(true);
    try {
      const { data } = await api.get(`/registrations/harvest/crops/${cropId}/cultures`);
      const crop = data.data ?? data;
      const cultureIds: string[] = crop?.culture_ids ?? [];
      if (cultureIds.length > 0) {
        const { data: allCultures } = await api.get('/registrations/harvest/cultures');
        const list = allCultures.data ?? allCultures;
        const filtered = Array.isArray(list) ? list.filter((c: any) => cultureIds.includes(c.id)) : [];
        setCropCultures(filtered);
      } else {
        setCropCultures([]);
      }
    } catch {
      setCropCultures([]);
    } finally {
      setLoadingCropCultures(false);
    }
  };

  useEffect(() => {
    if (item.crop_id) fetchCulturesByCrop(item.crop_id);
  }, []);

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      crop_id: item.crop_id,
      culture_id: item.culture_id,
      type_operation_id: item.type_operation_id,
      application_date: item.application_date,
      pump_volume: item.pump_volume,
      flow: item.flow,
      pump_capacity: item.pump_capacity,
      field_id: item.field_id != null ? String(item.field_id) : '',
      area: item.area ?? 0,
      recommended_pump: item.recommended_pump ?? 0,
      observation: item.observation,
      status: item.status,
    },
  });

  const handleFlowBlur = () => {
    const pv = watch('pump_volume');
    const fl = watch('flow');
    if (fl > 0) setValue('pump_capacity', Number((pv / fl).toFixed(3)));
  };

  const handleAppliedAreaBlur = () => {
    const area = watch('area');
    const capacity = watch('pump_capacity');
    if (capacity > 0) {
      setValue('recommended_pump', Number((area / capacity).toFixed(3)));
    }
  };

  // Execução da O.S. (somente leitura — vem da API)
  const usedBomb = Number(item.used_bomb ?? 0);
  const recommendedPumpValue = Number(watch('recommended_pump') ?? 0);
  const remainingBomb = Math.max(recommendedPumpValue - usedBomb, 0);

  // ----- Operator modal -----
  const operatorForm = useForm<OperatorFormData>({
    resolver: zodResolver(operatorSchema),
    defaultValues: { function: 'O' },
  });

  const operatorFunction = operatorForm.watch('function');
  const {
    fleets: fleetsForFunction,
    options: fleetOptionsForFunction,
    isLoading: loadingFleetsByFunction,
    isError: fleetsByFunctionError,
    refetch: refetchFleetsByFunction,
  } = useFleetsByFunction(operatorFunction);

  const handleAddOperator = (data: OperatorFormData) => {
    const fleet = fleetsForFunction.find((f) => String(f.id) === String(data.fleet_id));
    if (!fleet) {
      operatorForm.setError('fleet_id', { type: 'manual', message: 'Selecione uma frota válida para a função informada.' });
      return;
    }
    const operator = agriOperators.find((o) => o.id === data.operator_id);
    setOperators((prev) => [
      ...prev,
      { operator_id: data.operator_id, fleet_id: data.fleet_id, operator_name: operator?.supplier_name, fleet_name: fleet?.name || fleet?.plate, function: data.function },
    ]);
    setShowOperatorModal(false);
    operatorForm.reset({ function: 'O' });
  };

  // ----- Product modal -----
  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { dose: 0, pump: 0 },
  });

  const pumpCapacity = watch('pump_capacity');

  const handleDoseBlur = () => {
    const dose = productForm.getValues('dose');
    productForm.setValue('pump', Number((dose * pumpCapacity).toFixed(3)));
  };

  const handlePumpBlur = () => {
    const pump = productForm.getValues('pump');
    if (pumpCapacity > 0) productForm.setValue('dose', Number((pump / pumpCapacity).toFixed(3)));
  };

  const handleAddProduct = (data: ProductFormData) => {
    const prod = productsList.find((p) => p.id === data.product_id);
    setProducts((prev) => [...prev, { product_id: data.product_id, product_name: prod?.name, dose: data.dose, pump: data.pump }]);
    setShowProductModal(false);
    productForm.reset({ dose: 0, pump: 0 });
  };

  // ----- Previous OS modal -----
  const previousOSForm = useForm<PreviousOSFormData>({
    resolver: zodResolver(previousOSSchema),
    defaultValues: { os_number: '', quantity_used: 0 },
  });

  const handleAddPreviousOS = (data: PreviousOSFormData) => {
    setPreviousOS((prev) => [...prev, { os_number: data.os_number, quantity_used: data.quantity_used }]);
    setShowPreviousOSModal(false);
    previousOSForm.reset({ os_number: '', quantity_used: 0 });
  };

  const buildPayload = (data: FormData) => ({
    crop_id: data.crop_id,
    culture_id: data.culture_id,
    type_operation_id: data.type_operation_id,
    application_date: data.application_date,
    pump_volume: data.pump_volume,
    flow: data.flow,
    pump_capacity: data.pump_capacity,
    recommended_pump: data.recommended_pump,
    observation: data.observation,
    status: data.status,
    fields: [{ field_id: data.field_id, area: data.area }],
    operators: operators.map((o) => ({ operator_id: o.operator_id, fleet_id: o.fleet_id, function: o.function })),
    products: products.map((p) => ({ product_id: p.product_id, dose: p.dose, pump: p.pump })),
    // Duplicidades preservadas: nenhum filtro/dedupe aplicado aqui.
    previous_os: previousOS.map((os) => ({ os_number: os.os_number, quantity_used: os.quantity_used })),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await defensiveOrdersService.update(item.id, buildPayload(data) as Partial<AgriculturalDefensiveOrder>);
      toast.success('Serviço Agrícola atualizado!');
      queryClient.invalidateQueries({ queryKey: ['defensive-orders'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally {
      setLoading(false);
    }
  };

  const onReissue = async (data: FormData) => {
    setLoading(true);
    try {
      await defensiveOrdersService.reissue(item.id, buildPayload(data) as Partial<AgriculturalDefensiveOrder>);
      toast.success('O.S. reemitida com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['defensive-orders'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao reemitir a O.S.' });
    } finally {
      setLoading(false);
    }
  };

  const requestReissue = () => {
    handleSubmit(() => {
      if (operators.length === 0) {
        toast.error('Adicione pelo menos um operador.');
        return;
      }
      if (!operators.some((op) => op.function === 'T')) {
        toast.error('Adicione pelo menos um operador com função Tanqueiro.');
        return;
      }
      if (products.length === 0) {
        toast.error('Adicione pelo menos um produto.');
        return;
      }
      setShowReissueDialog(true);
    })();
  };

  // Validações locais + abertura do diálogo de confirmação.
  // O envio à API só acontece ao clicar em "Salvar" no ConfirmDialog.
  const requestConfirmation = (e?: FormEvent) => {
    e?.preventDefault();
    handleSubmit(() => {
      if (operators.length === 0) {
        toast.error('Adicione pelo menos um operador.');
        return;
      }
      if (!operators.some((op) => op.function === 'T')) {
        toast.error('Adicione pelo menos um operador com função Tanqueiro.');
        return;
      }
      if (products.length === 0) {
        toast.error('Adicione pelo menos um produto.');
        return;
      }
      setShowConfirmDialog(true);
    })();
  };

  const loadingRel = l1 || l3 || l4 || l5 || l7;

  return (
    <form onSubmit={requestConfirmation} className="space-y-4">
      {loadingRel ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
      ) : (
        <Tabs defaultValue="main" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="main" className="flex-1">Serviço Agrícola</TabsTrigger>
            <TabsTrigger value="operators" className="flex-1">Operadores</TabsTrigger>
            <TabsTrigger value="products" className="flex-1">Produtos</TabsTrigger>
            <TabsTrigger value="previous_os" className="flex-1">O.S Anterior</TabsTrigger>
          </TabsList>

          {/* ─── ABA PRINCIPAL ─── */}
          <TabsContent value="main" className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Safra</Label>
                <Select value={watch('crop_id')} onValueChange={(v) => { setValue('crop_id', v); setValue('culture_id', ''); setCropCultures([]); fetchCulturesByCrop(v); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{crops.filter((c: any) => c.status === 'A').map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                {errors.crop_id && <p className="text-sm text-destructive">{errors.crop_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Cultura</Label>
                {loadingCropCultures ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
                ) : (
                  <Select value={watch('culture_id')} onValueChange={(v) => setValue('culture_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{cropCultures.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                )}
                {errors.culture_id && <p className="text-sm text-destructive">{errors.culture_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Tipo de Operação</Label>
                <Select value={watch('type_operation_id')} onValueChange={(v) => setValue('type_operation_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{typeOperations.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
                {errors.type_operation_id && <p className="text-sm text-destructive">{errors.type_operation_id.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data de Aplicação</Label>
                <Input type="date" {...register('application_date')} />
                {errors.application_date && <p className="text-sm text-destructive">{errors.application_date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Volume da Bomba</Label>
                <Input type="number" step="0.0001" {...register('pump_volume')} />
              </div>
              <div className="space-y-2">
                <Label>Vazão</Label>
                <Input type="number" step="0.0001" {...register('flow')} onBlur={handleFlowBlur} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Capacidade da Bomba</Label>
                <Input type="number" step="0.0001" {...register('pump_capacity')} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Talhão</Label>
                <Select value={watch('field_id')} onValueChange={(v) => setValue('field_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{fieldsList.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                </Select>
                {errors.field_id && <p className="text-sm text-destructive">{errors.field_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Área Aplicada</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={appliedAreaDisplay}
                onChange={(e) => handleAreaMaskChange(e, setAppliedAreaDisplay, (v) => setValue('area', v, { shouldValidate: true }))}
                onBlur={handleAppliedAreaBlur}
                placeholder="0,00"
              />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Bombas Recomendadas</Label>
                <Input type="number" step="0.0001" {...register('recommended_pump')} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Bombas Utilizadas (fechamentos)</Label>
                <Input type="number" value={usedBomb} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Bombas Restantes</Label>
                <Input type="number" value={Number(remainingBomb.toFixed(3))} readOnly className="bg-muted" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={watch('status')} onValueChange={(v) => setValue('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Aberta</SelectItem>
                    <SelectItem value="F">Finalizada</SelectItem>
                    <SelectItem value="I">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea {...register('observation')} placeholder="Observações do serviço..." rows={3} />
            </div>
          </TabsContent>

          {/* ─── ABA OPERADORES ─── */}
          <TabsContent value="operators" className="space-y-4 pt-2">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operador</TableHead>
                    <TableHead>Frota</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operators.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Nenhum operador adicionado</TableCell></TableRow>
                  ) : (
                    operators.map((op, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{op.operator_name || op.operator_id}</TableCell>
                        <TableCell>{op.fleet_name || op.fleet_id}</TableCell>
                        <TableCell>{op.function === 'O' ? 'Operador' : 'Tanqueiro'}</TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setOperators((prev) => prev.filter((_, i) => i !== idx))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <Button type="button" variant="outline" onClick={() => { operatorForm.reset({ function: 'O' }); setShowOperatorModal(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Operador
            </Button>
          </TabsContent>

          {/* ─── ABA PRODUTOS ─── */}
          <TabsContent value="products" className="space-y-4 pt-2">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Dose</TableHead>
                    <TableHead className="text-right">Bomba</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Nenhum produto adicionado</TableCell></TableRow>
                  ) : (
                    products.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{p.product_name || p.product_id}</TableCell>
                        <TableCell className="text-right">{p.dose}</TableCell>
                        <TableCell className="text-right">{p.pump}</TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setProducts((prev) => prev.filter((_, i) => i !== idx))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <Button type="button" variant="outline" onClick={() => { productForm.reset({ dose: 0, pump: 0 }); setShowProductModal(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
            </Button>
          </TabsContent>

          {/* ─── ABA O.S ANTERIOR ─── */}
          <TabsContent value="previous_os" className="space-y-4 pt-2">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número de O.S</TableHead>
                    <TableHead className="text-right">Quantidade Usada</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previousOS.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Nenhuma O.S anterior adicionada</TableCell></TableRow>
                  ) : (
                    previousOS.map((os, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{os.os_number}</TableCell>
                        <TableCell className="text-right">{os.quantity_used}</TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setPreviousOS((prev) => prev.filter((_, i) => i !== idx))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <Button type="button" variant="outline" onClick={() => { previousOSForm.reset({ os_number: '', quantity_used: 0 }); setShowPreviousOSModal(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar O.S Anterior
            </Button>
          </TabsContent>
        </Tabs>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="button" variant="secondary" disabled={loading} onClick={requestReissue}>
          Reemitir O.S.
        </Button>
        <Button type="button" disabled={loading} onClick={() => requestConfirmation()}>
          {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : 'Salvar'}
        </Button>
      </div>

      {/* ─── MODAL OPERADOR ─── */}
      <Dialog open={showOperatorModal} onOpenChange={setShowOperatorModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Operador</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); operatorForm.handleSubmit(handleAddOperator)(e); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Operador Agrícola</Label>
              <Combobox
                options={operatorOptions}
                value={operatorForm.watch('operator_id')}
                onValueChange={(v) => operatorForm.setValue('operator_id', v)}
                placeholder="Selecione o operador"
                searchPlaceholder="Buscar operador..."
              />
              {operatorForm.formState.errors.operator_id && <p className="text-sm text-destructive">{operatorForm.formState.errors.operator_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select
                value={operatorForm.watch('function')}
                onValueChange={(v) => {
                  operatorForm.setValue('function', v as 'O' | 'T', { shouldValidate: true, shouldDirty: true });
                  operatorForm.setValue('fleet_id', '', { shouldValidate: false, shouldDirty: true });
                  operatorForm.clearErrors('fleet_id');
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="O">Operador</SelectItem>
                  <SelectItem value="T">Tanqueiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frota</Label>
              <Combobox
                options={fleetOptionsForFunction}
                value={operatorForm.watch('fleet_id')}
                onValueChange={(v) => operatorForm.setValue('fleet_id', v)}
                disabled={!operatorFunction || loadingFleetsByFunction}
                placeholder={
                  !operatorFunction
                    ? 'Selecione primeiro a função'
                    : loadingFleetsByFunction
                      ? 'Carregando frotas...'
                      : 'Selecione a frota'
                }
                searchPlaceholder="Buscar frota..."
              />
              {fleetsByFunctionError ? (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-destructive">Não foi possível carregar as frotas para a função selecionada.</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => refetchFleetsByFunction()}>Tentar novamente</Button>
                </div>
              ) : (
                !loadingFleetsByFunction && operatorFunction && fleetOptionsForFunction.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma frota ativa encontrada para esta função.</p>
                )
              )}
              {operatorForm.formState.errors.fleet_id && <p className="text-sm text-destructive">{operatorForm.formState.errors.fleet_id.message}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowOperatorModal(false)}>Cancelar</Button>
              <Button type="submit" disabled={loadingFleetsByFunction}>Adicionar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL PRODUTO ─── */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Produto</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); productForm.handleSubmit(handleAddProduct)(e); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Combobox
                options={productOptions}
                value={productForm.watch('product_id')}
                onValueChange={(v) => productForm.setValue('product_id', v)}
                placeholder="Selecione o produto"
                searchPlaceholder="Buscar produto..."
              />
              {productForm.formState.errors.product_id && <p className="text-sm text-destructive">{productForm.formState.errors.product_id.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dose</Label>
                <Input type="number" step="0.0001" {...productForm.register('dose', { onBlur: handleDoseBlur })} />
                {productForm.formState.errors.dose && <p className="text-sm text-destructive">{productForm.formState.errors.dose.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Bomba</Label>
                <Input type="number" step="0.0001" {...productForm.register('pump', { onBlur: handlePumpBlur })} />
                {productForm.formState.errors.pump && <p className="text-sm text-destructive">{productForm.formState.errors.pump.message}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowProductModal(false)}>Cancelar</Button>
              <Button type="submit">Adicionar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL O.S ANTERIOR ─── */}
      <Dialog open={showPreviousOSModal} onOpenChange={setShowPreviousOSModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar O.S Anterior</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); previousOSForm.handleSubmit(handleAddPreviousOS)(e); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Número de O.S</Label>
              <Input {...previousOSForm.register('os_number')} placeholder="Informe o número da O.S" />
              {previousOSForm.formState.errors.os_number && <p className="text-sm text-destructive">{previousOSForm.formState.errors.os_number.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Quantidade Usada</Label>
              <Input type="number" step="0.0001" {...previousOSForm.register('quantity_used')} />
              {previousOSForm.formState.errors.quantity_used && <p className="text-sm text-destructive">{previousOSForm.formState.errors.quantity_used.message}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowPreviousOSModal(false)}>Cancelar</Button>
              <Button type="submit">Adicionar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Confirmar edição"
        description="Você já terminou de preencher todos os dados?"
        confirmLabel="Salvar"
        confirmVariant="success"
        onConfirm={() => {
          setShowConfirmDialog(false);
          handleSubmit(onSubmit)();
        }}
      />

      <ConfirmDialog
        open={showReissueDialog}
        onOpenChange={setShowReissueDialog}
        title="Confirmar reemissão"
        description="Uma nova O.S. será criada vinculada a esta. Deseja continuar?"
        confirmLabel="Reemitir"
        confirmVariant="success"
        onConfirm={() => {
          setShowReissueDialog(false);
          handleSubmit(onReissue)();
        }}
      />
    </form>
  );
}
