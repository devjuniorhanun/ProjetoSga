import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import {
  HarvestRelease,
  harvestMatrixFreightService,
  harvestPlotFieldsService,
  harvestReleasesService,
} from '@/lib/api-services-harvest';
import {
  buildHarvestReleasePayload,
  calculateHarvestPreview,
  canQueryMatrixFreight,
  canSubmitHarvestRelease,
  formatBags,
  formatWeightKg,
  keepRestoredPlotField,
} from '@/lib/harvest-rules';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import { cropsService, driversService, ownersService, warehousesService, lanyardsService } from '@/lib/api-services';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  crop_id: z.string().min(1, 'Safra obrigatória'),
  driver_id: z.string().min(1, 'Motorista obrigatório'),
  owner_id: z.string().min(1, 'Produtor obrigatório'),
  plot_field_id: z.string().min(1, 'Talhão obrigatório'),
  warehouse_id: z.string().min(1, 'Armazém obrigatório'),
  lanyard_id: z.string().min(1, 'Colhedor obrigatório'),
  release_date: z.string().min(1, 'Data obrigatória'),
  shipping_number: z.string().trim().min(1, 'Nº romaneio obrigatório'),
  control_number: z.string().trim().min(1, 'Nº controle obrigatório'),
  gross_weight: z.coerce.number().gt(0, 'Peso bruto deve ser maior que zero'),
  discount: z.coerce.number().min(0, 'Desconto mínimo 0%').max(100, 'Desconto máximo 100%'),
});

type FormData = z.infer<typeof schema>;

const SESSION_KEYS = ['crop_id', 'owner_id', 'plot_field_id', 'warehouse_id', 'lanyard_id', 'release_date'] as const;
const SESSION_STORAGE_KEY = 'harvest-release-session';

function getSessionValues(): Partial<FormData> {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSessionValues(data: FormData) {
  const session: Record<string, unknown> = {};
  SESSION_KEYS.forEach((k) => {
    if (data[k]) session[k] = data[k];
  });
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

interface Props {
  item?: HarvestRelease | null;
  onSave: (keepOpen: boolean) => void;
  onCancel: () => void;
}

export function HarvestReleaseForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const sessionValues = item ? {} : getSessionValues();

  const { data: crops = [], isLoading: l1 } = useQuery({ queryKey: ['crops'], queryFn: cropsService.getAll });
  const { data: drivers = [], isLoading: l2 } = useQuery({ queryKey: ['drivers'], queryFn: driversService.getAll });
  const { data: owners = [], isLoading: l3 } = useQuery({ queryKey: ['owners'], queryFn: ownersService.getAll });
  const { data: warehouses = [], isLoading: l5 } = useQuery({ queryKey: ['warehouses'], queryFn: warehousesService.getAll });
  const { data: lanyards = [], isLoading: l6 } = useQuery({ queryKey: ['lanyards'], queryFn: lanyardsService.getAll });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? {
          crop_id: item.crop_id,
          driver_id: item.driver_id,
          owner_id: item.owner_id,
          plot_field_id: item.plot_field_id,
          warehouse_id: item.warehouse_id,
          lanyard_id: item.lanyard_id,
          release_date: item.release_date,
          shipping_number: item.shipping_number,
          control_number: item.control_number,
          gross_weight: item.gross_weight,
          discount: item.discount,
        }
      : {
          gross_weight: 0,
          discount: 0,
          shipping_number: '',
          control_number: '',
          driver_id: '',
          ...sessionValues,
        },
  });

  const cropId = watch('crop_id');
  const plotFieldId = watch('plot_field_id');
  const warehouseId = watch('warehouse_id');
  const grossWeight = Number(watch('gross_weight')) || 0;
  const discount = Number(watch('discount')) || 0;

  // Talhões da safra selecionada (endpoint específico).
  const { data: plotFields = [], isFetching: plotFieldsLoading } = useQuery({
    queryKey: ['harvest-plot-fields', cropId],
    queryFn: () => harvestPlotFieldsService.byCrop(cropId),
    enabled: Boolean(cropId),
  });

  // Ao carregar os talhões, descarta seleção restaurada que não pertence à safra.
  useEffect(() => {
    if (!cropId || plotFieldsLoading || plotFields.length === 0) return;
    const current = watch('plot_field_id');
    const kept = keepRestoredPlotField(current, plotFields);
    if (kept !== current) setValue('plot_field_id', kept);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropId, plotFieldsLoading, plotFields]);

  const matrixEnabled = canQueryMatrixFreight(cropId, plotFieldId, warehouseId);
  const {
    data: matrixFreight,
    isFetching: matrixLoading,
    error: matrixError,
  } = useQuery({
    queryKey: ['harvest-matrix-freight', cropId, plotFieldId, warehouseId],
    queryFn: () => harvestMatrixFreightService.find(cropId, plotFieldId, warehouseId),
    enabled: matrixEnabled,
    retry: false,
  });

  const preview = useMemo(
    () => calculateHarvestPreview(grossWeight, discount, matrixFreight?.price),
    [grossWeight, discount, matrixFreight?.price],
  );

  const matrixMessage =
    (matrixError as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    'Não existe percurso cadastrado para a combinação de safra, talhão e armazém.';

  const canSubmit = canSubmitHarvestRelease(matrixFreight, matrixLoading);

  const onSubmit = async (data: FormData) => {
    if (!canSubmit) {
      toast.error('Percurso não encontrado. Ajuste safra, talhão ou armazém.');
      return;
    }
    setLoading(true);
    try {
      const payload = buildHarvestReleasePayload(data as never);
      if (item) {
        await harvestReleasesService.update(item.id, payload);
        toast.success('Colheita atualizada!');
        queryClient.invalidateQueries({ queryKey: ['harvest-releases'] });
        onSave(false);
      } else {
        await harvestReleasesService.create(payload);
        toast.success('Colheita criada!');
        saveSessionValues(data);
        queryClient.invalidateQueries({ queryKey: ['harvest-releases'] });
        const session = getSessionValues();
        reset({
          gross_weight: 0,
          discount: 0,
          shipping_number: '',
          control_number: '',
          driver_id: '',
          ...session,
        });
        onSave(true);
      }
    } catch (error) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally {
      setLoading(false);
    }
  };

  const loadingRel = l1 || l2 || l3 || l5 || l6;

  if (loadingRel)
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
      </div>
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Safra</Label>
          <Combobox
            options={crops.filter((c) => c.status === 'A' || c.id === cropId).map((c) => ({ value: c.id, label: c.name }))}
            value={cropId}
            onValueChange={(v) => {
              setValue('crop_id', v);
              setValue('plot_field_id', '');
              queryClient.removeQueries({ queryKey: ['harvest-matrix-freight'] });
            }}
            placeholder="Selecione a safra"
            searchPlaceholder="Buscar safra..."
          />
          {errors.crop_id && <p className="text-sm text-destructive">{errors.crop_id.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Motorista</Label>
          <Combobox
            options={drivers
              .filter((d) => d.status === 'A' || d.id === watch('driver_id'))
              .map((d) => ({
                value: d.id,
                label: [d.name, d.code, d.plate].filter(Boolean).join(' - '),
                keywords: [d.name, d.code, d.plate].filter(Boolean) as string[],
              }))}
            value={watch('driver_id')}
            onValueChange={(v) => setValue('driver_id', v)}
            placeholder="Selecione o motorista"
            searchPlaceholder="Buscar por nome, código ou placa..."
          />
          {errors.driver_id && <p className="text-sm text-destructive">{errors.driver_id.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Produtor</Label>
          <Combobox
            options={owners
              .filter((o) => o.payment_type === 'D' || o.id === watch('owner_id'))
              .map((o) => ({ value: o.id, label: o.corporate_name || o.fantasy_name }))}
            value={watch('owner_id')}
            onValueChange={(v) => setValue('owner_id', v)}
            placeholder="Selecione o produtor"
            searchPlaceholder="Buscar produtor..."
          />
          {errors.owner_id && <p className="text-sm text-destructive">{errors.owner_id.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Talhão</Label>
          <Combobox
            options={plotFields.map((p) => ({
              value: p.id,
              // O backend passou a expor o nome oficial da locação em `name`.
              label: [p.name || p.plot_name, p.block && `Bloco ${p.block}`, p.culture_name, p.area ? `${p.area} ha` : '']
                .filter(Boolean)
                .join(' - '),
              keywords: [p.name, p.plot_name, p.block, p.culture_name].filter(Boolean) as string[],
            }))}
            value={plotFieldId}
            onValueChange={(v) => {
              setValue('plot_field_id', v);
              queryClient.removeQueries({ queryKey: ['harvest-matrix-freight'] });
            }}
            placeholder={cropId ? 'Selecione o talhão' : 'Selecione a safra primeiro'}
            searchPlaceholder="Buscar talhão..."
            emptyText={plotFieldsLoading ? 'Carregando talhões...' : 'Nenhum talhão para esta safra'}
            disabled={!cropId || plotFieldsLoading}
          />
          {plotFieldsLoading && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Carregando talhões da safra...
            </p>
          )}
          {errors.plot_field_id && <p className="text-sm text-destructive">{errors.plot_field_id.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Armazém</Label>
          <Combobox
            options={warehouses
              .filter((w) => w.status === 'A' || w.id === warehouseId)
              .map((w) => ({ value: w.id, label: w.name }))}
            value={warehouseId}
            onValueChange={(v) => {
              setValue('warehouse_id', v);
              queryClient.removeQueries({ queryKey: ['harvest-matrix-freight'] });
            }}
            placeholder="Selecione o armazém"
            searchPlaceholder="Buscar armazém..."
          />
          {errors.warehouse_id && <p className="text-sm text-destructive">{errors.warehouse_id.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Colhedor</Label>
          <Combobox
            options={lanyards
              .filter((l) => l.status === 'A' || l.id === watch('lanyard_id'))
              .map((l) => ({ value: l.id, label: l.front }))}
            value={watch('lanyard_id')}
            onValueChange={(v) => setValue('lanyard_id', v)}
            placeholder="Selecione o colhedor"
            searchPlaceholder="Buscar colhedor..."
          />
          {errors.lanyard_id && <p className="text-sm text-destructive">{errors.lanyard_id.message}</p>}
        </div>
      </div>

      {matrixEnabled && (
        <div>
          {matrixLoading && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Localizando percurso...
            </p>
          )}
          {!matrixLoading && matrixFreight && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <span className="font-medium">Percurso: </span>
              {matrixFreight.route} — Bloco {matrixFreight.block} — {matrixFreight.warehouse_name} —{' '}
              {formatCurrencyBRL(matrixFreight.price)} por saca
            </div>
          )}
          {!matrixLoading && !matrixFreight && matrixError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Percurso não encontrado</AlertTitle>
              <AlertDescription>{matrixMessage}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Data</Label>
          <Input type="date" {...register('release_date')} />
          {errors.release_date && <p className="text-sm text-destructive">{errors.release_date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Nº Romaneio</Label>
          <Input {...register('shipping_number')} />
          {errors.shipping_number && <p className="text-sm text-destructive">{errors.shipping_number.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Nº Controle</Label>
          <Input {...register('control_number')} />
          {errors.control_number && <p className="text-sm text-destructive">{errors.control_number.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Peso Bruto (kg)</Label>
          <Input type="number" step="0.001" {...register('gross_weight')} />
          {errors.gross_weight && <p className="text-sm text-destructive">{errors.gross_weight.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Desconto (%)</Label>
          <Input type="number" step="0.01" {...register('discount')} />
          {errors.discount && <p className="text-sm text-destructive">{errors.discount.message}</p>}
        </div>
      </div>

      <div className="rounded-md border p-3">
        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
          Prévia (valores definitivos são calculados pelo sistema)
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
          <div>
            <p className="text-muted-foreground">Peso desconto</p>
            <p className="font-medium">{formatWeightKg(preview.discount_weight)} kg</p>
          </div>
          <div>
            <p className="text-muted-foreground">Peso líquido</p>
            <p className="font-medium">{formatWeightKg(preview.net_weight)} kg</p>
          </div>
          <div>
            <p className="text-muted-foreground">Sacas brutas</p>
            <p className="font-medium">{formatBags(preview.gross_bags, 2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Sacas líquidas</p>
            <p className="font-medium">{formatBags(preview.liquid_bags, 3)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Valor do frete</p>
            <p className="font-medium">{formatCurrencyBRL(preview.shipping_value)}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !canSubmit}>
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : item ? (
            'Salvar'
          ) : (
            'Criar'
          )}
        </Button>
      </div>
    </form>
  );
}
