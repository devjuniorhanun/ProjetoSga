import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  payAccountsService,
  PayAccount,
  PAY_ACCOUNT_STATUS_LABELS,
  ENTRY_TYPE_LABELS,
  payAccountAdministrativeCenterName,
  payAccountCostCenterName,
  payAccountSupplierName,
  payAccountProducerName,
  payAccountTypeName,
} from '@/lib/api-services-financial-entries';
import { typePayAccountsService } from '@/lib/api-services-financial-entries';
import { costCentersService, getAdministrativeCentersByProducer } from '@/lib/api-services-financial';
import { producersService, suppliersService, cropsService } from '@/lib/api-services';
import { Combobox } from '@/components/ui/combobox';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import { Plus, Pencil, Trash2, Eye, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PayAccountForm } from './PayAccountForm';
import { payAccountReceiptService } from '@/lib/api-services-pay-account-receipt';
import { buildReceiptPdf } from '@/lib/receipt-pdf';
import { openPdfBlob } from '@/lib/report-download';

const formatDate = (value?: string) =>
  value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '';

const ALL = 'ALL';

export default function PayAccountsList() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<PayAccount | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<PayAccount | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const filters = useMemo(() => ({
    date: searchParams.get('date') ?? '',
    date_from: searchParams.get('date_from') ?? '',
    date_to: searchParams.get('date_to') ?? '',
    document_number: searchParams.get('document_number') ?? '',
    entry_type: searchParams.get('entry_type') ?? '',
    status: searchParams.get('status') ?? '',
    accounted_for: searchParams.get('accounted_for') ?? '',
    producer_id: searchParams.get('producer_id') ?? '',
    administrative_center_id: searchParams.get('administrative_center_id') ?? '',
    cost_center_id: searchParams.get('cost_center_id') ?? '',
    supplier_id: searchParams.get('supplier_id') ?? '',
    type_pay_account_id: searchParams.get('type_pay_account_id') ?? '',
    crop_id: searchParams.get('crop_id') ?? '',
    per_page: searchParams.get('per_page') ?? '25',

  }), [searchParams]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    return params;
  }, [filters]);

  const { data = [], isLoading } = useQuery({
    queryKey: ['pay-accounts', queryParams],
    queryFn: () => payAccountsService.getAll(queryParams),
  });

  const { data: producers = [] } = useQuery({ queryKey: ['producers'], queryFn: producersService.getAll });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: suppliersService.getAll });
  const { data: costCenters = [] } = useQuery({ queryKey: ['cost-centers'], queryFn: costCentersService.getAll });
  const { data: typeAccounts = [] } = useQuery({ queryKey: ['type-pay-accounts'], queryFn: typePayAccountsService.getAll });
  const { data: crops = [] } = useQuery({ queryKey: ['crops'], queryFn: cropsService.getAll });


  const { data: administrativeCenters = [] } = useQuery({
    queryKey: ['administrative-centers', filters.producer_id],
    queryFn: () => getAdministrativeCentersByProducer(filters.producer_id),
    enabled: !!filters.producer_id,
  });

  const producerOptions = useMemo(
    () => producers
      .filter((p) => p.status === 'A')
      .map((p) => ({ value: String(p.id), label: p.owner_name || String(p.id) })),
    [producers]
  );

  const supplierOptions = useMemo(
    () => suppliers
      .filter((s) => s.status === 'A')
      .map((s) => ({
        value: String(s.id),
        label: s.corporate_reason || s.fantasy_name || s.supplier_name,
        keywords: [s.fantasy_name, s.cpf_cnpj].filter(Boolean) as string[],
      })),
    [suppliers]
  );

  const costCenterOptions = useMemo(
    () => costCenters.filter((c) => c.status === 'A').map((c) => ({ value: String(c.id), label: c.name || String(c.id) })),
    [costCenters]
  );

  const typeOptions = useMemo(
    () => typeAccounts.filter((t) => t.status === 'A').map((t) => ({ value: String(t.id), label: t.name })),
    [typeAccounts]
  );

  const cropOptions = useMemo(
    () => crops.filter((c) => c.status === 'A').map((c) => ({ value: String(c.id), label: c.name })),
    [crops]
  );


  const administrativeCenterOptions = useMemo(
    () => administrativeCenters
      .filter((c) => c.status === 'A')
      .map((c) => ({
        value: String(c.id),
        label: c.farm_name && c.producer_name ? `${c.farm_name} - ${c.producer_name}` : (c.farm_name || c.cei || String(c.id)),
      })),
    [administrativeCenters]
  );

  const handleProducerFilter = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('producer_id', value); else next.delete('producer_id');
    next.delete('administrative_center_id');
    setSearchParams(next, { replace: true });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await payAccountsService.delete(deleteId);
      queryClient.invalidateQueries({ queryKey: ['pay-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('Registro excluído!');
    } catch {
      toast.error('Erro ao excluir registro.');
    }
    setDeleteId(null);
  };

  const handlePrintReceipt = async (item: PayAccount) => {
    if (receiptId) return;
    setReceiptId(item.id);
    try {
      const receipt = await payAccountReceiptService.get(item.id);
      const blob = await buildReceiptPdf(receipt);
      openPdfBlob(blob, `recibo-${receipt.receipt_number ?? item.id}.pdf`);
    } catch (error: unknown) {
      const response = (error as { response?: { status?: number; data?: { message?: string } } }).response;
      if (response?.status === 404) {
        toast.error('Conta não encontrada. O recibo não pode ser impresso.');
      } else {
        toast.error(response?.data?.message ?? 'Não foi possível gerar o recibo.');
      }
    } finally {
      setReceiptId(null);
    }
  };

  const columns = [
    { key: 'administrative_center_name', label: 'Centro Administrativo', render: payAccountAdministrativeCenterName },
    { key: 'cost_center_name', label: 'Centro de Custo', render: payAccountCostCenterName },
    { key: 'supplier_name', label: 'Fornecedor', render: payAccountSupplierName },
    { key: 'producer_name', label: 'Produtor', render: payAccountProducerName },
    { key: 'crop_name', label: 'Safra', render: (item: PayAccount) => item.crop_name || '' },
    { key: 'type_pay_account_name', label: 'Tipo de Pagamento', render: payAccountTypeName },

    { key: 'document_number', label: 'Nº Documento' },
    { key: 'document_date', label: 'Data Documento', render: (item: PayAccount) => formatDate(item.document_date) },
    { key: 'due_date', label: 'Vencimento', render: (item: PayAccount) => formatDate(item.due_date) },
    { key: 'description', label: 'Descrição' },
    { key: 'value', label: 'Valor', render: (item: PayAccount) => formatCurrencyBRL(item.value) },
    { key: 'accounted_for', label: 'Contabilizado', render: (item: PayAccount) => (item.accounted_for === 'S' ? 'Sim' : 'Não') },
    { key: 'status', label: 'Unidade', render: (item: PayAccount) => PAY_ACCOUNT_STATUS_LABELS[item.status] ?? item.status },
    {
      key: 'entry_type',
      label: 'Tipo de Lançamento',
      render: (item: PayAccount) => (
        <Badge variant={item.entry_type === 'PAYROLL' ? 'secondary' : 'outline'}>
          {ENTRY_TYPE_LABELS[item.entry_type] ?? item.entry_type ?? 'Conta paga'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contas Pagas</h1>
          <p className="text-muted-foreground mt-1">Gerencie as contas pagas</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" /> Novo</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 rounded-lg border p-4">
        <div className="space-y-1">
          <Label className="text-xs">Data paga</Label>
          <Input type="date" value={filters.date} onChange={(e) => setFilter('date', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Data inicial</Label>
          <Input type="date" value={filters.date_from} onChange={(e) => setFilter('date_from', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Data final</Label>
          <Input type="date" value={filters.date_to} onChange={(e) => setFilter('date_to', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Documento</Label>
          <Input value={filters.document_number} onChange={(e) => setFilter('document_number', e.target.value)} placeholder="Nº documento" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipo de Lançamento</Label>
          <Select value={filters.entry_type || ALL} onValueChange={(v) => setFilter('entry_type', v === ALL ? '' : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {Object.entries(ENTRY_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Safra</Label>
          <Combobox
            options={cropOptions}
            value={filters.crop_id}
            onValueChange={(v) => setFilter('crop_id', v)}
            placeholder="Todas"
            searchPlaceholder="Buscar safra..."
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Unidade</Label>
          <Select value={filters.status || ALL} onValueChange={(v) => setFilter('status', v === ALL ? '' : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas</SelectItem>
              {Object.entries(PAY_ACCOUNT_STATUS_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Contabilizado</Label>
          <Select value={filters.accounted_for || ALL} onValueChange={(v) => setFilter('accounted_for', v === ALL ? '' : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              <SelectItem value="S">Contabilizado</SelectItem>
              <SelectItem value="N">Não contabilizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Produtor</Label>
          <Combobox
            options={producerOptions}
            value={filters.producer_id}
            onValueChange={handleProducerFilter}
            placeholder="Todos"
            searchPlaceholder="Buscar produtor..."
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Centro Administrativo</Label>
          <Combobox
            options={administrativeCenterOptions}
            value={filters.administrative_center_id}
            onValueChange={(v) => setFilter('administrative_center_id', v)}
            placeholder={filters.producer_id ? 'Todos' : 'Selecione o produtor'}
            searchPlaceholder="Buscar centro..."
            disabled={!filters.producer_id}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Centro de Custo</Label>
          <Combobox
            options={costCenterOptions}
            value={filters.cost_center_id}
            onValueChange={(v) => setFilter('cost_center_id', v)}
            placeholder="Todos"
            searchPlaceholder="Buscar centro de custo..."
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Fornecedor</Label>
          <Combobox
            options={supplierOptions}
            value={filters.supplier_id}
            onValueChange={(v) => setFilter('supplier_id', v)}
            placeholder="Todos"
            searchPlaceholder="Buscar fornecedor..."
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipo de Pagamento</Label>
          <Combobox
            options={typeOptions}
            value={filters.type_pay_account_id}
            onValueChange={(v) => setFilter('type_pay_account_id', v)}
            placeholder="Todos"
            searchPlaceholder="Buscar tipo..."
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Registros por página</Label>
          <Select value={filters.per_page} onValueChange={(v) => setFilter('per_page', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['25', '50', '100'].map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <DataTable
          data={data}
          columns={columns}
          searchKeys={['document_number', 'supplier_name', 'producer_name', 'description']}
          searchPlaceholder="Buscar conta..."
          actions={(item) => (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(item)}><Eye className="h-4 w-4" /></Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Imprimir recibo"
                aria-label="Imprimir recibo"
                disabled={receiptId === item.id}
                onClick={() => handlePrintReceipt(item)}
              >
                {receiptId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          )}
        />
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Editar' : 'Nova'} Conta Paga</DialogTitle></DialogHeader>
          <PayAccountForm item={editItem} onSave={() => { setShowForm(false); setEditItem(null); }} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalhes da Conta</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-sm text-muted-foreground">Centro Administrativo:</span><p className="font-medium">{payAccountAdministrativeCenterName(viewItem)}</p></div>
              <div><span className="text-sm text-muted-foreground">Centro de Custo:</span><p className="font-medium">{payAccountCostCenterName(viewItem)}</p></div>
              <div><span className="text-sm text-muted-foreground">Fornecedor:</span><p className="font-medium">{payAccountSupplierName(viewItem)}</p></div>
              <div><span className="text-sm text-muted-foreground">Produtor:</span><p className="font-medium">{payAccountProducerName(viewItem)}</p></div>
              <div><span className="text-sm text-muted-foreground">Tipo de Pagamento:</span><p className="font-medium">{payAccountTypeName(viewItem)}</p></div>
              <div><span className="text-sm text-muted-foreground">Nº Documento:</span><p className="font-medium">{viewItem.document_number}</p></div>
              <div><span className="text-sm text-muted-foreground">Data Documento:</span><p className="font-medium">{formatDate(viewItem.document_date)}</p></div>
              <div><span className="text-sm text-muted-foreground">Vencimento:</span><p className="font-medium">{formatDate(viewItem.due_date)}</p></div>
              <div><span className="text-sm text-muted-foreground">Valor:</span><p className="font-medium">{formatCurrencyBRL(viewItem.value)}</p></div>
              <div><span className="text-sm text-muted-foreground">Contabilizado:</span><p className="font-medium">{viewItem.accounted_for === 'S' ? 'Sim' : 'Não'}</p></div>
              <div><span className="text-sm text-muted-foreground">Unidade:</span><p className="font-medium">{PAY_ACCOUNT_STATUS_LABELS[viewItem.status] ?? viewItem.status}</p></div>
              <div><span className="text-sm text-muted-foreground">Tipo de Lançamento:</span><p className="font-medium">{ENTRY_TYPE_LABELS[viewItem.entry_type] ?? viewItem.entry_type}</p></div>
              <div className="col-span-2"><span className="text-sm text-muted-foreground">Descrição:</span><p className="font-medium">{viewItem.description}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
