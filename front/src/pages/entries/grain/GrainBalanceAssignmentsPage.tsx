import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { DataTable } from '@/components/DataTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { applyApiErrors } from '@/lib/form-errors';
import {
  farmStateRegistrationsService,
  grainBalanceAssignmentsService,
  grainBalancesService,
  grainSupportService,
} from '@/lib/api-services-grain';
import { AuthorizationFlowDialog } from '@/components/grain/AuthorizationFlowDialog';
import { WeightInput } from '@/components/grain/WeightInput';
import { formatDateTimeBR, formatWeightKg } from '@/lib/grain-format';
import { OWNERSHIP_TYPE_LABELS, labelOr } from '@/lib/grain-labels';
import type { GrainBalanceAssignment, OwnershipType } from '@/types/grain';

export default function GrainBalanceAssignmentsPage() {
  const queryClient = useQueryClient();
  const [originBalanceId, setOriginBalanceId] = useState('');
  const [producerId, setProducerId] = useState('');
  const [registrationId, setRegistrationId] = useState('');
  const [ownershipType, setOwnershipType] = useState<OwnershipType>('TP');
  const [weight, setWeight] = useState(0);
  const [reason, setReason] = useState('');
  const [authOpen, setAuthOpen] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ['grain-balance-assignments'],
    queryFn: () => grainBalanceAssignmentsService.getAll({ per_page: 25 }),
  });
  const { data: balances = [] } = useQuery({
    queryKey: ['grain-balances'],
    queryFn: () => grainBalancesService.getAll({ per_page: 100 }),
  });
  const { data: producers = [] } = useQuery({
    queryKey: ['grain-support-producers'],
    queryFn: grainSupportService.producers,
  });
  const { data: registrations = [] } = useQuery({
    queryKey: ['farm-state-registrations', producerId],
    queryFn: () => farmStateRegistrationsService.getAll({ producer_id: producerId, status: 'A' }),
    enabled: !!producerId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cessões entre Produtores</h1>
        <p className="mt-1 text-muted-foreground">Transferência de saldo entre produtores mediante autorização</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Nova cessão</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Saldo de origem</Label>
              <Combobox
                options={balances.map((b) => ({
                  value: b.id,
                  label: `${b.producer_name ?? '-'} • ${b.culture_name ?? '-'} • ${formatWeightKg(b.available_for_contract)}`,
                }))}
                value={originBalanceId}
                onValueChange={setOriginBalanceId}
              />
            </div>
            <div className="space-y-2">
              <Label>Produtor de destino</Label>
              <Combobox
                options={producers.map((p) => ({ value: p.id, label: p.name }))}
                value={producerId}
                onValueChange={(v) => {
                  setProducerId(v);
                  setRegistrationId('');
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Inscrição estadual de destino</Label>
              <Combobox
                options={registrations.map((r) => ({ value: r.id, label: r.state_registration }))}
                value={registrationId}
                onValueChange={setRegistrationId}
                disabled={!producerId}
              />
            </div>
            <div className="space-y-2">
              <Label>Titularidade de destino</Label>
              <Select value={ownershipType} onValueChange={(v) => setOwnershipType(v as OwnershipType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(OWNERSHIP_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <WeightInput value={weight} onChange={setWeight} />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>

          <Button
            disabled={!originBalanceId || !producerId || !registrationId || weight <= 0 || !reason.trim()}
            onClick={() => setAuthOpen(true)}
          >
            Solicitar autorização da cessão
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="py-6 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable<GrainBalanceAssignment>
          data={data}
          exportTitle="Cessões entre Produtores"
          searchKeys={['origin_producer_name', 'destination_producer_name', 'reason']}
          columns={[
            { key: 'created_at', label: 'Data', render: (a) => (a.created_at ? formatDateTimeBR(a.created_at) : '-') },
            { key: 'origin_producer_name', label: 'Produtor de origem', render: (a) => a.origin_producer_name ?? '-' },
            { key: 'destination_producer_name', label: 'Produtor de destino', render: (a) => a.destination_producer_name ?? '-' },
            {
              key: 'destination_ownership_type',
              label: 'Titularidade',
              render: (a) => labelOr(OWNERSHIP_TYPE_LABELS, a.destination_ownership_type),
            },
            { key: 'weight', label: 'Peso', render: (a) => formatWeightKg(a.weight) },
            { key: 'reason', label: 'Motivo' },
            { key: 'authorized_by_name', label: 'Autorizado por', render: (a) => a.authorized_by_name ?? '-' },
          ]}
        />
      )}

      <AuthorizationFlowDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        operationType="BALANCE_ASSIGNMENT"
        resourceType="grain_balance"
        resourceId={originBalanceId || null}
        payloadRequested={{
          origin_grain_balance_id: originBalanceId,
          destination_producer_id: producerId,
          destination_farm_state_registration_id: registrationId,
          destination_ownership_type: ownershipType,
          weight,
          reason,
        }}
        onApproved={async (authorizationId) => {
          try {
            await grainBalanceAssignmentsService.create({
              origin_grain_balance_id: originBalanceId,
              destination_producer_id: producerId,
              destination_farm_state_registration_id: registrationId,
              destination_ownership_type: ownershipType,
              weight,
              reason: reason.trim(),
              authorization_request_id: authorizationId,
            });
            toast.success('Cessão registrada.');
            setAuthOpen(false);
            setWeight(0);
            setReason('');
            queryClient.invalidateQueries({ queryKey: ['grain-balance-assignments'] });
            queryClient.invalidateQueries({ queryKey: ['grain-balances'] });
          } catch (error) {
            applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível registrar a cessão.' });
          }
        }}
      />
    </div>
  );
}
