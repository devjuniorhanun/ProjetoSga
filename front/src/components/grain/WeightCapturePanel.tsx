import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { applyApiErrors } from '@/lib/form-errors';
import {
  grainReadingsService,
  grainScaleChannelsService,
  grainScalesService,
  grainTicketsService,
} from '@/lib/api-services-grain';
import { canCaptureReading, formatWeightKg } from '@/lib/grain-format';
import { grossWeightWithinTruckCapacity } from '@/lib/grain-rules';
import { WEIGHING_STAGE_LABELS } from '@/lib/grain-labels';
import { WeightDisplay } from './WeightDisplay';
import { WeightInput } from './WeightInput';
import { AuthorizationFlowDialog } from './AuthorizationFlowDialog';
import { useGrainPermissions } from '@/hooks/use-grain-permissions';
import type { GrainTicket, WeighingStage } from '@/types/grain';

interface Props {
  ticket: GrainTicket;
  stage: WeighingStage;
  onCaptured: () => void;
  /** Rótulo da etapa no fluxo (bruto ou tara). */
  stageMeaning?: string;
}

export function WeightCapturePanel({ ticket, stage, onCaptured, stageMeaning }: Props) {
  const { can } = useGrainPermissions();
  const [scaleId, setScaleId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [manualOpen, setManualOpen] = useState(false);
  const [manualWeight, setManualWeight] = useState(0);
  const [manualAuthId, setManualAuthId] = useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const { data: scales = [] } = useQuery({
    queryKey: ['grain-scales', 'active'],
    queryFn: () => grainScalesService.getAll({ status: 'A', per_page: 100 }),
  });

  const { data: channels = [] } = useQuery({
    queryKey: ['grain-scale-channels', scaleId],
    queryFn: () => grainScaleChannelsService.getAll({ grain_scale_id: scaleId, status: 'A', per_page: 100 }),
    enabled: !!scaleId,
  });

  useEffect(() => {
    setChannelId('');
  }, [scaleId]);

  const { data: reading = null } = useQuery({
    queryKey: ['grain-latest-reading', channelId],
    queryFn: () => grainReadingsService.latest(channelId),
    enabled: !!channelId,
    refetchInterval: 1000,
    retry: false,
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const channel = useMemo(() => channels.find((c) => c.id === channelId), [channels, channelId]);
  const ready = canCaptureReading(reading, now);

  /** Na expedição a 2ª pesagem é o bruto e não pode superar a capacidade do caminhão. */
  const isGrossStage = ticket.operation_type === 'EXIT' && stage === 'SECOND';
  const capacityError = (weight: number) =>
    isGrossStage && !grossWeightWithinTruckCapacity(weight, ticket.maximum_gross_weight)
      ? `O peso bruto não pode superar a capacidade do caminhão (${formatWeightKg(ticket.maximum_gross_weight ?? 0)}).`
      : undefined;
  const readingCapacityError = reading ? capacityError(Number(reading.weight ?? 0)) : undefined;

  const capture = async () => {
    if (!reading || !ready) return;
    if (readingCapacityError) {
      toast.error(readingCapacityError);
      return;
    }
    setCapturing(true);
    try {
      await grainTicketsService.captureWeight(ticket.id, {
        stage,
        source: 'AUTOMATIC',
        reading_id: reading.id,
      });
      toast.success(`${WEIGHING_STAGE_LABELS[stage]} registrada.`);
      onCaptured();
    } catch (error) {
      applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível capturar o peso.' });
    } finally {
      setCapturing(false);
    }
  };

  const applyManual = async () => {
    if (!manualAuthId || !scaleId || !channelId || manualWeight <= 0) return;
    const manualCapacityError = capacityError(manualWeight);
    if (manualCapacityError) {
      toast.error(manualCapacityError);
      return;
    }
    setCapturing(true);
    try {
      await grainTicketsService.captureWeight(ticket.id, {
        stage,
        source: 'MANUAL',
        weight: manualWeight,
        grain_scale_id: scaleId,
        grain_scale_channel_id: channelId,
        authorization_request_id: manualAuthId,
      });
      toast.success('Peso manual aplicado.');
      setManualOpen(false);
      setManualAuthId(null);
      onCaptured();
    } catch (error) {
      applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível aplicar o peso manual.' });
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Balança</Label>
          <Select value={scaleId} onValueChange={setScaleId}>
            <SelectTrigger><SelectValue placeholder="Selecione a balança" /></SelectTrigger>
            <SelectContent>
              {scales.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Canal</Label>
          <Select value={channelId} onValueChange={setChannelId} disabled={!scaleId}>
            <SelectTrigger><SelectValue placeholder="Selecione o canal" /></SelectTrigger>
            <SelectContent>
              {channels.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {channel && (
        <p className="text-sm text-muted-foreground">
          Faixa do canal: {formatWeightKg(channel.minimum_weight)} até {formatWeightKg(channel.maximum_weight)} •
          divisão {formatWeightKg(channel.division_weight)}
        </p>
      )}

      <WeightDisplay reading={reading} now={now} />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="lg"
          className="min-w-64"
          disabled={!ready || capturing || !!readingCapacityError}
          onClick={capture}
        >
          {capturing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Scale className="mr-2 h-5 w-5" />}
          Capturar {WEIGHING_STAGE_LABELS[stage]}
          {stageMeaning ? ` (${stageMeaning})` : ''}
        </Button>
        {can('grain.weighing.manual.request') && (
          <Button variant="outline" onClick={() => setManualOpen((v) => !v)}>
            Solicitar peso manual
          </Button>
        )}
      </div>

      {readingCapacityError && (
        <p className="text-sm text-destructive">{readingCapacityError}</p>
      )}

      {!ready && channelId && (
        <p className="text-sm text-warning">
          A captura fica bloqueada enquanto a leitura estiver instável ou com mais de 30 segundos.
        </p>
      )}

      {manualOpen && (
        <div className="space-y-3 rounded-lg border border-dashed p-4">
          <p className="text-sm text-muted-foreground">
            O peso manual exige autorização de um administrador e justificativa.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Peso informado (kg)</Label>
              <WeightInput value={manualWeight} onChange={setManualWeight} />
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                disabled={!scaleId || !channelId || manualWeight <= 0}
                onClick={() => setAuthDialogOpen(true)}
              >
                Solicitar autorização
              </Button>
              <Button disabled={!manualAuthId || capturing} onClick={applyManual}>
                Aplicar peso manual
              </Button>
            </div>
          </div>
          {manualAuthId && (
            <p className="text-sm text-success">Autorização #{manualAuthId} aprovada.</p>
          )}
        </div>
      )}

      <AuthorizationFlowDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        operationType="MANUAL_WEIGHT"
        resourceType="grain_ticket"
        resourceId={ticket.id}
        payloadRequested={{
          stage,
          weight: manualWeight,
          grain_scale_id: scaleId,
          grain_scale_channel_id: channelId,
        }}
        onApproved={(id) => setManualAuthId(id)}
      />
    </div>
  );
}
