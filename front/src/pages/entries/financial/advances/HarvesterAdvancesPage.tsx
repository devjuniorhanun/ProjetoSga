import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { DataTable } from '@/components/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { harvestAdvancesService, HarvestAdvance } from '@/lib/api-services-harvest';
import { buildHarvesterAdvancePayload, harvestAdvanceInvalidationKeys } from '@/lib/harvest-rules';
import { cropsService, producersService } from '@/lib/api-services';
import {
  typePayAccountsService,
  PAY_ACCOUNT_STATUS_LABELS,
  PayAccountStatus,
} from '@/lib/api-services-financial-entries';
import { getAdministrativeCentersByProducer } from '@/lib/api-services-financial';
import { formatCurrencyBRL, handleCurrencyMaskChange } from '@/lib/format-helpers';
import { formatDate } from '@/lib/utils';
import { applyApiErrors } from '@/lib/form-errors';
import { useGrainPermissions } from '@/hooks/use-grain-permissions';

const schema = z.object({
  crop_id: z.string().min(1, 'Safra obrigatória'),
  supplier_id: z.string().min(1, 'Fornecedor/colhedor obrigatório'),
  producer_id: z.string().min(1, 'Produtor obrigatório'),
  administrative_center_id: z.string().min(1, 'Centro administrativo obrigatório'),
  type_pay_account_id: z.string().min(1, 'Forma de pagamento obrigatória'),
  document_number: z.string().trim().min(1, 'Documento obrigatório'),
  document_date: z.string().min(1, 'Data do documento obrigatória'),
  due_date: z.string().min(1, 'Vencimento obrigatório'),
  value: z
    .coerce.number()
    .gt(0, 'Valor deve ser maior que zero')
    .refine((v) => Math.round(v * 100) === Number((v * 100).toFixed(0)), 'Valor com no máximo duas casas decimais'),
  observation: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const today = () => new Date().toISOString().slice(0, 10);

export default function HarvesterAdvancesPage() {
  const queryClient = useQueryClient();
  const { can } = useGrainPermissions();
  const canCreate = can('harvest.advance.create');

  const [showForm, setShowForm] = useState(false);
  const [valueDisplay, setValueDisplay] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  const { data: crops = [] } = useQuery({ queryKey: ['crops', 'active-options'], queryFn: () => cropsService.getAll({ status: 'A' }) });
  const { data: producers = [] } = useQuery({ queryKey: ['producers', 'active-options'], queryFn: () => producersService.getAll({ status: 'A' }) });
  const { data: typePayAccounts = [] } = useQuery({
    queryKey: ['type-pay-accounts'],
    queryFn: () => typePayAccountsService.getAll({ status: 'A' }),
  });

  const activeCrops = crops.filter((c) => c.status === 'A');
  const defaultCropId = activeCrops[0]?.id ?? '';

  // A safra ativa é a seleção inicial do filtro.
  useEffect(() => {
    if (!cropFilter && defaultCropId) setCropFilter(defaultCropId);
  }, [defaultCropId, cropFilter]);

  const { data: advances = [], isLoading } = useQuery({
    queryKey: ['harvest-advances', 'HARVESTER', cropFilter, supplierFilter],
    queryFn: () =>
      harvestAdvancesService.list({
        advance_type: 'HARVESTER',
        crop_id: cropFilter || undefined,
        supplier_id: supplierFilter || undefined,
      }),
  });

  const { register, handleSubmit, setValue, watch, reset, setError, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      crop_id: '',
      supplier_id: '',
      producer_id: '',
      administrative_center_id: '',
      type_pay_account_id: '',
      document_date: today(),
      due_date: today(),
      value: 0,
    },
  });

  const cropId = watch('crop_id');
  const producerId = watch('producer_id');

  const { data: harvesters = [], isFetching: harvestersLoading } = useQuery({
    queryKey: ['harvest-eligible-harvesters', cropId],
    queryFn: () => harvestAdvancesService.eligibleHarvesters(cropId),
    enabled: Boolean(cropId) && showForm,
  });

  const { data: administrativeCenters = [] } = useQuery({
    queryKey: ['administrative-centers', producerId],
    queryFn: () => getAdministrativeCentersByProducer(producerId),
    enabled: Boolean(producerId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildHarvesterAdvancePayload>) =>
      harvestAdvancesService.create(payload),
  });

  const openForm = () => {
    reset({
      crop_id: cropFilter || defaultCropId,
      supplier_id: '',
      producer_id: '',
      administrative_center_id: '',
      type_pay_account_id: '',
      document_number: '',
      document_date: today(),
      due_date: today(),
      value: 0,
      observation: '',
    });
    setValueDisplay('');
    setShowForm(true);
  };

  const onSubmit = async (data: FormData) => {
    if (createMutation.isPending) return;
    try {
      await createMutation.mutateAsync(
        buildHarvesterAdvancePayload(data as Parameters<typeof buildHarvesterAdvancePayload>[0]),
      );

      toast.success('Adiantamento de colhedor lançado.');
      harvestAdvanceInvalidationKeys('HARVESTER', data.crop_id).forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      );
      setShowForm(false);
      setValueDisplay('');
      reset();
    } catch (error) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao criar adiantamento.' });
    }
  };

  const columns = [
    { key: 'document_number', label: 'Documento' },
    { key: 'document_date', label: 'Data', render: (i: HarvestAdvance) => formatDate(i.document_date) },
    { key: 'due_date', label: 'Vencimento', render: (i: HarvestAdvance) => formatDate(i.due_date) },
    { key: 'crop_name', label: 'Safra', render: (i: HarvestAdvance) => i.crop_name || '' },
    { key: 'supplier_name', label: 'Fornecedor/Colhedor', render: (i: HarvestAdvance) => i.supplier_name || '' },
    { key: 'producer_name', label: 'Produtor Pagador', render: (i: HarvestAdvance) => i.producer_name || '' },
    {
      key: 'administrative_center_name',
      label: 'Centro Administrativo',
      render: (i: HarvestAdvance) => i.administrative_center_name || '',
    },
    {
      key: 'type_pay_account_name',
      label: 'Forma de Pagamento',
      render: (i: HarvestAdvance) => i.type_pay_account_name || '',
    },
    { key: 'value', label: 'Valor', render: (i: HarvestAdvance) => formatCurrencyBRL(i.value) },
    {
      key: 'status',
      label: 'Status',
      render: (i: HarvestAdvance) =>
        PAY_ACCOUNT_STATUS_LABELS[i.status as PayAccountStatus] ?? i.status ?? '',
    },
    {
      key: 'accounted_for',
      label: 'Contabilizado',
      render: (i: HarvestAdvance) => (i.accounted_for === 'S' ? 'Sim' : 'Não'),
    },
    {
      key: 'description',
      label: 'Descrição',
      render: (i: HarvestAdvance) => i.description || i.observation || '',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Adiantamento de Colhedor</h1>
          <p className="text-muted-foreground mt-1">Adiantamentos pagos aos colhedores da safra</p>
        </div>
        <Button onClick={openForm} disabled={!canCreate}>
          <Plus className="mr-2 h-4 w-4" /> Novo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Safra</Label>
          <Combobox
            options={activeCrops.map((c) => ({ value: c.id, label: c.name }))}
            value={cropFilter}
            onValueChange={setCropFilter}
            placeholder="Selecione a safra"
            searchPlaceholder="Buscar safra..."
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Produtor pagador</Label>
          <Combobox
            options={producers
              .filter((p) => p.status === 'A')
              .map((p) => ({ value: p.id, label: p.owner_name || p.id }))}
            value={supplierFilter}
            onValueChange={setSupplierFilter}
            placeholder="Todos"
            searchPlaceholder="Buscar produtor..."
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          data={advances}
          columns={columns}
          searchKeys={['document_number', 'supplier_name', 'producer_name']}
          searchPlaceholder="Buscar adiantamento..."
        />
      )}

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) setShowForm(false); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Adiantamento de Colhedor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Safra</Label>
                <Combobox
                  options={activeCrops.map((c) => ({ value: c.id, label: c.name }))}
                  value={cropId}
                  onValueChange={(v) => {
                    setValue('crop_id', v, { shouldValidate: true });
                    setValue('supplier_id', '', { shouldValidate: true });
                  }}
                  placeholder="Selecione a safra"
                  searchPlaceholder="Buscar safra..."
                />
                {errors.crop_id && <p className="text-sm text-destructive">{errors.crop_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Fornecedor / Colhedor</Label>
                <Combobox
                  options={harvesters.map((h) => ({
                    value: String(h.supplier_id),
                    label: h.supplier_name || String(h.supplier_id),
                  }))}
                  value={watch('supplier_id')}
                  onValueChange={(v) => setValue('supplier_id', v, { shouldValidate: true })}
                  placeholder={cropId ? 'Selecione o colhedor' : 'Selecione a safra primeiro'}
                  searchPlaceholder="Buscar colhedor..."
                  emptyText={harvestersLoading ? 'Carregando colhedores...' : 'Nenhum colhedor elegível nesta safra'}
                  disabled={!cropId || harvestersLoading}
                />
                {errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Produtor Pagador</Label>
                <Combobox
                  options={producers
                    .filter((p) => p.status === 'A')
                    .map((p) => ({ value: p.id, label: p.owner_name || p.id }))}
                  value={producerId}
                  onValueChange={(v) => {
                    setValue('producer_id', v, { shouldValidate: true });
                    setValue('administrative_center_id', '', { shouldValidate: true });
                  }}
                  placeholder="Selecione o produtor"
                  searchPlaceholder="Buscar produtor..."
                />
                {errors.producer_id && <p className="text-sm text-destructive">{errors.producer_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Centro Administrativo</Label>
                <Combobox
                  options={administrativeCenters
                    .filter((c) => c.status === 'A')
                    .map((c) => ({ value: c.id, label: c.farm_name || c.cei || c.id }))}
                  value={watch('administrative_center_id')}
                  onValueChange={(v) => setValue('administrative_center_id', v, { shouldValidate: true })}
                  placeholder={producerId ? 'Selecione o centro' : 'Selecione o produtor primeiro'}
                  searchPlaceholder="Buscar centro..."
                  disabled={!producerId}
                />
                {errors.administrative_center_id && (
                  <p className="text-sm text-destructive">{errors.administrative_center_id.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Combobox
                  options={typePayAccounts
                    .filter((t) => t.status === 'A')
                    .map((t) => ({ value: t.id, label: `${t.abbreviation} - ${t.name}` }))}
                  value={watch('type_pay_account_id')}
                  onValueChange={(v) => setValue('type_pay_account_id', v, { shouldValidate: true })}
                  placeholder="Selecione a forma"
                  searchPlaceholder="Buscar forma de pagamento..."
                />
                {errors.type_pay_account_id && (
                  <p className="text-sm text-destructive">{errors.type_pay_account_id.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  inputMode="decimal"
                  value={valueDisplay}
                  onChange={(e) =>
                    handleCurrencyMaskChange(e, setValueDisplay, (v) => setValue('value', v, { shouldValidate: true }))
                  }
                  placeholder="R$ 0,00"
                />
                {errors.value && <p className="text-sm text-destructive">{errors.value.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Nº Documento</Label>
                <Input {...register('document_number')} placeholder="ADC-001" />
                {errors.document_number && <p className="text-sm text-destructive">{errors.document_number.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Data do Documento</Label>
                <Input type="date" {...register('document_date')} />
                {errors.document_date && <p className="text-sm text-destructive">{errors.document_date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Input type="date" {...register('due_date')} />
                {errors.due_date && <p className="text-sm text-destructive">{errors.due_date.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea {...register('observation')} rows={2} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !canCreate}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
