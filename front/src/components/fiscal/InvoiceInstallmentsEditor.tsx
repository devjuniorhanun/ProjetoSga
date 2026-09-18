import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import { installmentsMatchTotal, installmentsTotal } from '@/lib/fiscal-rules';
import type { EntryInvoiceInstallment } from '@/types/fiscal';

interface Props {
  installments: EntryInvoiceInstallment[];
  invoiceTotal: number;
  onChange: (installments: EntryInvoiceInstallment[]) => void;
  disabled?: boolean;
}

export function InvoiceInstallmentsEditor({ installments, invoiceTotal, onChange, disabled }: Props) {
  const total = installmentsTotal(installments);
  const matches = installmentsMatchTotal(installments, invoiceTotal);

  const patch = (index: number, values: Partial<EntryInvoiceInstallment>) =>
    onChange(installments.map((item, i) => (i === index ? { ...item, ...values } : item)));

  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Documento</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              {!disabled && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {installments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                  Nenhuma parcela lançada
                </TableCell>
              </TableRow>
            ) : (
              installments.map((installment, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={installment.document_number}
                      disabled={disabled}
                      onChange={(e) => patch(index, { document_number: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={installment.due_date}
                      disabled={disabled}
                      onChange={(e) => patch(index, { due_date: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.01"
                      className="text-right"
                      value={installment.value}
                      disabled={disabled}
                      onChange={(e) => patch(index, { value: Number(e.target.value) })}
                    />
                  </TableCell>
                  {!disabled && (
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => onChange(installments.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange([...installments, { document_number: '', due_date: '', value: 0 }])}
          >
            <Plus className="mr-2 h-4 w-4" /> Adicionar parcela
          </Button>
        )}
        <div className="text-right text-sm">
          <Label className="text-xs text-muted-foreground">Total das parcelas</Label>
          <p className={matches ? 'font-medium' : 'font-medium text-destructive'}>
            {formatCurrencyBRL(total)} de {formatCurrencyBRL(invoiceTotal)}
          </p>
          {!matches && <p className="text-xs text-destructive">A soma das parcelas deve ser igual ao total da nota.</p>}
        </div>
      </div>
    </div>
  );
}
