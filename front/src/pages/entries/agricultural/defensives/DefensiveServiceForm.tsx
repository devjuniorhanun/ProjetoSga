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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AgriculturalDefensiveOrder,
  AgriculturalDefensiveOrderField,
  AgriculturalDefensiveOrderOperator,
  AgriculturalDefensiveOrderProduct,
  defensiveOrdersService,
} from '@/lib/api-services-entries';
import { cropsService } from '@/lib/api-services';
import { typeOperationsService } from '@/lib/api-services-agricultural';
import { agriculturalOperatorsService } from '@/lib/api-services-agricultural';
import { fieldsService } from '@/lib/api-services';
import { productsService } from '@/lib/api-services-products';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react';
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
  observation: z.string().optional().or(z.literal('')),
  status: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

const fieldSchema = z.object({
  field_id: z.string().min(1, 'Talhão obrigatório'),
  area: z.coerce.number().min(0, 'Área obrigatória'),
});
type FieldFormData = z.infer<typeof fieldSchema>;

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

interface Props {
  item?: AgriculturalDefensiveOrder | null;
  onSave: () => void;
  onCancel: () => void;
}

export function DefensiveServiceForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const [fields, setFields] = useState<AgriculturalDefensiveOrderField[]>(item?.fields ?? []);
  const [operators, setOperators] = useState<AgriculturalDefensiveOrderOperator[]>(item?.operators ?? []);
  const [products, setProducts] = useState<AgriculturalDefensiveOrderProduct[]>(item?.products ?? []);

  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showOperatorModal, setShowOperatorModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: crops = [], isLoading: l1 } = useQuery({ queryKey: ['crops', 'active-options'], queryFn: () => cropsService.getAll({ status: 'A' }) });
  const [cropCultures, setCropCultures] = useState<{ id: string; name: string }[]>([]);
  const [loadingCropCultures, setLoadingCropCultures] = useState(false);
  const { data: typeOperations = [], isLoading: l3 } = useQuery({ queryKey: ['type-operations', 'active-options'], queryFn: () => typeOperationsService.getAll({ status: 'A' }) });
  const { data: fieldsList = [], isLoading: l4 } = useQuery({ queryKey: ['fields', 'active-options'], queryFn: () => fieldsService.getAll({ status: 'A' }) });
  const { data: agriOperators = [], isLoading: l5 } = useQuery({ queryKey: ['agricultural-operators', 'active-options'], queryFn: () => agriculturalOperatorsService.getAll({ status: 'A' }) });


  const { data: productsList = [], isLoading: l7 } = useQuery({ queryKey: ['products', 'active-options'], queryFn: () => productsService.getAll({ status: 'A' }) });

  const fieldOptions = useMemo(() => fieldsList.filter((f: any) => f.status === undefined || f.status === 'A').map((f) => ({ value: f.id, label: f.name })), [fieldsList]);
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
    if (item?.crop_id) fetchCulturesByCrop(item.crop_id);
  }, []);

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item ? {
      crop_id: item.crop_id,
      culture_id: item.culture_id,
      type_operation_id: item.type_operation_id,
      application_date: item.application_date,
      pump_volume: item.pump_volume,
      flow: item.flow,
      pump_capacity: item.pump_capacity,
      observation: item.observation,
      status: item.status,
    } : {
      pump_volume: 0, flow: 0, pump_capacity: 0,
      observation: '', status: 'A',
    },
  });

  // Blur: flow → pump_capacity = pump_volume / flow
  const handleFlowBlur = () => {
    const pv = watch('pump_volume');
    const fl = watch('flow');
    if (fl > 0) setValue('pump_capacity', Number((pv / fl).toFixed(4)));
  };

  // ----- Field modal -----
  const fieldForm = useForm<FieldFormData>({
    resolver: zodResolver(fieldSchema),
    defaultValues: { area: 0 },
  });

  const [fieldFreeArea, setFieldFreeArea] = useState<number | null>(null);
  const [fieldAreaExceeded, setFieldAreaExceeded] = useState(false);
  const [areaDisplay, setAreaDisplay] = useState('');

  const handleFieldSelect = async (fieldId: string) => {
    if (!fieldId) return;
    setFieldFreeArea(null);
    setFieldAreaExceeded(false);
    try {
      const cropId = watch('crop_id');
      const { data } = await api.get(`/registrations/properties/areas/fields/free_area/${cropId}/${fieldId}`);
      const result = data.data ?? data;
      const freeArea = typeof result === 'number'
        ? result
        : Number(result?.free_area ?? result?.area ?? result?.value ?? NaN);
      if (freeArea != null && !Number.isNaN(freeArea)) {
        setFieldFreeArea(freeArea);
        fieldForm.setValue('area', freeArea);
        setAreaDisplay(formatAreaDisplay(freeArea));
      }
    } catch {
      // silently fail
    }
  };

  const handleFieldAreaBlur = () => {
    const area = fieldForm.getValues('area');
    if (fieldFreeArea != null && area > fieldFreeArea) {
      setFieldAreaExceeded(true);
      fieldForm.setValue('area', fieldFreeArea);
      toast.error(`Área deve ser menor ou igual à área do talhão (${fieldFreeArea}).`);
    } else {
      setFieldAreaExceeded(false);
    }
  };

  const handleAddField = (data: FieldFormData) => {
    if (fieldFreeArea != null && data.area > fieldFreeArea) {
      setFieldAreaExceeded(true);
      toast.error(`Área deve ser menor ou igual à área do talhão (${fieldFreeArea}).`);
      return;
    }
    if (fieldAreaExceeded) return;
    const fieldObj = fieldsList.find((f) => f.id === data.field_id);
    setFields((prev) => [...prev, { field_id: data.field_id, field_name: fieldObj?.name, area: data.area }]);
    setShowFieldModal(false);
    setFieldFreeArea(null);
    setFieldAreaExceeded(false);
    setAreaDisplay('');
    fieldForm.reset({ area: 0 });
  };


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
    productForm.setValue('pump', Number((dose * pumpCapacity).toFixed(4)));
  };

  const handlePumpBlur = () => {
    const pump = productForm.getValues('pump');
    if (pumpCapacity > 0) productForm.setValue('dose', Number((pump / pumpCapacity).toFixed(4)));
  };

  const handleAddProduct = (data: ProductFormData) => {
    const prod = productsList.find((p) => p.id === data.product_id);
    setProducts((prev) => [...prev, { product_id: data.product_id, product_name: prod?.name, dose: data.dose, pump: data.pump }]);
    setShowProductModal(false);
    productForm.reset({ dose: 0, pump: 0 });
  };

  const totalArea = useMemo(() => fields.reduce((sum, f) => sum + Number(f.area || 0), 0), [fields]);
  const recommendedPump = pumpCapacity > 0 ? Number((totalArea / pumpCapacity).toFixed(3)) : 0;

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload = {
        field_id: fields[0]?.field_id,
        area: totalArea,
        crop_id: data.crop_id,
        culture_id: data.culture_id,
        type_operation_id: data.type_operation_id,
        application_date: data.application_date,
        pump_volume: data.pump_volume,
        flow: data.flow,
        pump_capacity: data.pump_capacity,
        recommended_pump: recommendedPump,
        observation: data.observation,
        status: data.status,
        fields: fields.map((f) => ({ field_id: f.field_id, area: f.area })),
        operators: operators.map((o) => ({ operator_id: o.operator_id, fleet_id: o.fleet_id, function: o.function })),
        products: products.map((p) => ({ product_id: p.product_id, dose: p.dose, pump: p.pump })),
      };
      if (item) {
        await defensiveOrdersService.update(item.id, payload as Partial<AgriculturalDefensiveOrder>);
        toast.success('Ordem de Serviço Defensivo atualizada!');
      } else {
        await defensiveOrdersService.create(payload as unknown as Omit<AgriculturalDefensiveOrder, 'id'>);
        toast.success('Ordem de Serviço Defensivo criada!');
      }
      queryClient.invalidateQueries({ queryKey: ['defensive-orders'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally {
      setLoading(false);
    }
  };

  // Validações locais + abertura do diálogo de confirmação.
  // O envio à API só acontece ao clicar em "Salvar" no ConfirmDialog.
  const requestConfirmation = (e?: FormEvent) => {
    e?.preventDefault();
    handleSubmit(() => {
      if (fields.length === 0) {
        toast.error('Adicione pelo menos um talhão.');
        return;
      }
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
            <TabsTrigger value="main" className="flex-1">Ordem de Serviço Defensivo</TabsTrigger>
            <TabsTrigger value="fields" className="flex-1">Talhões</TabsTrigger>
            <TabsTrigger value="operators" className="flex-1">Operadores</TabsTrigger>
            <TabsTrigger value="products" className="flex-1">Produtos</TabsTrigger>
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
                <Label>Bomba Recomendada</Label>
                <Input type="number" value={recommendedPump} className="bg-muted" />
              </div>
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

          {/* ─── ABA TALHÕES ─── */}
          <TabsContent value="fields" className="space-y-4 pt-2">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Talhão</TableHead>
                    <TableHead className="text-right">Área</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Nenhum talhão adicionado</TableCell></TableRow>
                  ) : (
                    fields.map((f, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{f.field_name || f.field_id}</TableCell>
                        <TableCell className="text-right">{f.area}</TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setFields((prev) => prev.filter((_, i) => i !== idx))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <Button type="button" variant="outline" onClick={() => { fieldForm.reset({ area: 0 }); setFieldFreeArea(null); setFieldAreaExceeded(false); setShowFieldModal(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Talhão
            </Button>
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
        </Tabs>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="button" disabled={loading} onClick={() => requestConfirmation()}>
          {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (item ? 'Salvar' : 'Criar')}
        </Button>
      </div>

      {/* ─── MODAL TALHÃO ─── */}
      <Dialog open={showFieldModal} onOpenChange={(open) => { setShowFieldModal(open); if (!open) { setFieldFreeArea(null); setFieldAreaExceeded(false); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Talhão</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); fieldForm.handleSubmit(handleAddField)(e); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Talhão</Label>
              <Combobox
                options={fieldOptions}
                value={fieldForm.watch('field_id')}
                onValueChange={(v) => { fieldForm.setValue('field_id', v); handleFieldSelect(v); }}
                placeholder="Selecione o talhão"
                searchPlaceholder="Buscar talhão..."
              />
              {fieldForm.formState.errors.field_id && <p className="text-sm text-destructive">{fieldForm.formState.errors.field_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Área</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={areaDisplay}
                onChange={(e) => handleAreaMaskChange(e, setAreaDisplay, (v) => fieldForm.setValue('area', v, { shouldValidate: true }))}
                onBlur={handleFieldAreaBlur}
                placeholder="0,00"
              />
              {fieldForm.formState.errors.area && <p className="text-sm text-destructive">{fieldForm.formState.errors.area.message}</p>}
              {fieldAreaExceeded && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    A área deve ser menor ou igual à área livre do talhão ({fieldFreeArea}).
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowFieldModal(false)}>Cancelar</Button>
              <Button type="submit" disabled={fieldAreaExceeded}>Adicionar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title={item ? 'Confirmar edição' : 'Confirmar criação'}
        description="Você já terminou de preencher todos os dados?"
        confirmLabel="Salvar"
        confirmVariant="success"
        onConfirm={() => {
          setShowConfirmDialog(false);
          handleSubmit(onSubmit)();
        }}
      />
    </form>
  );
}
