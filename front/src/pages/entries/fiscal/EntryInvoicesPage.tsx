import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FiscalStatusBadge } from '@/components/fiscal/FiscalStatusBadge';
import { EntryInvoiceFormDialog } from './EntryInvoiceFormDialog';
import { entryInvoicesService } from '@/lib/api-services-fiscal';
import { useFiscalOptions } from '@/hooks/use-fiscal-options';
import {
  ENTRY_METHOD_LABELS,
  ENTRY_TYPE_LABELS,
  INVOICE_STATUS_LABELS,
  labelOr,
  optionsFrom,
} from '@/lib/fiscal-labels';
import { canConfirmInvoice, canEditInvoice } from '@/lib/fiscal-rules';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import { formatDateBR } from '@/lib/grain-format';
import type { EntryInvoice, FiscalEntryType } from '@/types/fiscal';

interface Props {
  /** Sem tipo a tela mostra a listagem geral de todas as notas. */
  entryType?: FiscalEntryType;
}

export default function EntryInvoicesPage({ entryType }: Props) {
  const queryClient = useQueryClient();
  const options = useFiscalOptions();
  const [status, setStatus] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [newEntryType, setNewEntryType] = useState<FiscalEntryType>('GENERAL');
  const [editing, setEditing] = useState<EntryInvoice | null>(null);
  const [confirming, setConfirming] = useState<EntryInvoice | null>(null);
  const [removing, setRemoving] = useState<EntryInvoice | null>(null);

  const params = useMemo(
    () => ({
      entry_type: entryType ?? (typeFilter || undefined),
      status: status || undefined,
      supplier_id: supplierId || undefined,
      invoice_number: invoiceNumber || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      per_page: 25,
    }),
    [entryType, typeFilter, status, supplierId, invoiceNumber, dateFrom, dateTo],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['entry-invoices', params],
    queryFn: () => entryInvoicesService.list(params),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['entry-invoices'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
    queryClient.invalidateQueries({ queryKey: ['pay-accounts'] });
  };

  const confirmMutation = useMutation({
    mutationFn: (id: string) => entryInvoicesService.confirm(id),
    onSuccess: () => {
      toast.success('Nota confirmada. Estoque e financeiro atualizados.');
      setConfirming(null);
      invalidate();
    },
    onError: () => toast.error('Não foi possível confirmar a nota.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => entryInvoicesService.delete(id),
    onSuccess: () => {
      toast.success('Nota excluída.');
      setRemoving(null);
      invalidate();
    },
    onError: () => toast.error('Não foi possível excluir a nota.'),
  });

  const title = entryType ? `Notas de ${ENTRY_TYPE_LABELS[entryType]}` : 'Notas Fiscais de Entrada';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-muted-foreground">
            Notas em rascunho podem ser editadas; após confirmar, estoque e parcelas financeiras são gerados.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            if (entryType) {
              setNewEntryType(entryType);
              setFormOpen(true);
              return;
            }
            setTypeDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova nota
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 md:grid-cols-6">
        {!entryType && (
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Combobox
              options={[{ value: '', label: 'Todos' }, ...optionsFrom(ENTRY_TYPE_LABELS)]}
              value={typeFilter}
              onValueChange={setTypeFilter}
              placeholder="Todos"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>Situação</Label>
          <Combobox
            options={[{ value: '', label: 'Todas' }, ...optionsFrom(INVOICE_STATUS_LABELS)]}
            value={status}
            onValueChange={setStatus}
            placeholder="Todas"
          />
        </div>
        <div className="space-y-2">
          <Label>Fornecedor</Label>
          <Combobox
            options={[{ value: '', label: 'Todos' }, ...options.supplierOptions]}
            value={supplierId}
            onValueChange={setSupplierId}
            placeholder="Todos"
          />
        </div>
        <div className="space-y-2">
          <Label>Número</Label>
          <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>De</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Até</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable<EntryInvoice>
          data={data?.items ?? []}
          exportTitle={title}
          searchKeys={['invoice_number', 'supplier_name', 'access_key']}
          columns={[
            { key: 'invoice_number', label: 'Número', render: (i) => `${i.invoice_number}${i.series ? `/${i.series}` : ''}` },
            { key: 'entry_type', label: 'Tipo', render: (i) => labelOr(ENTRY_TYPE_LABELS, i.entry_type) },
            { key: 'supplier_name', label: 'Fornecedor', render: (i) => i.supplier_name ?? '-' },
            { key: 'issue_date', label: 'Emissão', render: (i) => formatDateBR(i.issue_date) },
            { key: 'entry_date', label: 'Entrada', render: (i) => formatDateBR(i.entry_date) },
            { key: 'invoice_total', label: 'Total', render: (i) => formatCurrencyBRL(i.invoice_total) },
            { key: 'entry_method', label: 'Origem', render: (i) => labelOr(ENTRY_METHOD_LABELS, i.entry_method) },
            { key: 'status', label: 'Situação', render: (i) => <FiscalStatusBadge status={i.status} /> },
          ]}
          actions={(invoice) => (
            <div className="flex justify-end gap-1">
              {canEditInvoice(invoice.status) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setEditing(invoice);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {canConfirmInvoice(invoice.status) && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setConfirming(invoice)}>
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
              {canEditInvoice(invoice.status) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => setRemoving(invoice)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        />
      )}

      <EntryInvoiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        entryType={editing?.entry_type ?? entryType ?? newEntryType}
        invoice={editing}
      />

      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Selecione o tipo da nota de entrada</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.entries(ENTRY_TYPE_LABELS) as Array<[FiscalEntryType, string]>).map(([value, label]) => (
              <Button
                key={value}
                variant="outline"
                className="h-auto justify-start py-4 text-left"
                onClick={() => {
                  setNewEntryType(value);
                  setTypeDialogOpen(false);
                  setFormOpen(true);
                }}
              >
                Nota de {label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirming}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Confirmar nota fiscal"
        description="Ao confirmar, os produtos entram no estoque e cada parcela gera uma conta a pagar. Esta ação não pode ser desfeita."
        confirmLabel="Confirmar nota"
        confirmVariant="success"
        onConfirm={() => confirming && confirmMutation.mutate(confirming.id)}
      />

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Excluir nota"
        description="A nota em rascunho será excluída permanentemente."
        confirmLabel="Excluir"
        confirmVariant="destructive"
        onConfirm={() => removing && deleteMutation.mutate(removing.id)}
      />
    </div>
  );
}
