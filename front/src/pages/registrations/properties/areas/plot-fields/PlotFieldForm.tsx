import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { PlotField, plotFieldsService, fieldsService, cropsService } from '@/lib/api-services';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { formatAreaDisplay, handleAreaMaskChange } from '@/lib/format-helpers';
import api from '@/lib/api';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  field_id: z.string().min(1, 'Talhão obrigatório'),
  crop_id: z.string().min(1, 'Safra obrigatória'),
  culture_id: z.string().min(1, 'Cultura obrigatória'),
  variety_culture_id: z.string().min(1, 'Variedade obrigatória'),
  area: z.coerce.number().min(0, 'Área deve ser positiva'),
  pms: z.coerce.number().optional(),
  linear_seed: z.coerce.number().optional(),
  start_planting: z.string().optional(),
  final_planting: z.string().optional(),
  expected_date: z.string().optional(),
  observations: z.string().optional(),
  status: z.enum(['A', 'I']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: PlotField | null;
  onSave: () => void;
  onCancel: () => void;
}

export function PlotFieldForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [areaDisplay, setAreaDisplay] = useState(() => item?.area != null ? formatAreaDisplay(item.area) : '');

  const { data: fields = [], isLoading: loadingFields } = useQuery({ queryKey: ['fields'], queryFn: fieldsService.getAll });
  const { data: crops = [], isLoading: loadingCrops } = useQuery({ queryKey: ['crops'], queryFn: cropsService.getAll });
  const [cropCultures, setCropCultures] = useState<{ id: string; name: string }[]>([]);

  const filteredCrops = useMemo(() => {
    const activeCrops = crops.filter((c) => c.status === 'A');
    if (item?.crop_id && !activeCrops.some((c) => c.id === item.crop_id)) {
      const currentCrop = crops.find((c) => c.id === item.crop_id);
      if (currentCrop) return [...activeCrops, currentCrop];
    }
    return activeCrops;
  }, [crops, item?.crop_id]);
  const [loadingCropCultures, setLoadingCropCultures] = useState(false);
  const [cultureVarieties, setCultureVarieties] = useState<{ id: string; name: string }[]>([]);
  const [loadingCultureVarieties, setLoadingCultureVarieties] = useState(false);

  const fetchCulturesByCrop = async (cropId: string) => {
    if (!cropId) return;
    setLoadingCropCultures(true);
    try {
      const { data } = await api.get(`/registrations/properties/areas/plot-fields/culture/${cropId}`);
      const list = data?.data ?? data;
      setCropCultures(Array.isArray(list) ? list : []);
    } catch {
      setCropCultures([]);
    } finally {
      setLoadingCropCultures(false);
    }
  };


  const fetchVarietiesByCulture = async (cultureId: string) => {
    if (!cultureId) return;
    setLoadingCultureVarieties(true);
    try {
      const { data } = await api.get(`/registrations/harvest/cultures/${cultureId}/varieties`);
      const list = data.data ?? data;
      setCultureVarieties(Array.isArray(list) ? list : []);
    } catch {
      setCultureVarieties([]);
    } finally {
      setLoadingCultureVarieties(false);
    }
  };

  const { handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? {
          name: item.name ?? '',
          field_id: item.field_id,
          crop_id: item.crop_id,
          culture_id: item.culture_id,
          variety_culture_id: (item as any).variety_culture_id ?? '',
          area: item.area,
          pms: (item as any).pms ?? undefined,
          linear_seed: (item as any).linear_seed ?? undefined,
          start_planting: (item as any).start_planting?.slice(0, 10) ?? '',
          final_planting: (item as any).final_planting?.slice(0, 10) ?? '',
          expected_date: (item as any).expected_date?.slice(0, 10) ?? '',
          observations: (item as any).observations ?? '',
          status: item.status,
        }
      : { status: 'A', name: '' },
  });

  const [currentFreeArea, setCurrentFreeArea] = useState<number | null>(null);
  const [areaExceeded, setAreaExceeded] = useState(false);
  const areaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item?.crop_id) fetchCulturesByCrop(item.crop_id);
    if (item?.culture_id) fetchVarietiesByCulture(item.culture_id);
    // Load free area on edit
    if (item?.field_id && item?.crop_id) {
      (async () => {
        try {
          const { data } = await api.get(`/registrations/properties/areas/fields/free_area/${item.crop_id}/${item.field_id}`);
          const result = data.data ?? data;
          const freeArea = result?.free_area;
          if (freeArea != null) {
            setCurrentFreeArea(freeArea);
          }
        } catch {}
      })();
    }
  }, []);

  const handleFieldBlur = async () => {
    const fieldId = watch('field_id');
    const cropId = watch('crop_id');
    if (!fieldId || !cropId) return;
    try {
      const { data } = await api.get(`/registrations/properties/areas/fields/free_area/${cropId}/${fieldId}`);
      const result = data.data ?? data;
      const freeArea = result?.free_area;
      if (freeArea != null) {
        setCurrentFreeArea(freeArea);
        setAreaDisplay(formatAreaDisplay(freeArea));
        setValue('area', freeArea, { shouldValidate: true });
        setAreaExceeded(false);
        setTimeout(() => areaInputRef.current?.focus(), 100);
      }
    } catch {
      // silently fail
    }
  };

  const handleAreaBlur = () => {
    const area = watch('area');
    if (currentFreeArea != null && area > currentFreeArea) {
      toast.error(`Área (${formatAreaDisplay(area)}) não pode ser maior que a área livre do talhão (${formatAreaDisplay(currentFreeArea)}).`);
      setAreaExceeded(true);
      setTimeout(() => areaInputRef.current?.focus(), 100);
    } else {
      setAreaExceeded(false);
    }
  };

  const handleFinalPlantingBlur = async () => {
    const finalPlanting = watch('final_planting');
    const varietyId = watch('variety_culture_id');
    if (!finalPlanting || !varietyId) return;
    try {
      const { data } = await api.get(`/registrations/properties/areas/plot-fields/cycle/${varietyId}`);
      const result = data?.data ?? data;
      const days = Number(typeof result === 'object' ? (result?.cycle ?? result?.days ?? result?.value) : result);
      if (!Number.isFinite(days)) return;
      const base = new Date(`${finalPlanting}T12:00:00`);
      base.setDate(base.getDate() + days);
      const expected = base.toISOString().slice(0, 10);
      setValue('expected_date', expected, { shouldValidate: true });
    } catch {
      // silently fail
    }
  };

  const onSubmit = async (data: FormData) => {
    if (areaExceeded) {
      toast.error('Corrija a área antes de salvar.');
      return;
    }
    setLoading(true);
    try {
      if (item) {
        await plotFieldsService.update(item.id, data);
        toast.success('Locação atualizada!');
      } else {
        await plotFieldsService.create(data as any);
        toast.success('Locação criada!');
      }
      queryClient.invalidateQueries({ queryKey: ['plot-fields'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally {
      setLoading(false);
    }
  };

  const renderCombo = (label: string, field: keyof FormData, placeholder: string, searchPlaceholder: string, options: { id: string; label: string }[], isLoading: boolean, onChange?: (v: string) => void) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
      ) : (
        <Combobox
          options={options.map((o) => ({ value: o.id, label: o.label }))}
          value={(watch(field) as string) ?? ''}
          onValueChange={(v) => (onChange ? onChange(v) : setValue(field, v as any, { shouldValidate: true }))}
          placeholder={placeholder}
          searchPlaceholder={searchPlaceholder}
        />
      )}
      {errors[field] && <p className="text-sm text-destructive">{(errors[field] as any).message}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="plot-field-name">Nome da Locação</Label>
        <Input
          id="plot-field-name"
          value={watch('name') ?? ''}
          onChange={(e) => setValue('name', e.target.value, { shouldValidate: true })}
          placeholder="Ex: Talhão 12 - Soja 2025"
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      {renderCombo('Safra', 'crop_id', 'Selecione a safra', 'Buscar safra...', filteredCrops.map((c) => ({ id: c.id, label: c.name })), loadingCrops, (v) => {
        setValue('crop_id', v as any, { shouldValidate: true });
        setValue('culture_id', '' as any);
        setValue('variety_culture_id', '' as any);
        setCropCultures([]);
        setCultureVarieties([]);
        fetchCulturesByCrop(v);
      })}
      {renderCombo('Talhão', 'field_id', 'Selecione o talhão', 'Buscar talhão...', fields.map((f) => ({ id: f.id, label: f.name })), loadingFields, (v) => {
        setValue('field_id', v as any, { shouldValidate: true });
        setTimeout(() => handleFieldBlur(), 100);
      })}
      {renderCombo('Cultura', 'culture_id', 'Selecione a cultura', 'Buscar cultura...', cropCultures.map((c) => ({ id: c.id, label: c.name })), loadingCropCultures, (v) => {
        setValue('culture_id', v as any, { shouldValidate: true });
        setValue('variety_culture_id', '' as any);
        setCultureVarieties([]);
        fetchVarietiesByCulture(v);
      })}
      {renderCombo('Variedade', 'variety_culture_id', 'Selecione a variedade', 'Buscar variedade...', cultureVarieties.map((v) => ({ id: v.id, label: v.name })), loadingCultureVarieties)}

      <div className="space-y-2">
        <Label>Área (ha)</Label>
        <Input
          ref={areaInputRef}
          value={areaDisplay}
          onChange={(e) => handleAreaMaskChange(e, setAreaDisplay, (v) => setValue('area', v, { shouldValidate: true }))}
          onBlur={handleAreaBlur}
          placeholder="Ex: 25,00"
        />
        {errors.area && <p className="text-sm text-destructive">{errors.area.message}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>PMS (Peso de Mil Sementes)</Label>
          <Input
            type="number"
            step="0.01"
            value={(watch('pms') as number | undefined) ?? ''}
            onChange={(e) => setValue('pms', e.target.value === '' ? undefined : (Number(e.target.value) as any), { shouldValidate: true })}
            placeholder="Ex: 180"
          />
          {errors.pms && <p className="text-sm text-destructive">{errors.pms.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Sementes por Metro Linear</Label>
          <Input
            type="number"
            step="0.01"
            value={(watch('linear_seed') as number | undefined) ?? ''}
            onChange={(e) => setValue('linear_seed', e.target.value === '' ? undefined : (Number(e.target.value) as any), { shouldValidate: true })}
            placeholder="Ex: 12"
          />
          {errors.linear_seed && <p className="text-sm text-destructive">{errors.linear_seed.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Início do Plantio</Label>
          <Input type="date" value={watch('start_planting') ?? ''} onChange={(e) => setValue('start_planting', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Fim do Plantio</Label>
          <Input
            type="date"
            value={watch('final_planting') ?? ''}
            onChange={(e) => setValue('final_planting', e.target.value)}
            onBlur={handleFinalPlantingBlur}
          />
        </div>
        <div className="space-y-2">
          <Label>Previsão de Colheita</Label>
          <Input type="date" value={watch('expected_date') ?? ''} onChange={(e) => setValue('expected_date', e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea value={watch('observations') ?? ''} onChange={(e) => setValue('observations', e.target.value)} rows={3} placeholder="Observações" />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={watch('status')} onValueChange={(v) => setValue('status', v as 'A' | 'I')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="A">Ativo</SelectItem>
            <SelectItem value="I">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (item ? 'Salvar' : 'Criar')}
        </Button>
      </div>
    </form>
  );
}