import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { AdministrativeCenter, administrativeCentersService, getFarmsByProducer } from '@/lib/api-services-financial';
import { producersService, Producer } from '@/lib/api-services';
import { Farm } from '@/lib/api-services';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  producer_id: z.string().min(1, 'Produtor obrigatório'),
  farm_id: z.string().min(1, 'Fazenda obrigatória'),
  cei: z.string().min(1, 'CEI obrigatório'),
  state_registration: z.string().min(1, 'Inscrição Estadual obrigatória'),
  status: z.enum(['A', 'I']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: AdministrativeCenter | null;
  onSave: () => void;
  onCancel: () => void;
}

export function AdministrativeCenterForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loadingFarms, setLoadingFarms] = useState(false);

  const { data: producers = [], isLoading: loadingProducers } = useQuery({
    queryKey: ['producers'],
    queryFn: producersService.getAll,
  });

  const activeProducers = useMemo(() => producers.filter(p => p.status === 'A'), [producers]);

  const { handleSubmit, setValue, watch, register, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? { producer_id: item.producer_id, farm_id: item.farm_id, cei: item.cei, state_registration: item.state_registration, status: item.status }
      : { status: 'A' },
  });

  const selectedProducerId = watch('producer_id');

  // Load farms when editing
  useEffect(() => {
    if (item?.producer_id) {
      loadFarms(item.producer_id);
    }
  }, [item?.producer_id]);

  const loadFarms = async (producerId: string) => {
    setLoadingFarms(true);
    try {
      const result = await getFarmsByProducer(producerId);
      setFarms(result);
    } catch {
      setFarms([]);
    } finally {
      setLoadingFarms(false);
    }
  };

  const handleProducerChange = (producerId: string) => {
    setValue('producer_id', producerId);
    setValue('farm_id', '');
    setFarms([]);
    if (producerId) {
      loadFarms(producerId);
    }
  };

  const producerOptions = useMemo(
    () => activeProducers.map(p => ({ value: p.id, label: p.owner_name || p.id })),
    [activeProducers]
  );

  const farmOptions = useMemo(
    () => farms.map(f => ({ value: f.id, label: f.name })),
    [farms]
  );

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (item) {
        await administrativeCentersService.update(item.id, data);
        toast.success('Centro Administrativo atualizado!');
      } else {
        await administrativeCentersService.create(data as Omit<AdministrativeCenter, 'id'>);
        toast.success('Centro Administrativo criado!');
      }
      queryClient.invalidateQueries({ queryKey: ['administrative-centers'] });
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
        <Label>Produtor</Label>
        {loadingProducers ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : (
          <Combobox
            options={producerOptions}
            value={watch('producer_id')}
            onValueChange={handleProducerChange}
            placeholder="Selecione o produtor"
            searchPlaceholder="Buscar produtor..."
          />
        )}
        {errors.producer_id && <p className="text-sm text-destructive">{errors.producer_id.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Fazenda</Label>
        {loadingFarms ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : (
          <Combobox
            options={farmOptions}
            value={watch('farm_id')}
            onValueChange={(v) => setValue('farm_id', v)}
            placeholder="Selecione a fazenda"
            searchPlaceholder="Buscar fazenda..."
          />
        )}
        {errors.farm_id && <p className="text-sm text-destructive">{errors.farm_id.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>CEI</Label>
        <Input {...register('cei')} placeholder="CEI" />
        {errors.cei && <p className="text-sm text-destructive">{errors.cei.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Inscrição Estadual</Label>
        <Input {...register('state_registration')} placeholder="Inscrição Estadual" />
        {errors.state_registration && <p className="text-sm text-destructive">{errors.state_registration.message}</p>}
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
