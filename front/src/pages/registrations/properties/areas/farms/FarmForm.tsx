import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Farm, farmsService, ownersService, producersService } from '@/lib/api-services';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { formatAreaDisplay, handleAreaMaskChange } from '@/lib/format-helpers';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  owner_id: z.string().min(1, 'Proprietário obrigatório'),
  producer_id: z.string().min(1, 'Produtor obrigatório'),
  name: z.string().trim().min(1, 'Nome obrigatório').max(200),
  total_area: z.coerce.number().min(0, 'Área deve ser positiva'),
  status: z.enum(['A', 'I']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: Farm | null;
  onSave: () => void;
  onCancel: () => void;
}

export function FarmForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [areaDisplay, setAreaDisplay] = useState(() => item?.total_area != null ? formatAreaDisplay(item.total_area) : '');

  const { data: owners = [], isLoading: loadingOwners } = useQuery({
    queryKey: ['owners'],
    queryFn: ownersService.getAll,
  });

  const { data: producers = [], isLoading: loadingProducers } = useQuery({
    queryKey: ['producers'],
    queryFn: producersService.getAll,
  });

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? { owner_id: item.owner_id, producer_id: item.producer_id, name: item.name, total_area: item.total_area, status: item.status }
      : { status: 'A' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (item) {
        await farmsService.update(item.id, data);
        toast.success('Fazenda atualizada!');
      } else {
        await farmsService.create(data as Omit<Farm, 'id'>);
        toast.success('Fazenda criada!');
      }
      queryClient.invalidateQueries({ queryKey: ['farms'] });
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
        <Label>Proprietário</Label>
        {loadingOwners ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
        ) : (
          <Combobox
            options={owners.filter((o) => o.status === 'A' || String(o.id) === String(item?.owner_id)).map((o) => ({ value: String(o.id), label: o.fantasy_name || o.corporate_name }))}
            value={watch('owner_id')}
            onValueChange={(v) => setValue('owner_id', v, { shouldValidate: true })}
            placeholder="Selecione o proprietário"
            searchPlaceholder="Buscar proprietário..."
            emptyText="Nenhum proprietário encontrado."
          />
        )}
        {errors.owner_id && <p className="text-sm text-destructive">{errors.owner_id.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Produtor</Label>
        {loadingProducers ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
        ) : (
          <Combobox
            options={producers.filter((p) => p.status === 'A' || String(p.id) === String(item?.producer_id)).map((p) => ({ value: String(p.id), label: p.owner_name || String(p.id) }))}
            value={watch('producer_id')}
            onValueChange={(v) => setValue('producer_id', v, { shouldValidate: true })}
            placeholder="Selecione o produtor"
            searchPlaceholder="Buscar produtor..."
            emptyText="Nenhum produtor encontrado."
          />
        )}
        {errors.producer_id && <p className="text-sm text-destructive">{errors.producer_id.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input {...register('name')} placeholder="Ex: Fazenda Boa Vista" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Área Total (ha)</Label>
        <Input
          value={areaDisplay}
          onChange={(e) => handleAreaMaskChange(e, setAreaDisplay, (v) => setValue('total_area', v, { shouldValidate: true }))}
          placeholder="Ex: 500,00"
        />
        {errors.total_area && <p className="text-sm text-destructive">{errors.total_area.message}</p>}
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
