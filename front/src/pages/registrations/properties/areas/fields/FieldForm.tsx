import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field as FieldType, fieldsService, farmsService } from '@/lib/api-services';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { formatAreaDisplay, handleAreaMaskChange } from '@/lib/format-helpers';
import api from '@/lib/api';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  farm_id: z.string().min(1, 'Fazenda obrigatória'),
  name: z.string().trim().min(1, 'Nome obrigatório').max(200),
  area: z.coerce.number().min(0, 'Área deve ser positiva'),
  block: z.string().trim().min(1, 'Bloco obrigatório'),
  status: z.enum(['A', 'I']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: FieldType | null;
  onSave: () => void;
  onCancel: () => void;
}

export function FieldForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [areaDisplay, setAreaDisplay] = useState(() => item?.area != null ? formatAreaDisplay(item.area) : '');

  const { data: farms = [], isLoading: loadingFarms } = useQuery({
    queryKey: ['farms'],
    queryFn: farmsService.getAll,
  });

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? { farm_id: item.farm_id, name: item.name, area: item.area, block: item.block, status: item.status }
      : { status: 'A' },
  });

  const [areaExceeded, setAreaExceeded] = useState(false);
  const areaInputRef = useRef<HTMLInputElement>(null);

  const handleAreaBlur = async () => {
    const farmId = watch('farm_id');
    const area = watch('area');
    if (!farmId || !area) return;
    try {
      const { data } = await api.get(`/registrations/properties/areas/farms/free_area/${farmId}`);
      const farm = data.data ?? data;
      const freeArea = farm?.free_area ?? farm?.total_area;
      if (freeArea != null && area > freeArea) {
        toast.error(`Área (${formatAreaDisplay(area)}) não pode ser maior que a área livre da fazenda (${formatAreaDisplay(freeArea)}).`);
        setAreaExceeded(true);
        setAreaDisplay(formatAreaDisplay(freeArea));
        setValue('area', freeArea, { shouldValidate: true });
        setTimeout(() => areaInputRef.current?.focus(), 100);
      } else {
        setAreaExceeded(false);
      }
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
        await fieldsService.update(item.id, data);
        toast.success('Talhão atualizado!');
      } else {
        await fieldsService.create(data as Omit<FieldType, 'id'>);
        toast.success('Talhão criado!');
      }
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Fazenda</Label>
        {loadingFarms ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
        ) : (
          <Combobox
            options={farms.filter((f) => f.status === 'A' || String(f.id) === String(item?.farm_id)).map((f) => ({ value: String(f.id), label: f.name }))}
            placeholder="Selecione a fazenda"
            searchPlaceholder="Buscar fazenda..."
            emptyText="Nenhuma fazenda encontrada."
            value={watch('farm_id')}
            onValueChange={(v) => {
              setValue('farm_id', v);
              setTimeout(async () => {
                try {
                  const { data } = await api.get(`/registrations/properties/areas/farms/free_area/${v}`);
                  const farm = data.data ?? data;
                  const freeArea = farm?.free_area ?? farm?.total_area;
                  if (freeArea != null) {
                    setAreaDisplay(formatAreaDisplay(freeArea));
                    setValue('area', freeArea, { shouldValidate: true });
                  }
                } catch {}
              }, 100);
            }}
          />
        )}
        {errors.farm_id && <p className="text-sm text-destructive">{errors.farm_id.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input {...register('name')} placeholder="Ex: Talhão 01" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Área (ha)</Label>
          <Input
            ref={areaInputRef}
            value={areaDisplay}
            onChange={(e) => handleAreaMaskChange(e, setAreaDisplay, (v) => setValue('area', v, { shouldValidate: true }))}
            onBlur={handleAreaBlur}
            placeholder="Ex: 50,00"
          />
          {errors.area && <p className="text-sm text-destructive">{errors.area.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Bloco</Label>
          <Input {...register('block')} placeholder="Ex: A" />
          {errors.block && <p className="text-sm text-destructive">{errors.block.message}</p>}
        </div>
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
