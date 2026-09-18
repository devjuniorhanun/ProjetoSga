import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { ReportPdfButton } from './ReportPdfButton';
import { HARVEST_ORDER_BY_LABELS } from '@/lib/report-rules';
import type {
  HarvestReportFilterValues,
  HarvestReportOption,
  HarvestReportOptions,
} from '@/types/harvest-reports';

interface Props {
  cropId: string;
  onCropChange: (cropId: string) => void;
  values: HarvestReportFilterValues;
  onChange: (values: HarvestReportFilterValues) => void;
  onSubmit: () => void;
  onClear: () => void;
  onDownloadPdf: () => Promise<void>;
  options?: HarvestReportOptions;
  optionsLoading?: boolean;
  submitDisabled?: boolean;
  /** O relatório de produtividade oferece ordenações próprias. */
  showOrderBy?: boolean;
}

const toOptions = (list: HarvestReportOption[] | undefined, allLabel = 'Todos') => [
  { value: '', label: allLabel },
  ...(list ?? []).map((o) => ({
    value: String(o.id),
    label: o.field_name ? `${o.name} — ${o.field_name}` : o.name,
    keywords: [o.name, o.field_name].filter(Boolean) as string[],
  })),
];

export function HarvestReportFilters({
  cropId,
  onCropChange,
  values,
  onChange,
  onSubmit,
  onClear,
  onDownloadPdf,
  options,
  optionsLoading,
  submitDisabled,
  showOrderBy = true,
}: Props) {
  const set = (patch: Partial<HarvestReportFilterValues>) => onChange({ ...values, ...patch });

  const orderOptions = options?.order_options?.length
    ? options.order_options
    : Object.entries(HARVEST_ORDER_BY_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Safra</Label>
            <Combobox
              options={(options?.crops ?? []).map((c) => ({ value: String(c.id), label: c.name }))}
              value={cropId}
              onValueChange={onCropChange}
              placeholder="Selecione a safra"
              searchPlaceholder="Buscar safra..."
              emptyText={optionsLoading ? 'Carregando...' : 'Nenhuma safra disponível'}
              disabled={optionsLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="harvest-date-from">Data inicial</Label>
            <Input
              id="harvest-date-from"
              type="date"
              value={values.date_from ?? ''}
              onChange={(e) => set({ date_from: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="harvest-date-to">Data final</Label>
            <Input
              id="harvest-date-to"
              type="date"
              value={values.date_to ?? ''}
              onChange={(e) => set({ date_to: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Produtor</Label>
            <Combobox
              options={toOptions(options?.producers)}
              value={values.producer_id ?? ''}
              onValueChange={(v) => set({ producer_id: v })}
              placeholder="Todos"
              searchPlaceholder="Buscar produtor..."
              disabled={optionsLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Proprietário</Label>
            <Combobox
              options={toOptions(options?.owners)}
              value={values.owner_id ?? ''}
              onValueChange={(v) => set({ owner_id: v })}
              placeholder="Todos"
              searchPlaceholder="Buscar proprietário..."
              disabled={optionsLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Armazém</Label>
            <Combobox
              options={toOptions(options?.warehouses)}
              value={values.warehouse_id ?? ''}
              onValueChange={(v) => set({ warehouse_id: v })}
              placeholder="Todos"
              searchPlaceholder="Buscar armazém..."
              disabled={optionsLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Cultura</Label>
            <Combobox
              options={toOptions(options?.cultures, 'Todas')}
              value={values.culture_id ?? ''}
              onValueChange={(v) => set({ culture_id: v })}
              placeholder="Todas"
              searchPlaceholder="Buscar cultura..."
              disabled={optionsLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Fazenda</Label>
            <Combobox
              options={toOptions(options?.farms, 'Todas')}
              value={values.farm_id ?? ''}
              onValueChange={(v) => set({ farm_id: v })}
              placeholder="Todas"
              searchPlaceholder="Buscar fazenda..."
              disabled={optionsLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Talhão</Label>
            <Combobox
              options={toOptions(options?.plot_fields)}
              value={values.plot_field_id ?? ''}
              onValueChange={(v) => set({ plot_field_id: v })}
              placeholder="Todos"
              searchPlaceholder="Buscar talhão..."
              disabled={optionsLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Variedade</Label>
            <Combobox
              options={toOptions(options?.varieties, 'Todas')}
              value={values.variety_culture_id ?? ''}
              onValueChange={(v) => set({ variety_culture_id: v })}
              placeholder="Todas"
              searchPlaceholder="Buscar variedade..."
              disabled={optionsLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Motorista</Label>
            <Combobox
              options={toOptions(options?.drivers)}
              value={values.driver_id ?? ''}
              onValueChange={(v) => set({ driver_id: v })}
              placeholder="Todos"
              searchPlaceholder="Buscar motorista..."
              disabled={optionsLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Colhedor</Label>
            <Combobox
              options={toOptions(options?.harvesters)}
              value={values.lanyard_id ?? ''}
              onValueChange={(v) => set({ lanyard_id: v })}
              placeholder="Todos"
              searchPlaceholder="Buscar colhedor..."
              disabled={optionsLoading}
            />
          </div>
          {showOrderBy && (
            <div className="space-y-2">
              <Label>Ordenar por</Label>
              <Combobox
                options={orderOptions}
                value={values.order_by ?? 'NAME_ASC'}
                onValueChange={(v) => set({ order_by: v as HarvestReportFilterValues['order_by'] })}
                placeholder="Nome (A-Z)"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClear}>
            Limpar filtros
          </Button>
          <ReportPdfButton onDownload={onDownloadPdf} disabled={!cropId} />
          <Button type="button" onClick={onSubmit} disabled={submitDisabled || !cropId}>
            Consultar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
