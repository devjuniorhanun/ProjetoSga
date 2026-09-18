import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fiscalFreightsService, freightPaymentsService } from '@/lib/api-services-fiscal';
import { useFiscalOptions } from '@/hooks/use-fiscal-options';
import { freightPaymentValueIsValid, roundMoney } from '@/lib/fiscal-rules';
import { freightsShareSameCrop, SAME_CROP_FREIGHT_MESSAGE } from '@/lib/report-rules';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import { formatDateBR } from '@/lib/grain-format';
import type { FreightPayment } from '@/types/fiscal';

export default function FreightPaymentsPage() {
  const queryClient = useQueryClient();
  const options = useFiscalOptions();
  const [formOpen, setFormOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [typePayAccountId, setTypePayAccountId] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [observation, setObservation] = useState('');
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['freight-payments'],
    queryFn: () => freightPaymentsService.list({ per_page: 25 }),
  });

  const { data: freights } = useQuery({
    queryKey: ['fiscal-freights', 'payable', supplierId, productId],
    queryFn: () =>
      fiscalFreightsService.list({
        supplier_id: supplierId || undefined,
        product_id: productId || undefined,
        per_page: 100,
      }),
    enabled: formOpen && !!supplierId,
  });

  const openFreights = (freights?.items ?? []).filter((freight) => (freight.balance_value ?? 0) > 0);

  const total = useMemo(
    () => roundMoney(Object.values(selected).reduce((sum, value) => sum + (Number(value) || 0), 0)),
    [selected],
  );

  const createMutation = useMutation({
    mutationFn: () =>
      freightPaymentsService.create({
        supplier_id: supplierId,
        product_id: productId || null,
        payment_date: paymentDate,
        type_pay_account_id: typePayAccountId || null,
        document_number: documentNumber || null,
        observation: observation || null,
        items: Object.entries(selected)
          .filter(([, value]) => value > 0)
          .map(([entry_invoice_id, value]) => ({ entry_invoice_id, value })),
      }),
    onSuccess: () => {
      toast.success('Pagamento de frete registrado. A conta a pagar foi criada no financeiro.');
      setFormOpen(false);
      setSelected({});
      queryClient.invalidateQueries({ queryKey: ['freight-payments'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-freights'] });
      queryClient.invalidateQueries({ queryKey: ['pay-accounts'] });
    },
    onError: (error: unknown) => {
      const response = (error as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } }).response;
      if (response?.status === 422 && response.data?.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(response.data.errors).forEach(([key, messages]) => {
          mapped[key] = messages?.[0] ?? 'Campo inválido.';
        });
        setErrors(mapped);
        toast.error('Revise os campos destacados.');
        return;
      }
      toast.error('Não foi possível registrar o pagamento.');
    },
  });

  const validate = () => {
    const next: Record<string, string> = {};
    if (!supplierId) next.supplier_id = 'Selecione a transportadora.';
    if (!paymentDate) next.payment_date = 'Informe a data do pagamento.';
    const entries = Object.entries(selected).filter(([, value]) => value > 0);
    if (!entries.length) next.items = 'Selecione ao menos uma nota e informe o valor.';
    entries.forEach(([invoiceId, value]) => {
      const freight = openFreights.find((f) => String(f.entry_invoice_id) === invoiceId);
      if (freight && !freightPaymentValueIsValid(freight.balance_value ?? 0, value)) {
        next.items = 'Há valores acima do saldo da nota.';
      }
    });
    // Um pagamento não pode misturar fretes de safras diferentes.
    const selectedCrops = entries.map(([invoiceId]) =>
      openFreights.find((f) => String(f.entry_invoice_id) === invoiceId)?.crop_id ?? null,
    );
    if (entries.length && !freightsShareSameCrop(selectedCrops)) {
      next.items = SAME_CROP_FREIGHT_MESSAGE;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pagamentos de Frete</h1>
          <p className="mt-1 text-muted-foreground">
            Selecione as notas da transportadora e pague total ou parcialmente. Cada pagamento gera uma conta no financeiro.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelected({});
            setErrors({});
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo pagamento
        </Button>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable<FreightPayment>
          data={data?.items ?? []}
          exportTitle="Pagamentos de Frete"
          searchKeys={['carrier_name', 'product_name']}
          columns={[
            { key: 'payment_date', label: 'Data', render: (p) => formatDateBR(p.payment_date) },
            { key: 'carrier_name', label: 'Transportadora', render: (p) => p.carrier_name ?? p.supplier_id },
            { key: 'product_name', label: 'Produto', render: (p) => p.product_name ?? '-' },
            { key: 'total_value', label: 'Valor', render: (p) => formatCurrencyBRL(p.total_value ?? 0) },
          ]}
        />
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo pagamento de frete</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transportadora</Label>
                <Combobox
                  options={options.supplierOptions}
                  value={supplierId}
                  onValueChange={(v) => {
                    setSupplierId(v);
                    setSelected({});
                  }}
                  placeholder="Selecione"
                />
                {errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id}</p>}
              </div>
              <div className="space-y-2">
                <Label>Produto (opcional)</Label>
                <Combobox
                  options={[{ value: '', label: 'Todos' }, ...options.productOptions]}
                  value={productId}
                  onValueChange={(v) => {
                    setProductId(v);
                    setSelected({});
                  }}
                  placeholder="Todos"
                />
              </div>
              <div className="space-y-2">
                <Label>Data do pagamento</Label>
                <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                {errors.payment_date && <p className="text-sm text-destructive">{errors.payment_date}</p>}
              </div>
              <div className="space-y-2">
                <Label>Tipo de pagamento</Label>
                <Combobox
                  options={options.typePayAccountOptions}
                  value={typePayAccountId}
                  onValueChange={setTypePayAccountId}
                  placeholder="Selecione"
                />
              </div>
              <div className="space-y-2">
                <Label>Documento</Label>
                <Input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Nota</TableHead>
                    <TableHead>Safra</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Pagar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!supplierId ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                        Selecione a transportadora para listar as notas
                      </TableCell>
                    </TableRow>
                  ) : openFreights.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                        Nenhuma nota com saldo em aberto
                      </TableCell>
                    </TableRow>
                  ) : (
                    openFreights.map((freight) => {
                      const invoiceId = String(freight.entry_invoice_id);
                      const value = selected[invoiceId] ?? 0;
                      const checked = invoiceId in selected;
                      const invalid = value > 0 && !freightPaymentValueIsValid(freight.balance_value ?? 0, value);
                      return (
                        <TableRow key={invoiceId}>
                          <TableCell>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(state) =>
                                setSelected((prev) => {
                                  const next = { ...prev };
                                  if (state) next[invoiceId] = freight.balance_value ?? 0;
                                  else delete next[invoiceId];
                                  return next;
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>{freight.entry_invoice_id}</TableCell>
                          <TableCell>{freight.crop_name ?? '-'}</TableCell>
                          <TableCell className="text-right">{formatCurrencyBRL(freight.total_value ?? 0)}</TableCell>
                          <TableCell className="text-right">{formatCurrencyBRL(freight.balance_value ?? 0)}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              className={invalid ? 'border-destructive text-right' : 'text-right'}
                              disabled={!checked}
                              value={value}
                              onChange={(e) =>
                                setSelected((prev) => ({ ...prev, [invoiceId]: Number(e.target.value) }))
                              }
                            />
                            {invalid && <p className="text-xs text-destructive">Acima do saldo.</p>}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            {errors.items && <p className="text-sm text-destructive">{errors.items}</p>}
            <p className="text-right font-medium">Total do pagamento: {formatCurrencyBRL(total)}</p>

            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea value={observation} onChange={(e) => setObservation(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => validate() && createMutation.mutate()}
            >
              Registrar pagamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
