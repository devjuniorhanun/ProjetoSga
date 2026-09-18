import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { DataTable } from '@/components/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  TransporterSupplierSummary,
  HarvestAdvance,
  harvestAdvancesService,
} from '@/lib/api-services-harvest';
import {
  buildTransporterAdvancePayload,
  formatBags,
  harvestAdvanceInvalidationKeys,
  isTransporterAdvanceValueValid,
} from '@/lib/harvest-rules';
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
  producer_id: z.string().min(1, 'Produtor obrigatório'),
  administrative_center_id: z.string().min(1, 'Centro administrativo obrigatório'),
  type_pay_account_id: z.string().min(1, 'Forma de pagamento obrigatória'),
  document_number: z.string().trim().min(1, 'Documento obrigatório'),
  document_date: z.string().min(1, 'Data do documento obrigatória'),
  due_date: z.string().min(1, 'Vencimento obrigatório'),
  value: z.coerce.number().gt(0, 'Valor deve ser maior que zero'),
  observation: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const today = () => new Date().toISOString().slice(0, 10);

export default function TransporterAdvancesPage() {
  const queryClient = useQueryClient();
  const { can } = useGrainPermissions();
  const canCreate = can('harvest.advance.create');

  const [cropId, setCropId] = useState('');
  const [producerFilter, setProducerFilter] = useState('');
  const [selected, setSelected] = useState<TransporterSupplierSummary | null>(null);
  const [valueDisplay, setValueDisplay] = useState('');

  const { data: crops = [] } = useQuery({ queryKey: ['crops'], queryFn: cropsService.getAll });
  const { data: producers = [] } = useQuery({ queryKey: ['producers'], queryFn: producersService.getAll });
  const { data: typePayAccounts = [] } = useQuery({
    queryKey: ['type-pay-accounts'],
    queryFn: typePayAccountsService.getAll,
  });

  const activeCrops = crops.filter((c) => c.status === 'A');
  const defaultCropId = activeCrops[0]?.id ?? '';

  useEffect(() => {
    if (!cropId && defaultCropId) setCropId(defaultCropId);
  }, [defaultCropId, cropId]);

  const { data: summaries = [], isFetching: summariesLoading } = useQuery({
    queryKey: ['harvest-transporter-suppliers', cropId],
    queryFn: () => harvestAdvancesService.transporterSuppliers(cropId),
    enabled: Boolean(cropId),
  });

  const { data: advances = [], isLoading } = useQuery({
    queryKey: ['harvest-advances', 'TRANSPORTER', cropId, producerFilter],
    queryFn: () =>
      harvestAdvancesService.list({
        advance_type: 'TRANSPORTER',
        crop_id: cropId || undefined,
        producer_id: producerFilter || undefined,
      }),
  });

  const { register, handleSubmit, setValue, watch, reset, setError, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      producer_id: '',
      administrative_center_id: '',
      type_pay_account_id: '',
      document_date: today(),
      due_date: today(),
      value: 0,
    },
  });

  const producerId = watch('producer_id');
  const { data: administrativeCenters = [] } = useQuery({
    queryKey: ['administrative-centers', producerId],
    queryFn: () => getAdministrativeCentersByProducer(producerId),
    enabled: Boolean(producerId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildTransporterAdvancePayload>) =>
      harvestAdvancesService.create(payload),
  });

  const onSubmit = async (data: FormData) => {
    if (!selected || createMutation.isPending) return;
    if (!isTransporterAdvanceValueValid(data.value, selected.open_value)) {
      setError('value', { message: 'Valor acima do saldo em aberto do transportador.' });
      return;
    }
    try {
      await createMutation.mutateAsync(
        buildTransporterAdvancePayload({
          ...data,
          crop_id: cropId,
          supplier_id: selected.supplier_id,
        } as Parameters<typeof buildTransporterAdvancePayload>[0]),
      );

      toast.success('Adiantamento de transportador lançado.');
      harvestAdvanceInvalidationKeys('TRANSPORTER', cropId).forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      );
      setSelected(null);
      setValueDisplay('');
      reset();
    } catch (error) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao criar adiantamento.' });
    }
  };

  const summaryColumns = [
    { key: 'supplier_name', label: 'Transportador' },
    {
      key: 'total_gross_bags',
      label: 'Total de Sacas Brutas',
      render: (i: TransporterSupplierSummary) => formatBags(Number(i.total_gross_bags), 2),
    },
    {
      key: 'total_shipping_value',
      label: 'Valor Total do Frete',
      render: (i: TransporterSupplierSummary) => formatCurrencyBRL(Number(i.total_shipping_value)),
    },
    {
      key: 'paid_value',
      label: 'Valor Já Pago',
      render: (i: TransporterSupplierSummary) => formatCurrencyBRL(Number(i.paid_value)),
    },
    {
      key: 'open_value',
      label: 'Saldo em Aberto',
      render: (i: TransporterSupplierSummary) =>
        Number(i.open_value) > 0 ? (
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            {formatCurrencyBRL(Number(i.open_value))}
          </Badge>
        ) : (
          <Badge variant="secondary">{formatCurrencyBRL(Number(i.open_value))}</Badge>
        ),
    },
  ];

  const advanceColumns = [
    { key: 'document_number', label: 'Documento' },
    { key: 'document_date', label: 'Data', render: (i: HarvestAdvance) => formatDate(i.document_date) },
    { key: 'due_date', label: 'Vencimento', render: (i: HarvestAdvance) => formatDate(i.due_date) },
    { key: 'crop_name', label: 'Safra', render: (i: HarvestAdvance) => i.crop_name || '' },
    { key: 'supplier_name', label: 'Transportador', render: (i: HarvestAdvance) => i.supplier_name || '' },
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
      <div>
        <h1 className="text-2xl font-bold">Adiantamento de Transportador</h1>
        <p className="text-muted-foreground mt-1">
          Pagamentos consolidados por transportador responsável pelos motoristas da safra
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Safra</Label>
          <Combobox
            options={activeCrops.map((c) => ({ value: c.id, label: c.name }))}
            value={cropId}
            onValueChange={setCropId}
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
            value={producerFilter}
            onValueChange={setProducerFilter}
            placeholder="Todos"
            searchPlaceholder="Buscar produtor..."
          />
        </div>
      </div>

      {cropId && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Transportadores da safra</h2>
          {summariesLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando transportadores...
            </div>
          ) : summaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum transportador elegível nesta safra.</p>
          ) : (
            <DataTable
              data={summaries}
              columns={summaryColumns}
              searchKeys={['supplier_name']}
              searchPlaceholder="Buscar transportador..."
              actions={(item) => (
                <Button
                  size="sm"
                  disabled={Number(item.open_value) <= 0 || !canCreate}
                  onClick={() => {
                    setSelected(item);
                    setValueDisplay('');
                    reset({
                      producer_id: '',
                      administrative_center_id: '',
                      type_pay_account_id: '',
                      document_number: '',
                      document_date: today(),
                      due_date: today(),
                      value: 0,
                      observation: '',
                    });
                  }}
                >
                  Realizar adiantamento
                </Button>
              )}
            />
          )}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Adiantamentos realizados</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            data={advances}
            columns={advanceColumns}
            searchKeys={['document_number', 'supplier_name', 'producer_name']}
            searchPlaceholder="Buscar adiantamento..."
          />
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adiantamento de Transportador — {selected?.supplier_name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="mb-4 grid grid-cols-2 gap-3 rounded-md border bg-muted/40 p-3 text-sm md:grid-cols-4">
              <div>
                <p className="text-muted-foreground">Sacas brutas</p>
                <p className="font-medium">{formatBags(Number(selected.total_gross_bags), 2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Frete total</p>
                <p className="font-medium">{formatCurrencyBRL(Number(selected.total_shipping_value))}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Já pago</p>
                <p className="font-medium">{formatCurrencyBRL(Number(selected.paid_value))}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Saldo em aberto</p>
                <p className="font-medium">{formatCurrencyBRL(Number(selected.open_value))}</p>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                <Input {...register('document_number')} placeholder="ADT-001" />
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
              <Button type="button" variant="outline" onClick={() => setSelected(null)}>
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
