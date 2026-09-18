import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MatrixFreight, matrixFreightsService, cropsService } from '@/lib/api-services';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState, useMemo, useEffect } from 'react';
import { Info, Loader2 } from 'lucide-react';
import { applyApiErrors } from '@/lib/form-errors';
import {
  PRICE_CHANGE_WARNING,
  canEditMatrixFreightPrice,
  isEffectiveRangeValid,
  toDateTimeLocalInput,
  toLaravelDateTime,
} from '@/lib/matrix-freight-rules';

const schema = z
  .object({
    crop_id: z.string().min(1, 'Safra obrigatória'),
    block: z.string().trim().min(1, 'Bloco obrigatório').max(1, 'Bloco deve ter no máximo 1 caractere'),
    route: z.string().trim().min(1, 'Percurso obrigatório').max(1, 'Percurso deve ter no máximo 1 caractere'),
    price: z.coerce.number().gt(0, 'Preço deve ser maior que zero'),
    effective_from: z.string().min(1, 'Início da vigência obrigatório'),
    effective_to: z.string().optional(),
    status: z.enum(['A', 'I']),
  })
  .refine((data) => isEffectiveRangeValid(data.effective_from, data.effective_to || null), {
    path: ['effective_to'],
    message: 'O fim da vigência deve ser posterior ao início',
  });

type FormData = z.infer<typeof schema>;

interface Props {
  item?: MatrixFreight | null;
  onSave: () => void;
  onCancel: () => void;
}

const nowLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

export function MatrixFreightForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data: crops = [], isLoading: loadingCrops } = useQuery({
    queryKey: ['crops'],
    queryFn: cropsService.getAll,
  });

  const filteredCrops = useMemo(() => {
    const active = crops.filter((c) => c.status === 'A');
    if (item?.crop_id && !active.some((c) => c.id === item.crop_id)) {
      const current = crops.find((c) => c.id === item.crop_id);
      if (current) return [...active, current];
    }
    return active;
  }, [crops, item?.crop_id]);

  const priceEditable = item ? canEditMatrixFreightPrice(item) : true;

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? {
          crop_id: item.crop_id,
          block: item.block,
          route: item.route ?? '',
          price: item.price,
          effective_from: toDateTimeLocalInput(item.effective_from),
          effective_to: toDateTimeLocalInput(item.effective_to),
          status: item.status,
        }
      : { status: 'A', effective_from: nowLocal(), effective_to: '' },
  });

  const [priceDisplay, setPriceDisplay] = useState(() => {
    if (item?.price != null) return formatCurrencyValue(Math.round(item.price * 100));
    return '';
  });

  function formatCurrencyValue(cents: number): string {
    if (cents === 0) return '';
    return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const price = watch('price');
  const priceChanged = Boolean(item) && Number(price) !== Number(item?.price);

  // Uma nova vigência precisa de data/hora de início informada pelo usuário.
  useEffect(() => {
    if (priceChanged && !watch('effective_from')) {
      setValue('effective_from', nowLocal(), { shouldValidate: true });
    }
  }, [priceChanged, setValue, watch]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const cents = parseInt(raw || '0');
    setPriceDisplay(formatCurrencyValue(cents));
    setValue('price', cents / 100, { shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    if (loading) return;
    setLoading(true);
    const payload = {
      crop_id: data.crop_id,
      block: data.block,
      route: data.route,
      price: data.price,
      effective_from: toLaravelDateTime(data.effective_from),
      effective_to: toLaravelDateTime(data.effective_to || null),
      status: data.status,
    };
    try {
      if (item) {
        await matrixFreightsService.update(item.id, payload as Partial<MatrixFreight>);
        toast.success('Matriz de frete atualizada!');
      } else {
        await matrixFreightsService.create(payload as Omit<MatrixFreight, 'id'>);
        toast.success('Matriz de frete criada!');
      }
      // A atualização pode gerar uma nova versão: a listagem é recarregada por inteiro.
      await queryClient.invalidateQueries({ queryKey: ['matrix-freights'] });
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
        <Label>Safra</Label>
        {loadingCrops ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
        ) : (
          <Combobox
            options={filteredCrops.map((c) => ({ value: String(c.id), label: c.name }))}
            value={watch('crop_id')}
            onValueChange={(v) => setValue('crop_id', v, { shouldValidate: true })}
            placeholder="Selecione a safra"
            searchPlaceholder="Buscar safra..."
            emptyText="Nenhuma safra encontrada."
          />
        )}
        {errors.crop_id && <p className="text-sm text-destructive">{errors.crop_id.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Bloco</Label>
          <Input {...register('block')} maxLength={1} placeholder="A" />
          {errors.block && <p className="text-sm text-destructive">{errors.block.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Percurso</Label>
          <Input {...register('route')} maxLength={1} placeholder="1" />
          {errors.route && <p className="text-sm text-destructive">{errors.route.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Preço (R$)</Label>
        <Input value={priceDisplay} onChange={handlePriceChange} placeholder="0,00" disabled={!priceEditable} />
        {!priceEditable && (
          <p className="text-sm text-muted-foreground">Esta versão está encerrada e pode apenas ser consultada.</p>
        )}
        {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
      </div>

      {priceChanged && priceEditable && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{PRICE_CHANGE_WARNING}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{priceChanged ? 'Início da nova vigência' : 'Início da vigência'}</Label>
          <Input type="datetime-local" {...register('effective_from')} />
          {errors.effective_from && <p className="text-sm text-destructive">{errors.effective_from.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Fim da vigência (opcional)</Label>
          <Input type="datetime-local" {...register('effective_to')} />
          {errors.effective_to && <p className="text-sm text-destructive">{errors.effective_to.message}</p>}
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
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (item ? 'Salvar' : 'Criar')}
        </Button>
      </div>
    </form>
  );
}
