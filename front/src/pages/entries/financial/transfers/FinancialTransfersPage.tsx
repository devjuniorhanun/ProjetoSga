import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  payAccountsService,
  PayAccount,
  PAY_ACCOUNT_STATUS_LABELS,
  payAccountBankSuppliers,
  payAccountProducerName,
  payAccountFarmName,
  payAccountSupplierName,
  payAccountSupplierDocument,
  payAccountTypeName,
  isTransferPayAccount,
} from '@/lib/api-services-financial-entries';
import type { BankSupplier } from '@/lib/api-services-bank';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import { generateTransfersPdfBlob, transfersPdfFileName, TransferPdfItem } from '@/lib/financial-transfer-pdf';

const todayISO = () => new Date().toISOString().slice(0, 10);

const formatDate = (value?: string) =>
  value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '';

export default function FinancialTransfersPage() {
  const { user } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bankByAccount, setBankByAccount] = useState<Record<string, string>>({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const { data: rows = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['financial-transfers', date],
    queryFn: () => payAccountsService.getTransfers(date),
  });

  // Somente lançamentos cujo tipo de pagamento tem a abreviação TR.
  const data = useMemo(() => rows.filter(isTransferPayAccount), [rows]);

  useEffect(() => {
    setSelected({});
    const defaults: Record<string, string> = {};
    data.forEach((item) => {
      const active = payAccountBankSuppliers(item).filter((b) => b.status === 'A');
      if (active.length === 1) defaults[item.id] = String(active[0].id);
    });
    setBankByAccount(defaults);
  }, [data]);

  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);

  const selectedItems = useMemo(() => data.filter((i) => selected[i.id]), [data, selected]);
  const totalValue = useMemo(
    () => selectedItems.reduce((sum, i) => sum + (Number(i.value) || 0), 0),
    [selectedItems]
  );

  const activeBanks = (item: PayAccount): BankSupplier[] =>
    payAccountBankSuppliers(item).filter((b) => b.status === 'A');

  const bankOf = (item: PayAccount): BankSupplier | undefined => {
    const banks = activeBanks(item);
    const chosen = bankByAccount[item.id];
    return banks.find((b) => String(b.id) === String(chosen)) ?? (banks.length === 1 ? banks[0] : undefined);
  };

  const toggleAll = (checked: boolean) => {
    if (!checked) { setSelected({}); return; }
    const next: Record<string, boolean> = {};
    data.forEach((item) => { if (activeBanks(item).length > 0) next[item.id] = true; });
    setSelected(next);
  };

  const handleGeneratePdf = () => {
    if (!selectedItems.length) {
      toast.error('Selecione ao menos uma transferência.');
      return;
    }
    const missingBank = selectedItems.filter((i) => !bankOf(i));
    if (missingBank.length) {
      toast.error('Selecione uma conta bancária ativa para todas as transferências escolhidas.');
      return;
    }
    const items: TransferPdfItem[] = selectedItems.map((item) => {
      const bank = bankOf(item)!;
      return {
        documentNumber: item.document_number,
        documentDate: item.document_date,
        producerName: payAccountProducerName(item),
        farmName: payAccountFarmName(item),
        supplierName: payAccountSupplierName(item),
        supplierDocument: payAccountSupplierDocument(item),
        bankName: bank.bank_name,
        agencyNumber: bank.agency_number,
        operationNumber: bank.operation_number,
        accountNumber: bank.account_number,
        accountType: bank.account_type,
        pixKey: bank.pix_key,
        value: Number(item.value) || 0,
        description: item.description,
        authorizedBy: item.authorized_by || (user as any)?.name || (user as any)?.email || '',
        accountedFor: item.accounted_for,
      };
    });
    const blob = generateTransfersPdfBlob(items);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(URL.createObjectURL(blob));
  };

  const closePreview = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transferências</h1>
        <p className="text-muted-foreground mt-1">Transferências do dia com geração de comprovantes em PDF</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
        <div className="space-y-1">
          <Label className="text-xs" htmlFor="transfer-date">Data</Label>
          <Input id="transfer-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-48" />
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
        <Button variant="outline" onClick={() => toggleAll(true)}>Selecionar todas</Button>
        <Button variant="outline" onClick={() => setSelected({})}>Limpar seleção</Button>
        <Button onClick={handleGeneratePdf}><FileText className="mr-2 h-4 w-4" /> Gerar PDF</Button>
        <div className="ml-auto text-sm text-muted-foreground">
          <span className="mr-4">Selecionadas: <strong>{selectedItems.length}</strong></span>
          <span>Total: <strong>{formatCurrencyBRL(totalValue)}</strong></span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : isError ? (
        <p className="py-12 text-center text-destructive">Não foi possível carregar as transferências.</p>
      ) : data.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Nenhuma transferência encontrada para esta data.</p>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Tipo de Pagamento</TableHead>
                <TableHead className="min-w-[220px]">Banco</TableHead>
                <TableHead>Agência</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Tipo da Conta</TableHead>
                <TableHead>PIX</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Contabilizado</TableHead>
                <TableHead>Unidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => {
                const banks = activeBanks(item);
                const bank = bankOf(item);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={!!selected[item.id]}
                        disabled={banks.length === 0}
                        aria-label={`Selecionar documento ${item.document_number}`}
                        onCheckedChange={(checked) =>
                          setSelected((prev) => ({ ...prev, [item.id]: checked === true }))
                        }
                      />
                    </TableCell>
                    <TableCell>{item.document_number}</TableCell>
                    <TableCell>{formatDate(item.document_date)}</TableCell>
                    <TableCell>{payAccountSupplierName(item)}</TableCell>
                    <TableCell>{payAccountSupplierDocument(item)}</TableCell>
                    <TableCell>{payAccountTypeName(item)}</TableCell>
                    <TableCell>
                      {banks.length === 0 ? (
                        <span className="text-sm text-destructive">Sem conta bancária ativa</span>
                      ) : banks.length === 1 ? (
                        banks[0].bank_name
                      ) : (
                        <Combobox
                          options={banks.map((b) => ({
                            value: String(b.id),
                            label: `${b.bank_name} • ${b.agency_number}/${b.account_number}`,
                          }))}
                          value={bankByAccount[item.id] ?? ''}
                          onValueChange={(v) => setBankByAccount((prev) => ({ ...prev, [item.id]: v }))}
                          placeholder="Selecione a conta"
                          searchPlaceholder="Buscar conta..."
                        />
                      )}
                    </TableCell>
                    <TableCell>{bank?.agency_number ?? ''}</TableCell>
                    <TableCell>{bank?.account_number ?? ''}</TableCell>
                    <TableCell>{bank?.account_type ?? ''}</TableCell>
                    <TableCell>{bank?.pix_key ?? ''}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{formatCurrencyBRL(item.value)}</TableCell>
                    <TableCell>{item.accounted_for === 'S' ? 'Sim' : 'Não'}</TableCell>
                    <TableCell>{PAY_ACCOUNT_STATUS_LABELS[item.status] ?? item.status}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!pdfUrl} onOpenChange={(open) => { if (!open) closePreview(); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>Comprovantes de Transferência</DialogTitle></DialogHeader>
          {pdfUrl && (
            <>
              <iframe title="Pré-visualização das transferências" src={pdfUrl} className="h-[70vh] w-full rounded border" />
              <div className="flex justify-end">
                <a href={pdfUrl} download={transfersPdfFileName(date)}>
                  <Button>Baixar PDF</Button>
                </a>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
