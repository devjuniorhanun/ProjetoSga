import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { applyApiErrors } from '@/lib/form-errors';
import {
  grainSupportService,
  grainTicketsService,
  grainTransportDriversService,
  grainTransportTrucksService,
  grainWarehousesService,
} from '@/lib/api-services-grain';
import { OWNERSHIP_TYPE_LABELS } from '@/lib/grain-labels';
import type { GrainOperationType, GrainTicket } from '@/types/grain';

const schema = z.object({
  ownership_type: z.enum(['OW', 'TP']),
  producer_id: z.string().min(1, 'Selecione o produtor.'),
  farm_id: z.string().min(1, 'Selecione a fazenda.'),
  crop_id: z.string().min(1, 'Selecione a safra.'),
  culture_id: z.string().min(1, 'Selecione a cultura.'),
  farm_state_registration_id: z.string().min(1, 'Selecione a inscrição estadual.'),
  buyer_id: z.string().optional(),
  grain_warehouse_id: z.string().min(1, 'Selecione o armazém.'),
  grain_storage_location_id: z.string().min(1, 'Selecione o local de armazenamento.'),
  grain_transport_driver_id: z.string().optional(),
  grain_transport_truck_id: z.string().min(1, 'Selecione o caminhão.'),
  notes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  operationType: GrainOperationType;
  onCreated: (ticket: GrainTicket) => void;
  onCancel?: () => void;
}

/** Abertura de portaria/ticket com selects dependentes. */
export function GrainTicketForm({ operationType, onCreated, onCancel }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ownership_type: 'OW',
      producer_id: '',
      farm_id: '',
      crop_id: '',
      culture_id: '',
      farm_state_registration_id: '',
      buyer_id: '',
      grain_warehouse_id: '',
      grain_storage_location_id: '',
      grain_transport_driver_id: '',
      grain_transport_truck_id: '',
      notes: '',
    },
  });

  const { watch, setValue, register, handleSubmit, formState } = form;
  const producerId = watch('producer_id');
  const farmId = watch('farm_id');
  const cropId = watch('crop_id');
  const cultureId = watch('culture_id');
  const warehouseId = watch('grain_warehouse_id');
  const truckId = watch('grain_transport_truck_id');

  const { data: producers = [] } = useQuery({
    queryKey: ['grain-support-producers'],
    queryFn: grainSupportService.producers,
  });
  const { data: farms = [] } = useQuery({
    queryKey: ['grain-support-farms', producerId],
    queryFn: () => grainSupportService.farms(producerId),
    enabled: !!producerId,
  });
  const { data: crops = [] } = useQuery({
    queryKey: ['grain-support-crops'],
    queryFn: grainSupportService.crops,
  });
  const { data: cultures = [] } = useQuery({
    queryKey: ['grain-support-cultures', cropId],
    queryFn: () => grainSupportService.culturesByCrop(cropId),
    enabled: !!cropId,
  });
  const { data: registrations = [] } = useQuery({
    queryKey: ['grain-support-registrations', producerId, farmId, cultureId],
    queryFn: () =>
      grainSupportService.stateRegistrations({
        producer_id: producerId,
        farm_id: farmId,
        culture_id: cultureId,
      }),
    enabled: !!producerId && !!farmId && !!cultureId,
  });
  const { data: buyers = [] } = useQuery({
    queryKey: ['grain-buyers'],
    queryFn: grainSupportService.buyers,
    enabled: operationType === 'EXIT',
  });
  const { data: warehouses = [] } = useQuery({
    queryKey: ['grain-warehouses', 'active'],
    queryFn: () => grainWarehousesService.getAll({ status: 'A', per_page: 100 }),
  });
  const { data: locations = [] } = useQuery({
    queryKey: ['grain-storage-locations', warehouseId],
    queryFn: () => grainSupportService.storageLocations(warehouseId),
    enabled: !!warehouseId,
  });
  const { data: drivers = [] } = useQuery({
    queryKey: ['grain-transport-drivers', 'active'],
    queryFn: () => grainTransportDriversService.getAll({ status: 'A', per_page: 200 }),
  });
  const { data: trucks = [] } = useQuery({
    queryKey: ['grain-transport-trucks', 'active'],
    queryFn: () => grainTransportTrucksService.getAll({ status: 'A', per_page: 200 }),
  });
  const { data: openTickets = [] } = useQuery({
    queryKey: ['grain-open-tickets-by-truck', truckId],
    queryFn: () => grainTicketsService.openByTruck(truckId),
    enabled: !!truckId,
  });

  // Limpa os filhos quando o pai muda.
  useEffect(() => {
    setValue('farm_id', '');
    setValue('farm_state_registration_id', '');
  }, [producerId, setValue]);
  useEffect(() => {
    setValue('farm_state_registration_id', '');
  }, [farmId, setValue]);
  useEffect(() => {
    setValue('culture_id', '');
    setValue('farm_state_registration_id', '');
  }, [cropId, setValue]);
  useEffect(() => {
    setValue('farm_state_registration_id', '');
  }, [cultureId, setValue]);
  useEffect(() => {
    setValue('grain_storage_location_id', '');
  }, [warehouseId, setValue]);

  const truckBlocked = truckId ? openTickets.length > 0 : false;

  const options = useMemo(
    () => ({
      producers: producers.map((p) => ({ value: p.id, label: p.name })),
      farms: farms.map((f) => ({ value: f.id, label: f.name })),
      crops: crops.map((c) => ({ value: c.id, label: c.name })),
      cultures: cultures.map((c) => ({ value: c.id, label: c.name })),
      registrations: registrations.map((r) => ({ value: r.id, label: r.state_registration })),
      buyers: buyers.map((b) => ({ value: b.id, label: b.name })),
      warehouses: warehouses.map((w) => ({ value: w.id, label: w.name })),
      locations: locations.map((l) => ({ value: l.id, label: l.name })),
      drivers: drivers.map((d) => ({ value: d.id, label: d.name })),
      trucks: trucks.map((t) => ({ value: t.id, label: t.license_plate })),
    }),
    [producers, farms, crops, cultures, registrations, buyers, warehouses, locations, drivers, trucks],
  );

  const onSubmit = async (values: FormValues) => {
    if (truckBlocked) {
      toast.error('Este caminhão já possui um ticket em aberto.');
      return;
    }
    if (operationType === 'EXIT' && !values.buyer_id) {
      toast.error('Selecione o comprador.');
      return;
    }
    setSubmitting(true);
    try {
      const ticket = await grainTicketsService.create({
        operation_type: operationType,
        ownership_type: values.ownership_type,
        producer_id: values.producer_id,
        farm_id: values.farm_id,
        farm_state_registration_id: values.farm_state_registration_id,
        crop_id: values.crop_id,
        culture_id: values.culture_id,
        buyer_id: values.buyer_id || null,
        grain_warehouse_id: values.grain_warehouse_id,
        grain_storage_location_id: values.grain_storage_location_id,
        grain_transport_driver_id: values.grain_transport_driver_id || null,
        grain_transport_truck_id: values.grain_transport_truck_id,
        notes: values.notes?.trim() || null,
      });
      toast.success('Ticket aberto com sucesso.');
      onCreated(ticket);
    } catch (error) {
      applyApiErrors(error, form.setError, { fallbackMessage: 'Não foi possível abrir o ticket.' });
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    name: keyof FormValues,
    label: string,
    list: Array<{ value: string; label: string }>,
    disabled = false,
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Combobox
        options={list}
        value={(watch(name) as string) || ''}
        onValueChange={(v) => setValue(name, v, { shouldValidate: true })}
        disabled={disabled}
        placeholder={`Selecione ${label.toLowerCase()}`}
      />
      {formState.errors[name] && (
        <p className="text-xs text-destructive">{String(formState.errors[name]?.message)}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Titularidade</Label>
          <Select
            value={watch('ownership_type')}
            onValueChange={(v) => setValue('ownership_type', v as 'OW' | 'TP')}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(OWNERSHIP_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {field('producer_id', 'Produtor', options.producers)}
        {field('farm_id', 'Fazenda', options.farms, !producerId)}
        {field('crop_id', 'Safra', options.crops)}
        {field('culture_id', 'Cultura', options.cultures, !cropId)}
        {field(
          'farm_state_registration_id',
          'Inscrição estadual',
          options.registrations,
          !producerId || !farmId || !cultureId,
        )}
        {operationType === 'EXIT' && field('buyer_id', 'Comprador', options.buyers)}
        {field('grain_warehouse_id', 'Armazém', options.warehouses)}
        {field('grain_storage_location_id', 'Local de armazenamento', options.locations, !warehouseId)}
        {field('grain_transport_driver_id', 'Motorista', options.drivers)}
        {field('grain_transport_truck_id', 'Caminhão', options.trucks)}
      </div>

      {truckBlocked && (
        <p className="text-sm text-destructive">
          Este caminhão já possui um ticket em aberto. Conclua o ticket anterior antes de abrir outro.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="ticket-notes">Observações</Label>
        <Input id="ticket-notes" {...register('notes')} placeholder="Opcional" />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={submitting || truckBlocked}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Abrir ticket
        </Button>
      </div>
    </form>
  );
}
