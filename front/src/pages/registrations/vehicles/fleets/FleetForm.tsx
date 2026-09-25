import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Fleet, fleetsService, fleetGroupsService, fleetBrandsService, fleetModelsService } from '@/lib/api-services-vehicles';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { formatPlateMercosul } from '@/lib/format-helpers';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  fleet_group_id: z.string().min(1, 'Grupo obrigatório'),
  fleet_brand_id: z.string().min(1, 'Marca obrigatória'),
  fleet_model_id: z.string().min(1, 'Modelo obrigatório'),
  name: z.string().trim().min(1, 'Nome obrigatório').max(200),
  code: z.string().trim().min(1, 'Código obrigatório').max(50),
  plate: z.string().trim().max(20).optional().or(z.literal('')),
  fleet_type: z.enum(['P', 'T']),
  year: z.string().trim().min(1, 'Ano obrigatório').max(10),
  chassi: z.string().trim().max(50).optional().or(z.literal('')),
  acquisition_date: z.string().optional().or(z.literal('')),
  acquisition_value: z.coerce.number().min(0).optional(),
  fuel_type: z.string().trim().max(50).optional().or(z.literal('')),
  marking_type: z.string().trim().max(50).optional().or(z.literal('')),
  starting_meter: z.string().trim().max(50).optional().or(z.literal('')),
  end_gauge: z.string().trim().max(50).optional().or(z.literal('')),
  status: z.enum(['A', 'I']),
});

type FormData = z.infer<typeof schema>;

interface Props { item?: Fleet | null; onSave: () => void; onCancel: () => void; }

function formatMeterInit(v?: string | number) {
  if (v === undefined || v === null || v === '') return '';
  const num = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  if (isNaN(num)) return String(v);
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function FleetForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const { data: groups = [], isLoading: lg } = useQuery({ queryKey: ['fleet-groups', 'active-options'], queryFn: () => fleetGroupsService.getAll({ status: 'A' }) });
  const { data: brands = [], isLoading: lb } = useQuery({ queryKey: ['fleet-brands', 'active-options'], queryFn: () => fleetBrandsService.getAll({ status: 'A' }) });
  const { data: allModels = [], isLoading: lm } = useQuery({ queryKey: ['fleet-models', 'active-options'], queryFn: () => fleetModelsService.getAll({ status: 'A' }) });

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item ? {
      fleet_group_id: item.fleet_group_id, fleet_brand_id: item.fleet_brand_id, fleet_model_id: item.fleet_model_id,
      name: item.name, code: item.code, plate: item.plate, fleet_type: item.fleet_type, year: item.year,
      chassi: item.chassi, acquisition_date: item.acquisition_date, acquisition_value: item.acquisition_value,
      fuel_type: item.fuel_type, marking_type: item.marking_type, starting_meter: formatMeterInit(item.starting_meter), end_gauge: formatMeterInit(item.end_gauge), status: item.status,
    } : { status: 'A', fleet_type: 'P' },
  });

  const selectedBrandId = watch('fleet_brand_id');
  const models = allModels.filter((m) => !selectedBrandId || m.fleet_brand_id === selectedBrandId);

  const handleBrandChange = (v: string) => {
    setValue('fleet_brand_id', v);
    setValue('fleet_model_id', '');
  };

  const [valueDisplay, setValueDisplay] = useState(() => {
    if (item?.acquisition_value != null) {
      const cents = Math.round(item.acquisition_value * 100);
      return cents === 0 ? '' : (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return '';
  });

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const cents = parseInt(raw || '0');
    const display = cents === 0 ? '' : (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    setValueDisplay(display);
    setValue('acquisition_value', cents / 100, { shouldValidate: true });
  };

  const formatMeter = (v?: string | number) => {
    if (v === undefined || v === null || v === '') return '';
    const num = typeof v === 'number' ? v : parseFloat(String(v).replace(/\./g, '').replace(',', '.'));
    if (isNaN(num)) return '';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleMeterChange = (field: 'starting_meter' | 'end_gauge') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) { setValue(field, '', { shouldValidate: true }); return; }
    const display = (parseInt(raw, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    setValue(field, display, { shouldValidate: true });
  };

  const toDecimal = (v?: string) => {
    if (!v) return v ?? '';
    return v.replace(/\./g, '').replace(',', '.');
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const payload = { ...data, starting_meter: toDecimal(data.starting_meter), end_gauge: toDecimal(data.end_gauge) };
    try {
      if (item) { await fleetsService.update(item.id, payload); toast.success('Frota atualizada!'); }
      else { await fleetsService.create(payload as Omit<Fleet, 'id'>); toast.success('Frota criada!'); }
      queryClient.invalidateQueries({ queryKey: ['fleets'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally { setLoading(false); }
  };

  const loadingRelations = lg || lb || lm;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {loadingRelations ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div> : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Grupo</Label>
              <Combobox options={groups.filter((g) => g.status === 'A' || String(g.id) === String(item?.fleet_group_id)).map((g) => ({ value: String(g.id), label: g.name }))} value={watch('fleet_group_id')} onValueChange={(v) => setValue('fleet_group_id', v, { shouldValidate: true })} placeholder="Selecione o grupo" searchPlaceholder="Buscar grupo..." emptyText="Nenhum grupo encontrado." />
              {errors.fleet_group_id && <p className="text-sm text-destructive">{errors.fleet_group_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Marca</Label>
              <Combobox options={brands.map((b) => ({ value: String(b.id), label: b.name }))} value={watch('fleet_brand_id')} onValueChange={handleBrandChange} placeholder="Selecione a marca" searchPlaceholder="Buscar marca..." emptyText="Nenhuma marca encontrada." />
              {errors.fleet_brand_id && <p className="text-sm text-destructive">{errors.fleet_brand_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Combobox options={models.map((m) => ({ value: String(m.id), label: m.name }))} value={watch('fleet_model_id')} onValueChange={(v) => setValue('fleet_model_id', v, { shouldValidate: true })} placeholder="Selecione o modelo" searchPlaceholder="Buscar modelo..." emptyText="Nenhum modelo encontrado." />
              {errors.fleet_model_id && <p className="text-sm text-destructive">{errors.fleet_model_id.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Nome</Label><Input {...register('name')} placeholder="Ex: Caminhão 01" />{errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}</div>
            <div className="space-y-2"><Label>Código</Label><Input {...register('code')} placeholder="Ex: CAM-001" />{errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}</div>
            <div className="space-y-2"><Label>Placa</Label><Input value={watch('plate') ?? ''} onChange={(e) => setValue('plate', formatPlateMercosul(e.target.value), { shouldValidate: true })} placeholder="Ex: ABC1D23" maxLength={7} />{errors.plate && <p className="text-sm text-destructive">{errors.plate.message}</p>}</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Frota</Label>
              <Select value={watch('fleet_type')} onValueChange={(v) => setValue('fleet_type', v as 'P' | 'T')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="P">Próprio</SelectItem><SelectItem value="T">Terceiro</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>Ano</Label><Input {...register('year')} placeholder="Ex: 2024" />{errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}</div>
            <div className="space-y-2"><Label>Chassi</Label><Input {...register('chassi')} placeholder="Ex: 9BW..." /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Data de Aquisição</Label><Input type="date" {...register('acquisition_date')} /></div>
            <div className="space-y-2"><Label>Valor de Aquisição (R$)</Label><Input value={valueDisplay} onChange={handleValueChange} placeholder="0,00" /></div>
            <div className="space-y-2"><Label>Tipo de Combustível</Label><Select value={watch('fuel_type')} onValueChange={(v) => setValue('fuel_type', v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="A">S-500</SelectItem><SelectItem value="B">S-10</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Tipo de Marcação</Label><Select value={watch('marking_type')} onValueChange={(v) => setValue('marking_type', v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="H">Horímetro</SelectItem><SelectItem value="K">Quilômetro</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Medidor Inicial</Label><Input value={watch('starting_meter') ?? ''} onChange={handleMeterChange('starting_meter')} placeholder="0,00" onBlur={(e) => { if (!watch('end_gauge')) setValue('end_gauge', e.target.value); }} /></div>
            <div className="space-y-2"><Label>Medidor Final</Label><Input value={watch('end_gauge') ?? ''} onChange={handleMeterChange('end_gauge')} placeholder="0,00" /></div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={watch('status')} onValueChange={(v) => setValue('status', v as 'A' | 'I')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="A">Ativo</SelectItem><SelectItem value="I">Inativo</SelectItem></SelectContent></Select>
          </div>
        </>
      )}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (item ? 'Salvar' : 'Criar')}</Button>
      </div>
    </form>
  );
}
