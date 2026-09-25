import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeightInput } from '@/components/grain/WeightInput';
import { harvestGrainTransfersService } from '@/lib/api-services-harvest-transfers';
import { cropsService, culturesService, producersService, warehousesService } from '@/lib/api-services';
import { applyApiErrors } from '@/lib/form-errors';
import {
  canQueryTransferBalance,
  kgToBags,
  transferExceedsBalance,
  formatNullableNumber,
} from '@/lib/report-rules';
import { formatWeight } from '@/lib/grain-format';
import type { HarvestGrainTransfer, HarvestGrainTransferPayload } from '@/types/harvest-transfers';

const schema = z.object({
  crop_id: z.string().min(1, 'Safra obrigatória'),
  producer_id: z.string().min(1, 'Produtor obrigatório'),
  owner_id: z.string().min(1, 'Proprietário obrigatório'),
  warehouse_id: z.string().min(1, 'Armazém obrigatório'),
  culture_id: z.string().min(1, 'Cultura obrigatória'),
  transfer_date: z.string().min(1, 'Data obrigatória'),
  quantity_kg: z.number().gt(0, 'Quantidade deve ser maior que zero'),
  observation: z.string().optional(),
  status: z.enum(['A', 'I']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: HarvestGrainTransfer | null;
  onSave: () => void;
  onCancel: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function GrainTransferForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const { handleSubmit, watch, setValue, register, setError, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? {
          crop_id: String(item.crop_id ?? ''),
          producer_id: String(item.producer_id ?? ''),
          owner_id: String(item.owner_id ?? ''),
          warehouse_id: String(item.warehouse_id ?? ''),
          culture_id: String(item.culture_id ?? ''),
          transfer_date: item.transfer_date?.slice(0, 10) ?? today(),
          quantity_kg: Number(item.quantity_kg) || 0,
          observation: item.observation ?? '',
          status: item.status ?? 'A',
        }
      : {
          crop_id: '',
          producer_id: '',
          owner_id: '',
          warehouse_id: '',
          culture_id: '',
          transfer_date: today(),
          quantity_kg: 0,
          observation: '',
          status: 'A',
        },
  });

  const cropId = watch('crop_id');
  const producerId = watch('producer_id');
  const warehouseId = watch('warehouse_id');
  const cultureId = watch('culture_id');
  const quantityKg = watch('quantity_kg');

  const { data: crops = [] } = useQuery({ queryKey: ['crops', 'active-options'], queryFn: () => cropsService.getAll({ status: 'A' }) });
  const { data: producers = [] } = useQuery({ queryKey: ['producers', 'active-options'], queryFn: () => producersService.getAll({ status: 'A' }) });
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses', 'active-options'], queryFn: () => warehousesService.getAll({ status: 'A' }) });
  const { data: cultures = [] } = useQuery({ queryKey: ['cultures', 'active-options'], queryFn: () => culturesService.getAll({ status: 'A' }) });

  // Somente proprietários com forma de pagamento "T" (transferência) são elegíveis.
  const ownersQuery = useQuery({
    queryKey: ['harvest-transfer-eligible-owners', cropId || null, producerId || null],
    queryFn: () =>
      harvestGrainTransfersService.eligibleOwners({
        crop_id: cropId || undefined,
        producer_id: producerId || undefined,
      }),
    enabled: !!cropId && !!producerId,
  });

  // O saldo disponível é sempre calculado pelo backend.
  const balanceQuery = useQuery({
    queryKey: ['harvest-transfer-balance', cropId, producerId, warehouseId, cultureId, item?.id ?? null],
    queryFn: () =>
      harvestGrainTransfersService.availableBalance({
        crop_id: cropId,
        producer_id: producerId,
        warehouse_id: warehouseId,
        culture_id: cultureId,
        grain_transfer_id: item?.id,
      }),
    enabled: canQueryTransferBalance(cropId, producerId, warehouseId, cultureId),
  });

  const availableKg = balanceQuery.data?.available_kg ?? null;

  const ownerOptions = useMemo(
    () =>
      (ownersQuery.data ?? [])
        .filter((o) => o.status !== 'I' || String(o.id) === String(item?.owner_id))
        .map((o) => ({
          value: String(o.id),
          label: o.name || o.owner_name || o.corporate_name || o.fantasy_name || String(o.id),
        })),
    [ownersQuery.data, item?.owner_id],
  );

  // Ao trocar safra ou produtor, o proprietário anterior pode deixar de ser elegível.
  useEffect(() => {
    if (!ownersQuery.data) return;
    const current = watch('owner_id');
    if (current && !ownersQuery.data.some((o) => String(o.id) === String(current))) {
      setValue('owner_id', '', { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownersQuery.data]);

  const exceeds = transferExceedsBalance(quantityKg, availableKg);

  const mutation = useMutation({
    mutationFn: (payload: HarvestGrainTransferPayload) =>
      item
        ? harvestGrainTransfersService.update(item.id, payload)
        : harvestGrainTransfersService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harvest-grain-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['harvest-transfer-balance'] });
      queryClient.invalidateQueries({ queryKey: ['harvest-consolidated-report'] });
    },
  });

  const onSubmit = async (data: FormData) => {
    if (exceeds) {
      setError('quantity_kg', { message: 'Quantidade maior que o saldo disponível.' });
      return;
    }
    // quantity_bags é calculado pelo backend e não é enviado.
    const payload: HarvestGrainTransferPayload = {
      crop_id: data.crop_id,
      producer_id: data.producer_id,
      owner_id: data.owner_id,
      warehouse_id: data.warehouse_id,
      culture_id: data.culture_id,
      transfer_date: data.transfer_date,
      quantity_kg: data.quantity_kg,
      observation: data.observation?.trim() || null,
      status: data.status,
    };
    setSubmitting(true);
    try {
      await mutation.mutateAsync(payload);
      toast.success(item ? 'Transferência atualizada!' : 'Transferência registrada!');
      onSave();
    } catch (error) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar transferência.' });
    } finally {
      setSubmitting(false);
    }
  };

  const noEligibleOwners =
    !!cropId && !!producerId && !ownersQuery.isFetching && ownerOptions.length === 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Safra</Label>
          <Combobox
            options={crops.filter((c) => c.status === 'A' || String(c.id) === String(item?.crop_id)).map((c) => ({ value: String(c.id), label: c.name }))}
            value={watch('crop_id')}
            onValueChange={(v) => {
              setValue('crop_id', v, { shouldValidate: true });
              setValue('owner_id', '', { shouldValidate: true });
            }}
            placeholder="Selecione a safra"
            searchPlaceholder="Buscar safra..."
          />
          {errors.crop_id && <p className="text-sm text-destructive">{errors.crop_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Produtor</Label>
          <Combobox
            options={producers
              .filter((p) => p.status === 'A' || String(p.id) === String(item?.producer_id))
              .map((p) => ({ value: String(p.id), label: p.owner_name || String(p.id) }))}
            value={watch('producer_id')}
            onValueChange={(v) => {
              setValue('producer_id', v, { shouldValidate: true });
              setValue('owner_id', '', { shouldValidate: true });
            }}
            placeholder="Selecione o produtor"
            searchPlaceholder="Buscar produtor..."
          />
          {errors.producer_id && <p className="text-sm text-destructive">{errors.producer_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Proprietário de destino</Label>
          <Combobox
            options={ownerOptions}
            value={watch('owner_id')}
            onValueChange={(v) => setValue('owner_id', v, { shouldValidate: true })}
            placeholder={cropId && producerId ? 'Selecione o proprietário' : 'Selecione safra e produtor primeiro'}
            searchPlaceholder="Buscar proprietário..."
            emptyText={ownersQuery.isFetching ? 'Carregando...' : 'Nenhum proprietário elegível'}
            disabled={!cropId || !producerId || ownersQuery.isFetching}
          />
          {noEligibleOwners && (
            <p className="text-sm text-destructive">
              Nenhum proprietário com forma de pagamento por transferência para esta safra e produtor.
            </p>
          )}
          {errors.owner_id && <p className="text-sm text-destructive">{errors.owner_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Armazém</Label>
          <Combobox
            options={warehouses
              .filter((w) => w.status === 'A' || String(w.id) === String(item?.warehouse_id))
              .map((w) => ({ value: String(w.id), label: w.name, keywords: [w.city].filter(Boolean) }))}
            value={watch('warehouse_id')}
            onValueChange={(v) => setValue('warehouse_id', v, { shouldValidate: true })}
            placeholder="Selecione o armazém"
            searchPlaceholder="Buscar armazém..."
          />
          {errors.warehouse_id && <p className="text-sm text-destructive">{errors.warehouse_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Cultura</Label>
          <Combobox
            options={cultures
              .filter((c) => c.status === 'A' || String(c.id) === String(item?.culture_id))
              .map((c) => ({ value: String(c.id), label: c.name }))}
            value={watch('culture_id')}
            onValueChange={(v) => setValue('culture_id', v, { shouldValidate: true })}
            placeholder="Selecione a cultura"
            searchPlaceholder="Buscar cultura..."
          />
          {errors.culture_id && <p className="text-sm text-destructive">{errors.culture_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="transfer_date">Data da transferência</Label>
          <Input id="transfer_date" type="date" {...register('transfer_date')} />
          {errors.transfer_date && <p className="text-sm text-destructive">{errors.transfer_date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity_kg">Quantidade (kg)</Label>
          <WeightInput
            id="quantity_kg"
            value={quantityKg}
            onChange={(v) => setValue('quantity_kg', v, { shouldValidate: true })}
            aria-label="Quantidade em quilos"
          />
          <p className="text-sm text-muted-foreground">
            {balanceQuery.isFetching
              ? 'Consultando saldo disponível...'
              : availableKg === null
                ? 'Informe safra, produtor, armazém e cultura para ver o saldo.'
                : `Saldo disponível: ${formatWeight(availableKg)} kg (${formatNullableNumber(balanceQuery.data?.available_bags)} sc)`}
          </p>
          <p className="text-sm text-muted-foreground">
            Equivale a {formatNullableNumber(kgToBags(quantityKg || 0))} sacas (prévia; o valor oficial é gravado pelo sistema).
          </p>
          {exceeds && (
            <p className="text-sm text-destructive">A quantidade ultrapassa o saldo disponível.</p>
          )}
          {errors.quantity_kg && <p className="text-sm text-destructive">{errors.quantity_kg.message}</p>}
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="observation">Observação</Label>
        <Textarea id="observation" rows={3} {...register('observation')} placeholder="Observação (opcional)" />
        {errors.observation && <p className="text-sm text-destructive">{errors.observation.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={submitting || exceeds || balanceQuery.isFetching}>
          {submitting ? 'Salvando...' : item ? 'Salvar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
