import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FiscalStatusBadge } from '@/components/fiscal/FiscalStatusBadge';
import { productOutputsService, inventoryBalancesService } from '@/lib/api-services-inventory-releases';
import { useFiscalOptions } from '@/hooks/use-fiscal-options';
import { OUTPUT_TYPE_LABELS, labelOr, optionsFrom } from '@/lib/fiscal-labels';
import {
  canReturnOutput,
  outputItemPendingQuantity,
  outputTotal,
  returnQuantityIsValid,
} from '@/lib/fiscal-rules';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import { formatDateBR } from '@/lib/grain-format';
import type { ProductOutput, ProductOutputItem, ProductOutputType } from '@/types/fiscal';

const number3 = (value?: number | null) =>
  value == null ? '-' : Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 3 });

export default function ProductOutputsPage() {
  const queryClient = useQueryClient();
  const options = useFiscalOptions();
  const [typeFilter, setTypeFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [confirming, setConfirming] = useState<ProductOutput | null>(null);
  const [returning, setReturning] = useState<ProductOutput | null>(null);

  const [outputType, setOutputType] = useState<ProductOutputType>('SALE');
  const [outputDate, setOutputDate] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [observation, setObservation] = useState('');
  const [items, setItems] = useState<ProductOutputItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [returnDate, setReturnDate] = useState('');
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});

  const params = useMemo(
    () => ({ output_type: typeFilter || undefined, per_page: 25 }),
    [typeFilter],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['product-outputs', params],
    queryFn: () => productOutputsService.list(params),
  });

  const { data: balances } = useQuery({
    queryKey: ['inventory-balances', 'outputs'],
    queryFn: () => inventoryBalancesService.list({ per_page: 200 }),
    enabled: formOpen,
  });

  const stockOptions = (balances?.items ?? []).map((balance) => ({
    value: String(balance.id),
    label: `${balance.product_name ?? balance.product_id} — ${balance.stock_location_name ?? 'sem local'} (${number3(
      balance.available_quantity ?? balance.quantity,
    )})`,
  }));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['product-outputs'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
  };

  const resetForm = () => {
    setOutputType('SALE');
    setOutputDate('');
    setSupplierId('');
    setRecipientName('');
    setExpectedReturnDate('');
    setObservation('');
    setItems([]);
    setErrors({});
  };

  const createMutation = useMutation({
    mutationFn: () =>
      productOutputsService.create({
        output_type: outputType,
        output_date: outputDate,
        supplier_id: supplierId || null,
        recipient_name: recipientName || null,
        expected_return_date: outputType === 'LOAN' ? expectedReturnDate : null,
        observation: observation || null,
        items,
      }),
    onSuccess: () => {
      toast.success('Saída registrada como rascunho.');
      setFormOpen(false);
      resetForm();
      invalidate();
    },
    onError: (error: unknown) => {
      const response = (error as { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } } })
        .response;
      if (response?.status === 422 && response.data?.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(response.data.errors).forEach(([key, messages]) => {
          mapped[key] = messages?.[0] ?? 'Campo inválido.';
        });
        setErrors(mapped);
        toast.error('Revise os campos destacados.');
        return;
      }
      toast.error('Não foi possível registrar a saída.');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => productOutputsService.confirm(id),
    onSuccess: () => {
      toast.success('Saída confirmada. Estoque baixado.');
      setConfirming(null);
      invalidate();
    },
    onError: () => toast.error('Não foi possível confirmar a saída.'),
  });

  const returnMutation = useMutation({
    mutationFn: (output: ProductOutput) =>
      productOutputsService.registerReturn(output.id, {
        return_date: returnDate,
        items: Object.entries(returnQuantities)
          .filter(([, quantity]) => quantity > 0)
          .map(([product_output_item_id, quantity]) => ({ product_output_item_id, quantity })),
      }),
    onSuccess: () => {
      toast.success('Retorno registrado.');
      setReturning(null);
      setReturnQuantities({});
      invalidate();
    },
    onError: () => toast.error('Não foi possível registrar o retorno.'),
  });

  const validate = () => {
    const next: Record<string, string> = {};
    if (!outputDate) next.output_date = 'Informe a data da saída.';
    if (!supplierId && !recipientName) next.recipient_name = 'Informe o fornecedor ou o nome do destinatário.';
    if (outputType === 'LOAN' && !expectedReturnDate) next.expected_return_date = 'Empréstimo exige data prevista de retorno.';
    if (!items.length) next.items = 'Adicione ao menos um item.';
    if (items.some((item) => !item.product_stock_id || !(Number(item.quantity) > 0))) {
      next.items = 'Todos os itens precisam de estoque e quantidade maior que zero.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const returnInvalid = returning
    ? Object.entries(returnQuantities).some(([itemId, quantity]) => {
        const item = returning.items?.find((i) => String(i.id) === itemId);
        return !!item && quantity > 0 && !returnQuantityIsValid(item, quantity);
      }) || !returnDate
    : true;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Saídas de Produtos</h1>
          <p className="mt-1 text-muted-foreground">Vendas, empréstimos e doações. A confirmação baixa o estoque.</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova saída
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Combobox
            options={[{ value: '', label: 'Todos' }, ...optionsFrom(OUTPUT_TYPE_LABELS)]}
            value={typeFilter}
            onValueChange={setTypeFilter}
            placeholder="Todos"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable<ProductOutput>
          data={data?.items ?? []}
          exportTitle="Saídas de Produtos"
          searchKeys={['recipient_name', 'supplier_name', 'output_type']}
          columns={[
            { key: 'output_date', label: 'Data', render: (o) => formatDateBR(o.output_date) },
            { key: 'output_type', label: 'Tipo', render: (o) => labelOr(OUTPUT_TYPE_LABELS, o.output_type) },
            {
              key: 'recipient_name',
              label: 'Destinatário',
              render: (o) => o.supplier_name ?? o.recipient_name ?? '-',
            },
            {
              key: 'expected_return_date',
              label: 'Retorno previsto',
              render: (o) => (o.expected_return_date ? formatDateBR(o.expected_return_date) : '-'),
            },
            { key: 'total_value', label: 'Valor', render: (o) => formatCurrencyBRL(o.total_value ?? 0) },
            { key: 'status', label: 'Situação', render: (o) => <FiscalStatusBadge status={o.status} /> },
          ]}
          actions={(output) => (
            <div className="flex justify-end gap-1">
              {output.status === 'DRAFT' && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setConfirming(output)}>
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
              {canReturnOutput(output.output_type, output.status) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={async () => {
                    const full = await productOutputsService.getById(output.id);
                    setReturning(full);
                    setReturnDate('');
                    setReturnQuantities({});
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        />
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nova saída de produtos</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Combobox
                  options={optionsFrom(OUTPUT_TYPE_LABELS)}
                  value={outputType}
                  onValueChange={(v) => setOutputType(v as ProductOutputType)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data da saída</Label>
                <Input type="date" value={outputDate} onChange={(e) => setOutputDate(e.target.value)} />
                {errors.output_date && <p className="text-sm text-destructive">{errors.output_date}</p>}
              </div>
              <div className="space-y-2">
                <Label>Fornecedor (opcional)</Label>
                <Combobox
                  options={[{ value: '', label: 'Nenhum' }, ...options.supplierOptions]}
                  value={supplierId}
                  onValueChange={setSupplierId}
                  placeholder="Nenhum"
                />
              </div>
              <div className="space-y-2">
                <Label>Nome do destinatário</Label>
                <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                {errors.recipient_name && <p className="text-sm text-destructive">{errors.recipient_name}</p>}
              </div>
              {outputType === 'LOAN' && (
                <div className="space-y-2">
                  <Label>Retorno previsto</Label>
                  <Input
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                  />
                  {errors.expected_return_date && (
                    <p className="text-sm text-destructive">{errors.expected_return_date}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Itens</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setItems((prev) => [...prev, { product_id: '', product_stock_id: '', quantity: 0, unit_value: 0 }])
                  }
                >
                  <Plus className="mr-1 h-3 w-3" /> Item
                </Button>
              </div>
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-2 gap-3 rounded-md border p-3 md:grid-cols-4">
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Estoque</Label>
                    <Combobox
                      options={stockOptions}
                      value={item.product_stock_id}
                      onValueChange={(v) => {
                        const balance = balances?.items.find((b) => String(b.id) === v);
                        setItems((prev) =>
                          prev.map((row, i) =>
                            i === index
                              ? { ...row, product_stock_id: v, product_id: String(balance?.product_id ?? row.product_id) }
                              : row,
                          ),
                        );
                      }}
                      placeholder="Selecione o saldo"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quantidade</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={item.quantity}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((row, i) => (i === index ? { ...row, quantity: Number(e.target.value) } : row)),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Valor unitário</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_value}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((row, i) => (i === index ? { ...row, unit_value: Number(e.target.value) } : row)),
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {errors.items && <p className="text-sm text-destructive">{errors.items}</p>}
              <p className="text-right text-sm font-medium">Total: {formatCurrencyBRL(outputTotal(items))}</p>
            </div>

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
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!returning} onOpenChange={(open) => !open && setReturning(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Retorno de empréstimo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data do retorno</Label>
              <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Pendente</TableHead>
                    <TableHead className="text-right">Retornar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(returning?.items ?? []).map((item) => {
                    const pending = outputItemPendingQuantity(item);
                    const value = returnQuantities[String(item.id)] ?? 0;
                    const invalid = value > 0 && !returnQuantityIsValid(item, value);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name ?? item.product_id}</TableCell>
                        <TableCell className="text-right">{number3(pending)}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            step="0.001"
                            className={invalid ? 'border-destructive text-right' : 'text-right'}
                            value={value}
                            onChange={(e) =>
                              setReturnQuantities((prev) => ({ ...prev, [String(item.id)]: Number(e.target.value) }))
                            }
                          />
                          {invalid && <p className="text-xs text-destructive">Acima do saldo emprestado.</p>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setReturning(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={returnInvalid || returnMutation.isPending}
              onClick={() => returning && returnMutation.mutate(returning)}
            >
              Registrar retorno
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirming}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Confirmar saída"
        description="Ao confirmar, as quantidades serão baixadas do estoque. Esta ação não pode ser desfeita."
        confirmLabel="Confirmar saída"
        confirmVariant="success"
        onConfirm={() => confirming && confirmMutation.mutate(confirming.id)}
      />
    </div>
  );
}
