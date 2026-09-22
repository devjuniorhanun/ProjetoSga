import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileCode2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvoiceItemsEditor } from '@/components/fiscal/InvoiceItemsEditor';
import { InvoiceInstallmentsEditor } from '@/components/fiscal/InvoiceInstallmentsEditor';
import { XmlImportDialog } from '@/components/fiscal/XmlImportDialog';
import { entryInvoicesService } from '@/lib/api-services-fiscal';
import { useAdministrativeCentersByProducer, useFiscalOptions } from '@/hooks/use-fiscal-options';
import { ENTRY_TYPE_LABELS, FREIGHT_RESPONSIBILITY_LABELS, optionsFrom } from '@/lib/fiscal-labels';
import {
  installmentsAreValid,
  installmentsMatchTotal,
  invoiceTotalPreview,
  isValidAccessKey,
  productsValue,
  validateInvoiceItem,
} from '@/lib/fiscal-rules';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import type {
  EntryInvoice,
  EntryInvoiceFreight,
  EntryInvoiceInstallment,
  EntryInvoiceItem,
  EntryInvoicePayload,
  FiscalEntryType,
  FreightResponsibility,
} from '@/types/fiscal';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryType: FiscalEntryType;
  invoice?: EntryInvoice | null;
}

interface HeaderState {
  supplier_id: string;
  producer_id: string;
  administrative_center_id: string;
  cost_center_id: string;
  crop_id: string;
  access_key: string;
  document_model: string;
  invoice_number: string;
  series: string;
  issue_date: string;
  entry_date: string;
  operation_nature: string;
  freight_value: number;
  insurance_value: number;
  discount_value: number;
  other_expenses_value: number;
  freight_responsibility: FreightResponsibility;
  observation: string;
}

const emptyHeader = (): HeaderState => ({
  supplier_id: '',
  producer_id: '',
  administrative_center_id: '',
  cost_center_id: '',
  crop_id: '',
  access_key: '',
  document_model: '',
  invoice_number: '',
  series: '',
  issue_date: '',
  entry_date: '',
  operation_nature: '',
  freight_value: 0,
  insurance_value: 0,
  discount_value: 0,
  other_expenses_value: 0,
  freight_responsibility: 'NO_FREIGHT',
  observation: '',
});

export function EntryInvoiceFormDialog({ open, onOpenChange, entryType, invoice }: Props) {
  const queryClient = useQueryClient();
  const options = useFiscalOptions();
  const [header, setHeader] = useState<HeaderState>(emptyHeader());
  const [items, setItems] = useState<EntryInvoiceItem[]>([]);
  const [installments, setInstallments] = useState<EntryInvoiceInstallment[]>([]);
  const [freight, setFreight] = useState<EntryInvoiceFreight>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [xmlOpen, setXmlOpen] = useState(false);
  const [entryMethod, setEntryMethod] = useState<'MANUAL' | 'XML_IMPORT'>('MANUAL');

  const administrativeCenters = useAdministrativeCentersByProducer(header.producer_id);

  useEffect(() => {
    if (!open) return;
    if (invoice) {
      setHeader({
        supplier_id: String(invoice.supplier_id ?? ''),
        producer_id: String(invoice.producer_id ?? ''),
        administrative_center_id: String(invoice.administrative_center_id ?? ''),
        cost_center_id: String(invoice.cost_center_id ?? ''),
        crop_id: invoice.crop_id ? String(invoice.crop_id) : '',
        access_key: invoice.access_key ?? '',
        document_model: invoice.document_model ?? '',
        invoice_number: invoice.invoice_number ?? '',
        series: invoice.series ?? '',
        issue_date: invoice.issue_date?.slice(0, 10) ?? '',
        entry_date: invoice.entry_date?.slice(0, 10) ?? '',
        operation_nature: invoice.operation_nature ?? '',
        freight_value: invoice.freight_value ?? 0,
        insurance_value: invoice.insurance_value ?? 0,
        discount_value: invoice.discount_value ?? 0,
        other_expenses_value: invoice.other_expenses_value ?? 0,
        freight_responsibility: invoice.freight_responsibility ?? 'NO_FREIGHT',
        observation: invoice.observation ?? '',
      });
      setItems(
        (invoice.items ?? []).map((item) => ({
          ...item,
          destinations:
            entryType === 'SEED'
              ? (item.seed_lots ?? []).map((lot) => ({
                  ...lot,
                  batch: lot.lot_number ?? lot.batch,
                }))
              : item.allocations ?? item.destinations ?? [],
        })),
      );
      setInstallments(invoice.installments ?? []);
      setFreight(invoice.freights?.[0] ?? invoice.freight ?? {});
      setEntryMethod(invoice.entry_method === 'XML_IMPORT' ? 'XML_IMPORT' : 'MANUAL');
    } else {
      setHeader(emptyHeader());
      setItems([]);
      setInstallments([]);
      setFreight({});
      setEntryMethod('MANUAL');
    }
    setFieldErrors({});
  }, [open, invoice, entryType]);

  const productsTotal = useMemo(() => productsValue(items), [items]);
  const invoiceTotal = useMemo(
    () =>
      invoiceTotalPreview({
        products_value: productsTotal,
        freight_value: header.freight_value,
        insurance_value: header.insurance_value,
        discount_value: header.discount_value,
        other_expenses_value: header.other_expenses_value,
      }),
    [productsTotal, header],
  );

  const setField = (name: keyof HeaderState, value: string | number) => {
    setHeader((prev) => {
      const next = { ...prev, [name]: value } as HeaderState;
      if (name === 'producer_id' && prev.producer_id !== value) next.administrative_center_id = '';
      return next;
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!header.supplier_id) errors.supplier_id = 'Fornecedor obrigatório.';
    if (!header.producer_id) errors.producer_id = 'Produtor obrigatório.';
    if (!header.administrative_center_id) errors.administrative_center_id = 'Centro administrativo obrigatório.';
    if (!header.cost_center_id) errors.cost_center_id = 'Centro de custo obrigatório.';
    if (!header.invoice_number) errors.invoice_number = 'Número da nota obrigatório.';
    if (!header.issue_date) errors.issue_date = 'Data de emissão obrigatória.';
    if (!header.entry_date) errors.entry_date = 'Data de entrada obrigatória.';
    if (header.access_key && !isValidAccessKey(header.access_key)) {
      errors.access_key = 'A chave de acesso deve ter 44 dígitos.';
    }
    if (!items.length) errors.items = 'Informe ao menos um item.';
    items.forEach((item, index) => {
      const result = validateInvoiceItem(entryType, item);
      if (!result.valid) errors.items = `Item ${index + 1}: ${result.errors[0]}`;
    });
    if (installments.length) {
      // Cada parcela vira uma conta paga, e toda conta paga exige safra.
      if (!header.crop_id) errors.crop_id = 'Safra obrigatória para gerar as parcelas financeiras.';
      if (!installmentsAreValid(installments)) errors.installments = 'Preencha documento, vencimento e valor das parcelas.';
      else if (!installmentsMatchTotal(installments, invoiceTotal)) {
        errors.installments = 'A soma das parcelas deve ser igual ao total da nota.';
      }
    }
    if (header.freight_responsibility === 'FARM_PAYABLE') {
      if (!freight.supplier_id) errors.freight = 'Informe a transportadora do frete a pagar.';
      else if (!freight.product_id) errors.freight = 'Informe o produto transportado.';
      else if (!freight.value_per_ton) errors.freight = 'Informe o valor por tonelada.';
      else if (!freight.invoice_weight) errors.freight = 'Informe o peso da nota.';
      else if (!freight.crop_id) errors.freight = 'Informe a safra do frete.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const payloadItems = items.map(({ destinations, ...item }) => ({
    ...item,
    other_expenses_value: item.addition_value ?? 0,
    allocations:
      entryType === 'SEED'
        ? undefined
        : destinations.map((destination) => ({
            stock_location_id: destination.stock_location_id,
            plot_field_id: destination.plot_field_id,
            fuel_station_id: destination.fuel_station_id,
            batch: destination.batch || '',
            manufacturing_date: destination.manufacturing_date || null,
            expiration_date: destination.expiration_date || null,
            quantity: destination.quantity,
          })),
    seed_lots:
      entryType === 'SEED'
        ? destinations.map((lot) => ({
            culture_id: lot.culture_id,
            variety_culture_id: lot.variety_culture_id,
            stock_location_id: lot.stock_location_id,
            lot_number: lot.batch,
            sieve: lot.sieve,
            quantity: lot.quantity,
            unit: item.unit,
            manufacturing_date: lot.manufacturing_date || null,
            expiration_date: lot.expiration_date || null,
          }))
        : undefined,
  }));

  const buildPayload = (): EntryInvoicePayload => ({
    entry_type: entryType,
    entry_method: entryMethod,
    supplier_id: header.supplier_id,
    producer_id: header.producer_id,
    administrative_center_id: header.administrative_center_id,
    cost_center_id: header.cost_center_id,
    crop_id: header.crop_id || null,
    access_key: header.access_key || null,
    document_model: header.document_model || null,
    invoice_number: header.invoice_number,
    series: header.series || null,
    issue_date: header.issue_date,
    entry_date: header.entry_date,
    operation_nature: header.operation_nature || null,
    products_value: productsTotal,
    freight_value: header.freight_value,
    insurance_value: header.insurance_value,
    discount_value: header.discount_value,
    other_expenses_value: header.other_expenses_value,
    invoice_total: invoiceTotal,
    freight_responsibility: header.freight_responsibility,
    observation: header.observation || null,
    items: payloadItems,
    installments,
    freights:
      header.freight_responsibility === 'FARM_PAYABLE'
        ? [
            {
              product_id: String(freight.product_id),
              crop_id: String(freight.crop_id),
              carrier_id: String(freight.supplier_id),
              freight_rate_id: freight.freight_rate_id || null,
              driver_name: freight.driver_name || null,
              driver_cpf: freight.driver_document || null,
              driver_phone: freight.driver_phone || null,
              vehicle_plate: freight.plate || null,
              invoice_weight: Number(freight.invoice_weight),
              value_per_ton: Number(freight.value_per_ton),
            },
          ]
        : [],
  });

  const saveMutation = useMutation({
    mutationFn: (payload: EntryInvoicePayload) =>
      invoice ? entryInvoicesService.update(invoice.id, payload) : entryInvoicesService.create(payload),
    onSuccess: () => {
      toast.success(invoice ? 'Nota atualizada.' : 'Nota criada como rascunho.');
      queryClient.invalidateQueries({ queryKey: ['entry-invoices'] });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const response = (error as { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } } })
        .response;
      if (response?.status === 422 && response.data?.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(response.data.errors).forEach(([key, messages]) => {
          mapped[key] = messages?.[0] ?? 'Campo inválido.';
        });
        setFieldErrors(mapped);
        toast.error('Revise os campos destacados.');
        return;
      }
      toast.error(response?.data?.message ?? 'Não foi possível salvar a nota.');
    },
  });

  const submit = () => {
    if (!validate()) return;
    saveMutation.mutate(buildPayload());
  };

  const error = (name: string) => fieldErrors[name];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {invoice ? 'Editar nota' : 'Nova nota'} — {ENTRY_TYPE_LABELS[entryType]}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[72vh] overflow-y-auto pr-1">
          <Tabs defaultValue="header">
            <TabsList className="w-full">
              <TabsTrigger value="header" className="flex-1">Nota</TabsTrigger>
              <TabsTrigger value="items" className="flex-1">Itens</TabsTrigger>
              <TabsTrigger value="installments" className="flex-1">Parcelas</TabsTrigger>
              <TabsTrigger value="freight" className="flex-1">Frete</TabsTrigger>
            </TabsList>

            <TabsContent value="header" className="space-y-4 pt-3">
              {!invoice && (
                <Button type="button" variant="outline" onClick={() => setXmlOpen(true)}>
                  <FileCode2 className="mr-2 h-4 w-4" /> Importar XML
                </Button>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fornecedor</Label>
                  <Combobox
                    options={options.supplierOptions}
                    value={header.supplier_id}
                    onValueChange={(v) => setField('supplier_id', v)}
                    placeholder="Selecione"
                  />
                  {error('supplier_id') && <p className="text-sm text-destructive">{error('supplier_id')}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Produtor</Label>
                  <Combobox
                    options={options.producerOptions}
                    value={header.producer_id}
                    onValueChange={(v) => setField('producer_id', v)}
                    placeholder="Selecione"
                  />
                  {error('producer_id') && <p className="text-sm text-destructive">{error('producer_id')}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Centro administrativo</Label>
                  <Combobox
                    options={(administrativeCenters.data ?? []).map((c) => ({
                      value: String(c.id),
                      label: c.farm_name || c.cei || String(c.id),
                    }))}
                    value={header.administrative_center_id}
                    onValueChange={(v) => setField('administrative_center_id', v)}
                    placeholder={header.producer_id ? 'Selecione' : 'Escolha o produtor'}
                    disabled={!header.producer_id}
                  />
                  {error('administrative_center_id') && (
                    <p className="text-sm text-destructive">{error('administrative_center_id')}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Centro de custo</Label>
                  <Combobox
                    options={options.costCenterOptions}
                    value={header.cost_center_id}
                    onValueChange={(v) => setField('cost_center_id', v)}
                    placeholder="Selecione"
                  />
                  {error('cost_center_id') && <p className="text-sm text-destructive">{error('cost_center_id')}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Safra</Label>
                  <Combobox
                    options={options.cropOptions}
                    value={header.crop_id}
                    onValueChange={(v) => {
                      setField('crop_id', v);
                      // O frete acompanha a safra da nota quando ainda não foi definido.
                      setFreight((prev) => ({ ...prev, crop_id: prev.crop_id || v || null }));
                    }}
                    placeholder="Selecione a safra"
                  />
                  {fieldErrors.crop_id && <p className="text-sm text-destructive">{fieldErrors.crop_id}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Natureza da operação</Label>
                  <Input value={header.operation_nature} onChange={(e) => setField('operation_nature', e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Chave de acesso</Label>
                <Input
                  value={header.access_key}
                  maxLength={44}
                  onChange={(e) => setField('access_key', e.target.value.replace(/\D/g, ''))}
                  placeholder="44 dígitos"
                />
                {error('access_key') && <p className="text-sm text-destructive">{error('access_key')}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Input value={header.document_model} onChange={(e) => setField('document_model', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input value={header.invoice_number} onChange={(e) => setField('invoice_number', e.target.value)} />
                  {error('invoice_number') && <p className="text-sm text-destructive">{error('invoice_number')}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Série</Label>
                  <Input value={header.series} onChange={(e) => setField('series', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Responsabilidade do frete</Label>
                  <Combobox
                    options={optionsFrom(FREIGHT_RESPONSIBILITY_LABELS)}
                    value={header.freight_responsibility}
                    onValueChange={(v) => setField('freight_responsibility', v)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Emissão</Label>
                  <Input type="date" value={header.issue_date} onChange={(e) => setField('issue_date', e.target.value)} />
                  {error('issue_date') && <p className="text-sm text-destructive">{error('issue_date')}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Entrada</Label>
                  <Input type="date" value={header.entry_date} onChange={(e) => setField('entry_date', e.target.value)} />
                  {error('entry_date') && <p className="text-sm text-destructive">{error('entry_date')}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Frete (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={header.freight_value}
                    onChange={(e) => setField('freight_value', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Seguro (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={header.insurance_value}
                    onChange={(e) => setField('insurance_value', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Desconto (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={header.discount_value}
                    onChange={(e) => setField('discount_value', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Outras despesas (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={header.other_expenses_value}
                    onChange={(e) => setField('other_expenses_value', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Produtos</Label>
                  <Input readOnly className="bg-muted" value={formatCurrencyBRL(productsTotal)} />
                </div>
                <div className="space-y-2">
                  <Label>Total da nota</Label>
                  <Input readOnly className="bg-muted" value={formatCurrencyBRL(invoiceTotal)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observação</Label>
                <Textarea value={header.observation} onChange={(e) => setField('observation', e.target.value)} />
              </div>
            </TabsContent>

            <TabsContent value="items" className="space-y-3 pt-3">
              <InvoiceItemsEditor entryType={entryType} items={items} onChange={setItems} />
              {error('items') && <p className="text-sm text-destructive">{error('items')}</p>}
            </TabsContent>

            <TabsContent value="installments" className="space-y-3 pt-3">
              <InvoiceInstallmentsEditor
                installments={installments}
                invoiceTotal={invoiceTotal}
                onChange={setInstallments}
              />
              {error('installments') && <p className="text-sm text-destructive">{error('installments')}</p>}
              <p className="text-xs text-muted-foreground">
                Cada parcela confirmada gera uma conta a pagar no financeiro.
              </p>
            </TabsContent>

            <TabsContent value="freight" className="space-y-4 pt-3">
              {header.freight_responsibility !== 'FARM_PAYABLE' ? (
                <p className="text-sm text-muted-foreground">
                  {FREIGHT_RESPONSIBILITY_LABELS[header.freight_responsibility]} — nenhum dado adicional é necessário.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Produto</Label>
                    <Combobox
                      options={options.productOptions}
                      value={freight.product_id ?? ''}
                      onValueChange={(v) => setFreight((prev) => ({ ...prev, product_id: v }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Safra</Label>
                    <Combobox
                      options={options.cropOptions}
                      value={freight.crop_id ?? ''}
                      onValueChange={(v) => setFreight((prev) => ({ ...prev, crop_id: v }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Transportadora</Label>
                    <Combobox
                      options={options.supplierOptions}
                      value={freight.supplier_id ?? ''}
                      onValueChange={(v) => setFreight((prev) => ({ ...prev, supplier_id: v }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tarifa (opcional)</Label>
                    <Combobox
                      options={options.freightRates
                        .filter(
                          (rate) =>
                            (!freight.supplier_id || String(rate.supplier_id) === String(freight.supplier_id)) &&
                            (!freight.product_id || String(rate.product_id) === String(freight.product_id)),
                        )
                        .map((rate) => ({
                          value: String(rate.id),
                          label: `${rate.product_name ?? rate.product_id} — ${formatCurrencyBRL(rate.value_per_ton)}/t`,
                        }))}
                      value={freight.freight_rate_id ?? ''}
                      onValueChange={(v) => {
                        const rate = options.freightRates.find((r) => String(r.id) === v);
                        setFreight((prev) => ({
                          ...prev,
                          freight_rate_id: v,
                          value_per_ton: rate?.value_per_ton ?? prev.value_per_ton,
                        }));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Motorista</Label>
                    <Input
                      value={freight.driver_name ?? ''}
                      onChange={(e) => setFreight((prev) => ({ ...prev, driver_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input
                      value={freight.driver_document ?? ''}
                      onChange={(e) => setFreight((prev) => ({ ...prev, driver_document: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={freight.driver_phone ?? ''}
                      onChange={(e) => setFreight((prev) => ({ ...prev, driver_phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Placa</Label>
                    <Input
                      value={freight.plate ?? ''}
                      onChange={(e) => setFreight((prev) => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Peso da nota (kg)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={freight.invoice_weight ?? 0}
                      onChange={(e) => setFreight((prev) => ({ ...prev, invoice_weight: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor por tonelada</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={freight.value_per_ton ?? 0}
                      onChange={(e) => setFreight((prev) => ({ ...prev, value_per_ton: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              )}
              {error('freight') && <p className="text-sm text-destructive">{error('freight')}</p>}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={saveMutation.isPending}>
            {invoice ? 'Salvar' : 'Criar rascunho'}
          </Button>
        </div>

        <XmlImportDialog
          open={xmlOpen}
          onOpenChange={setXmlOpen}
          onUse={(preview) => {
            setEntryMethod('XML_IMPORT');
            setHeader((prev) => ({
              ...prev,
              access_key: preview.access_key ?? prev.access_key,
              invoice_number: preview.invoice_number ?? prev.invoice_number,
              series: preview.series ?? prev.series,
              issue_date: preview.issue_date?.slice(0, 10) ?? prev.issue_date,
              supplier_id: preview.supplier_id ? String(preview.supplier_id) : prev.supplier_id,
            }));
            setItems(
              preview.items.map((item) => ({
                product_id: String(item.product_id ?? ''),
                product_name: item.product_name ?? undefined,
                supplier_product_code: item.supplier_product_code ?? null,
                description: item.description,
                ncm: item.ncm ?? null,
                cfop: item.cfop ?? null,
                unit: item.unit ?? '',
                quantity: item.quantity,
                unit_value: item.unit_value,
                discount_value: 0,
                addition_value: 0,
                destinations: [],
              })),
            );
            toast.info('Dados do XML carregados. Informe os destinos de cada item antes de salvar.');
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
