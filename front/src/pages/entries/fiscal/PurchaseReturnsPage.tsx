import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FiscalStatusBadge } from '@/components/fiscal/FiscalStatusBadge';
import { entryInvoicesService, purchaseReturnsService } from '@/lib/api-services-fiscal';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import { formatDateBR } from '@/lib/grain-format';
import type { PurchaseReturn, PurchaseReturnItem } from '@/types/fiscal';

export default function PurchaseReturnsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [confirming, setConfirming] = useState<PurchaseReturn | null>(null);
  const [invoiceId, setInvoiceId] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<PurchaseReturnItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-returns'],
    queryFn: () => purchaseReturnsService.list({ per_page: 25 }),
  });

  const { data: invoices } = useQuery({
    queryKey: ['entry-invoices', 'confirmed'],
    queryFn: () => entryInvoicesService.list({ status: 'CONFIRMED', per_page: 100 }),
    enabled: formOpen,
  });

  const { data: invoiceDetail } = useQuery({
    queryKey: ['entry-invoices', invoiceId],
    queryFn: () => entryInvoicesService.getById(invoiceId),
    enabled: !!invoiceId && formOpen,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      purchaseReturnsService.create({
        entry_invoice_id: invoiceId,
        return_date: returnDate,
        reason: reason || null,
        items,
      }),
    onSuccess: () => {
      toast.success('Devolução registrada.');
      setFormOpen(false);
      setItems([]);
      setInvoiceId('');
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] });
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
      toast.error('Não foi possível registrar a devolução.');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => purchaseReturnsService.confirm(id),
    onSuccess: () => {
      toast.success('Devolução confirmada. O estoque foi ajustado.');
      setConfirming(null);
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
    },
    onError: () => toast.error('Não foi possível confirmar a devolução.'),
  });

  const validate = () => {
    const next: Record<string, string> = {};
    if (!invoiceId) next.entry_invoice_id = 'Selecione a nota de origem.';
    if (!returnDate) next.return_date = 'Informe a data da devolução.';
    if (!items.length || items.some((item) => !item.entry_invoice_item_id || !(Number(item.quantity) > 0))) {
      next.items = 'Informe os itens e quantidades devolvidos.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Devoluções de Compra</h1>
          <p className="mt-1 text-muted-foreground">
            A devolução ajusta apenas o estoque; as contas a pagar da nota permanecem como estão.
          </p>
        </div>
        <Button
          onClick={() => {
            setErrors({});
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova devolução
        </Button>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable<PurchaseReturn>
          data={data?.items ?? []}
          exportTitle="Devoluções de Compra"
          searchKeys={['invoice_number', 'supplier_name', 'reason']}
          columns={[
            { key: 'return_date', label: 'Data', render: (r) => formatDateBR(r.return_date) },
            { key: 'invoice_number', label: 'Nota', render: (r) => r.invoice_number ?? r.entry_invoice_id },
            { key: 'supplier_name', label: 'Fornecedor', render: (r) => r.supplier_name ?? '-' },
            { key: 'total_value', label: 'Valor', render: (r) => formatCurrencyBRL(r.total_value ?? 0) },
            { key: 'reason', label: 'Motivo', render: (r) => r.reason ?? '-' },
            { key: 'status', label: 'Situação', render: (r) => <FiscalStatusBadge status={r.status} /> },
          ]}
          actions={(row) =>
            row.status === 'DRAFT' ? (
              <div className="flex justify-end">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setConfirming(row)}>
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
            ) : null
          }
        />
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nova devolução de compra</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nota de origem</Label>
                <Combobox
                  options={(invoices?.items ?? []).map((invoice) => ({
                    value: String(invoice.id),
                    label: `${invoice.invoice_number} — ${invoice.supplier_name ?? ''}`.trim(),
                  }))}
                  value={invoiceId}
                  onValueChange={(v) => {
                    setInvoiceId(v);
                    setItems([]);
                  }}
                  placeholder="Selecione a nota"
                />
                {errors.entry_invoice_id && <p className="text-sm text-destructive">{errors.entry_invoice_id}</p>}
              </div>
              <div className="space-y-2">
                <Label>Data da devolução</Label>
                <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                {errors.return_date && <p className="text-sm text-destructive">{errors.return_date}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Itens devolvidos</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!invoiceId}
                  onClick={() => setItems((prev) => [...prev, { entry_invoice_item_id: '', quantity: 0 }])}
                >
                  <Plus className="mr-1 h-3 w-3" /> Item
                </Button>
              </div>
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-3 rounded-md border p-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Item da nota</Label>
                    <Combobox
                      options={(invoiceDetail?.items ?? []).map((invoiceItem) => ({
                        value: String(invoiceItem.id),
                        label: `${invoiceItem.product_name ?? invoiceItem.description} (${invoiceItem.quantity})`,
                      }))}
                      value={item.entry_invoice_item_id}
                      onValueChange={(v) =>
                        setItems((prev) =>
                          prev.map((row, i) => (i === index ? { ...row, entry_invoice_item_id: v } : row)),
                        )
                      }
                      placeholder="Selecione"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quantidade</Label>
                    <div className="flex gap-1">
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
            </div>

            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
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

      <ConfirmDialog
        open={!!confirming}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Confirmar devolução"
        description="A confirmação altera somente o estoque — nenhuma conta a pagar é criada ou alterada."
        confirmLabel="Confirmar devolução"
        confirmVariant="success"
        onConfirm={() => confirming && confirmMutation.mutate(confirming.id)}
      />
    </div>
  );
}
