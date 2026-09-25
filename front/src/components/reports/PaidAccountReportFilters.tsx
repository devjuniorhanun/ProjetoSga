import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { ReportPdfButton } from './ReportPdfButton';
import { costCentersService, getAdministrativeCentersByProducer } from '@/lib/api-services-financial';
import { producersService, suppliersService } from '@/lib/api-services';
import { typePayAccountsService } from '@/lib/api-services-financial-entries';
import {
  ACCOUNTED_FOR_LABELS,
  PAID_ACCOUNT_ENTRY_TYPE_LABELS,
  PAID_ACCOUNT_GROUP_BY_LABELS,
  PAID_ACCOUNT_ORDER_BY_LABELS,
  PAID_ACCOUNT_SECTION_LABELS,
  PAID_ACCOUNT_STATUS_LABELS,
} from '@/lib/report-rules';
import { filterMonetaryTypePayAccounts } from '@/lib/report-monetary';
import type { PaidAccountReportFilterValues } from '@/types/financial-reports';

interface Props {
  values: PaidAccountReportFilterValues;
  onChange: (values: PaidAccountReportFilterValues) => void;
  onSubmit: () => void;
  onClear: () => void;
  onDownloadPdf: () => Promise<void>;
  errors?: Partial<Record<keyof PaidAccountReportFilterValues, string>>;
  submitDisabled?: boolean;
  pdfDisabled?: boolean;
  /** Campos extras (ex.: ano agrícola e safra) exibidos antes dos filtros comuns. */
  children?: React.ReactNode;
}

const optionsFromLabels = (labels: Record<string, string>, allLabel: string) => [
  { value: '', label: allLabel },
  ...Object.entries(labels).map(([value, label]) => ({ value, label })),
];

export function PaidAccountReportFilters({
  values,
  onChange,
  onSubmit,
  onClear,
  onDownloadPdf,
  errors,
  submitDisabled,
  pdfDisabled,
  children,
}: Props) {
  const { data: producers = [] } = useQuery({ queryKey: ['producers', 'active-options'], queryFn: () => producersService.getAll({ status: 'A' }) });
  const { data: costCenters = [] } = useQuery({ queryKey: ['cost-centers', 'active-options'], queryFn: () => costCentersService.getAll({ status: 'A' }) });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers', 'active-options'], queryFn: () => suppliersService.getAll({ status: 'A' }) });
  const { data: typeAccounts = [] } = useQuery({
    queryKey: ['type-pay-accounts'],
    queryFn: () => typePayAccountsService.getAll({ status: 'A' }),
  });

  const producerId = values.producer_id ?? '';
  const { data: administrativeCenters = [], isFetching: loadingCenters } = useQuery({
    queryKey: ['administrative-centers', producerId],
    queryFn: () => getAdministrativeCentersByProducer(producerId),
    enabled: !!producerId,
  });

  const set = (patch: Partial<PaidAccountReportFilterValues>) => onChange({ ...values, ...patch });

  const producerOptions = useMemo(
    () => [
      { value: '', label: 'Todos' },
      ...producers
        .filter((p: { status?: string }) => p.status === 'A')
        .map((p: { id: string; owner_name?: string }) => ({
          value: String(p.id),
          label: p.owner_name || String(p.id),
        })),
    ],
    [producers],
  );

  const centerOptions = useMemo(
    () => [
      { value: '', label: 'Todos' },
      ...administrativeCenters
        .filter((c) => c.status === 'A')
        .map((c) => ({
          value: String(c.id),
          label: c.farm_name && c.producer_name ? `${c.farm_name} - ${c.producer_name}` : c.farm_name || c.cei,
          keywords: [c.cei, c.farm_name, c.producer_name].filter(Boolean) as string[],
        })),
    ],
    [administrativeCenters],
  );

  const costCenterOptions = useMemo(
    () => [
      { value: '', label: 'Todos' },
      ...costCenters.filter((c) => c.status === 'A').map((c) => ({ value: String(c.id), label: c.name })),
    ],
    [costCenters],
  );

  const supplierOptions = useMemo(
    () => [
      { value: '', label: 'Todos' },
      ...suppliers
        .filter((s) => s.status === 'A')
        .map((s) => ({
          value: String(s.id),
          label: s.corporate_reason || s.fantasy_name || s.supplier_name,
          keywords: [s.fantasy_name, s.supplier_name, s.cpf_cnpj].filter(Boolean) as string[],
        })),
    ],
    [suppliers],
  );

  const typeAccountOptions = useMemo(
    () => [
      { value: '', label: 'Todos' },
      ...filterMonetaryTypePayAccounts(typeAccounts).map((t) => ({ value: String(t.id), label: t.name })),
    ],
    [typeAccounts],
  );

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        {children}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="report-date-from">Data inicial</Label>
            <Input
              id="report-date-from"
              type="date"
              value={values.date_from ?? ''}
              onChange={(e) => set({ date_from: e.target.value })}
            />
            {errors?.date_from && <p className="text-sm text-destructive">{errors.date_from}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-date-to">Data final</Label>
            <Input
              id="report-date-to"
              type="date"
              value={values.date_to ?? ''}
              onChange={(e) => set({ date_to: e.target.value })}
            />
            {errors?.date_to && <p className="text-sm text-destructive">{errors.date_to}</p>}
          </div>
          <div className="space-y-2">
            <Label>Produtor</Label>
            <Combobox
              options={producerOptions}
              value={producerId}
              onValueChange={(v) => set({ producer_id: v, administrative_center_id: '' })}
              placeholder="Todos"
              searchPlaceholder="Buscar produtor..."
            />
          </div>
          <div className="space-y-2">
            <Label>Centro administrativo</Label>
            <Combobox
              options={centerOptions}
              value={values.administrative_center_id ?? ''}
              onValueChange={(v) => set({ administrative_center_id: v })}
              placeholder={producerId ? 'Todos' : 'Selecione o produtor primeiro'}
              searchPlaceholder="Buscar centro administrativo..."
              emptyText={loadingCenters ? 'Carregando...' : 'Nenhum centro encontrado'}
              disabled={!producerId}
            />
          </div>
          <div className="space-y-2">
            <Label>Centro de custo</Label>
            <Combobox
              options={costCenterOptions}
              value={values.cost_center_id ?? ''}
              onValueChange={(v) => set({ cost_center_id: v })}
              placeholder="Todos"
              searchPlaceholder="Buscar centro de custo..."
            />
          </div>
          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Combobox
              options={supplierOptions}
              value={values.supplier_id ?? ''}
              onValueChange={(v) => set({ supplier_id: v })}
              placeholder="Todos"
              searchPlaceholder="Buscar fornecedor..."
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de pagamento</Label>
            <Combobox
              options={typeAccountOptions}
              value={values.type_pay_account_id ?? ''}
              onValueChange={(v) => set({ type_pay_account_id: v })}
              placeholder="Todos"
              searchPlaceholder="Buscar tipo..."
            />
          </div>
          <div className="space-y-2">
            <Label>Contabilizado</Label>
            <Combobox
              options={optionsFromLabels(ACCOUNTED_FOR_LABELS, 'Todos')}
              value={values.accounted_for ?? ''}
              onValueChange={(v) => set({ accounted_for: (v || undefined) as 'N' | 'S' | undefined })}
              placeholder="Todos"
            />
          </div>
          <div className="space-y-2">
            <Label>Unidade</Label>
            <Combobox
              options={optionsFromLabels(PAID_ACCOUNT_STATUS_LABELS, 'Todas')}
              value={values.status ?? ''}
              onValueChange={(v) =>
                set({ status: (v || undefined) as 'CA' | 'CO' | 'RI' | 'FA' | undefined })
              }
              placeholder="Todas"
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de lançamento</Label>
            <Combobox
              options={optionsFromLabels(PAID_ACCOUNT_ENTRY_TYPE_LABELS, 'Todos')}
              value={values.entry_type ?? ''}
              onValueChange={(v) =>
                set({ entry_type: (v || undefined) as 'ACCOUNT' | 'PAYROLL' | undefined })
              }
              placeholder="Todos"
            />
          </div>
          <div className="space-y-2">
            <Label>Seção</Label>
            <Combobox
              options={Object.entries(PAID_ACCOUNT_SECTION_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              value={values.section ?? 'ALL'}
              onValueChange={(v) => set({ section: v as PaidAccountReportFilterValues['section'] })}
              placeholder="Todas"
            />
          </div>
          <div className="space-y-2">
            <Label>Agrupar por</Label>
            <Combobox
              options={Object.entries(PAID_ACCOUNT_GROUP_BY_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              value={values.group_by ?? 'SUPPLIER'}
              onValueChange={(v) => set({ group_by: v as PaidAccountReportFilterValues['group_by'] })}
              placeholder="Fornecedor"
            />
          </div>
          <div className="space-y-2">
            <Label>Ordenar por</Label>
            <Combobox
              options={Object.entries(PAID_ACCOUNT_ORDER_BY_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              value={values.order_by ?? 'NAME_ASC'}
              onValueChange={(v) => set({ order_by: v as PaidAccountReportFilterValues['order_by'] })}
              placeholder="Nome (A-Z)"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClear}>
            Limpar filtros
          </Button>
          <ReportPdfButton onDownload={onDownloadPdf} disabled={pdfDisabled} />
          <Button type="button" onClick={onSubmit} disabled={submitDisabled}>
            Consultar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
