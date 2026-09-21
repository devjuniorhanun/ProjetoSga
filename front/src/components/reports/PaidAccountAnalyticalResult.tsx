import { AlertTriangle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportSummaryCards } from './ReportSummaryCards';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import { formatDateBR } from '@/lib/grain-format';
import {
  ACCOUNTED_FOR_LABELS,
  PAID_ACCOUNT_ENTRY_TYPE_LABELS,
  PAID_ACCOUNT_STATUS_LABELS,
} from '@/lib/report-rules';
import type { PaidAccountAnalyticalReport } from '@/types/financial-reports';

interface Props {
  report: PaidAccountAnalyticalReport;
}

export function PaidAccountAnalyticalResult({ report }: Props) {
  const summary = report.summary;
  const sections = report.sections ?? [];

  return (
    <div className="space-y-4">
      <ReportSummaryCards
        cards={[
          { label: 'Pagamentos', value: String(summary?.payments_count ?? 0) },
          { label: 'Fornecedores', value: String(summary?.suppliers_count ?? 0) },
          { label: 'Total geral', value: formatCurrencyBRL(summary?.grand_total ?? 0) },
          { label: 'Contabilizado', value: formatCurrencyBRL(summary?.accounted_total ?? 0) },
          { label: 'Não contabilizado', value: formatCurrencyBRL(summary?.not_accounted_total ?? 0) },
        ]}
      />

      {report.reconciliation && report.reconciliation.reconciled === false && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Conferência inconsistente</AlertTitle>
          <AlertDescription>
            {report.reconciliation.message ??
              'Os totais das seções não fecham com o total geral informado pelo sistema.'}
          </AlertDescription>
        </Alert>
      )}

      {sections.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          Nenhum pagamento encontrado para os filtros informados.
        </p>
      ) : (
        <Accordion type="multiple" className="rounded-lg border bg-card px-3">
          {sections.map((section) => (
            <AccordionItem key={section.code} value={section.code}>
              <AccordionTrigger>
                <span className="flex w-full flex-wrap items-center justify-between gap-2 pr-3 text-left">
                  <span className="font-medium">{section.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {section.payments_count} pagamento(s) — {formatCurrencyBRL(section.total)}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <Accordion type="multiple" className="space-y-1">
                  {(section.suppliers ?? []).map((supplier) => (
                    <AccordionItem
                      key={`${section.code}-${supplier.supplier_id}`}
                      value={`${section.code}-${supplier.supplier_id}`}
                      className="rounded-md border"
                    >
                      <AccordionTrigger className="px-3">
                        <span className="flex w-full flex-wrap items-center justify-between gap-2 pr-3 text-left">
                          <span>{supplier.supplier_name ?? supplier.supplier_id}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrencyBRL(supplier.total)}
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-2 pb-3">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Documento</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Vencimento</TableHead>
                                <TableHead>Produtor</TableHead>
                                <TableHead>Centro administrativo</TableHead>
                                <TableHead>Centro de custo</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Safra</TableHead>
                                <TableHead>Lançamento</TableHead>
                                <TableHead>Contabilizado</TableHead>
                                <TableHead>Unidade</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(supplier.items ?? []).map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.document_number ?? '-'}</TableCell>
                                  <TableCell>{formatDateBR(item.document_date)}</TableCell>
                                  <TableCell>{formatDateBR(item.due_date)}</TableCell>
                                  <TableCell>{item.producer_name ?? '-'}</TableCell>
                                  <TableCell>{item.administrative_center_name ?? '-'}</TableCell>
                                  <TableCell>{item.cost_center_name ?? '-'}</TableCell>
                                  <TableCell>{item.type_pay_account_name ?? '-'}</TableCell>
                                  <TableCell className="max-w-[240px] truncate" title={item.description ?? ''}>
                                    {item.description ?? '-'}
                                  </TableCell>
                                  <TableCell>
                                    {item.crop_name ?? '-'}
                                    {item.agricultural_year_name ? ` (${item.agricultural_year_name})` : ''}
                                  </TableCell>
                                  <TableCell>
                                    {PAID_ACCOUNT_ENTRY_TYPE_LABELS[item.entry_type ?? ''] ?? item.entry_type ?? '-'}
                                  </TableCell>
                                  <TableCell>
                                    {ACCOUNTED_FOR_LABELS[item.accounted_for ?? ''] ?? '-'}
                                  </TableCell>
                                  <TableCell>
                                    {PAID_ACCOUNT_STATUS_LABELS[item.status ?? ''] ?? item.status ?? '-'}
                                  </TableCell>
                                  <TableCell className="text-right">{formatCurrencyBRL(item.value)}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="bg-muted/50 font-semibold">
                                <TableCell colSpan={12} className="text-right">
                                  Total do fornecedor:
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrencyBRL(supplier.total)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
