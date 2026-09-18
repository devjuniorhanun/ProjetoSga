import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { DataTable } from '@/components/DataTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { applyApiErrors } from '@/lib/form-errors';
import { grainBalancesService, grainContractTransfersService, grainContractsService } from '@/lib/api-services-grain';
import { AuthorizationFlowDialog } from '@/components/grain/AuthorizationFlowDialog';
import { WeightInput } from '@/components/grain/WeightInput';
import { formatDateTimeBR, formatWeightKg } from '@/lib/grain-format';
import type { GrainContractTransfer } from '@/types/grain';

export default function GrainContractTransfersPage() {
  const queryClient = useQueryClient();
  const [balanceId, setBalanceId] = useState('');
  const [originContractId, setOriginContractId] = useState('');
  const [destinationContractId, setDestinationContractId] = useState('');
  const [weight, setWeight] = useState(0);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [betweenAuthOpen, setBetweenAuthOpen] = useState(false);
  const [reverseTarget, setReverseTarget] = useState<GrainContractTransfer | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ['grain-contract-transfers'],
    queryFn: () => grainContractTransfersService.getAll({ per_page: 25 }),
  });
  const { data: balances = [] } = useQuery({
    queryKey: ['grain-balances'],
    queryFn: () => grainBalancesService.getAll({ per_page: 100 }),
  });
  const { data: contracts = [] } = useQuery({
    queryKey: ['grain-contracts'],
    queryFn: () => grainContractsService.getAll({ per_page: 100 }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['grain-contract-transfers'] });
    queryClient.invalidateQueries({ queryKey: ['grain-balances'] });
    queryClient.invalidateQueries({ queryKey: ['grain-contracts'] });
  };

  const balanceOptions = balances.map((b) => ({
    value: b.id,
    label: `${b.producer_name ?? '-'} • ${b.culture_name ?? '-'} • disponível ${formatWeightKg(b.available_for_contract)}`,
  }));
  const contractOptions = contracts.map((c) => ({
    value: c.id,
    label: `${c.contract_number} • ${c.buyer_name ?? '-'}`,
  }));

  const transferToContract = async () => {
    if (!balanceId || !destinationContractId || weight <= 0) {
      toast.error('Selecione o saldo, o contrato de destino e informe o peso.');
      return;
    }
    setSaving(true);
    try {
      await grainContractTransfersService.create({
        grain_balance_id: balanceId,
        destination_contract_id: destinationContractId,
        weight,
        reason: reason.trim() || null,
      });
      toast.success('Saldo transferido para o contrato.');
      setWeight(0);
      setReason('');
      invalidate();
    } catch (error) {
      applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível transferir o saldo.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transferências de Saldo</h1>
        <p className="mt-1 text-muted-foreground">Vincule saldo disponível a contratos de venda</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Nova transferência</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Saldo de origem</Label>
              <Combobox options={balanceOptions} value={balanceId} onValueChange={setBalanceId} />
            </div>
            <div className="space-y-2">
              <Label>Contrato de origem (apenas entre contratos)</Label>
              <Combobox options={contractOptions} value={originContractId} onValueChange={setOriginContractId} />
            </div>
            <div className="space-y-2">
              <Label>Contrato de destino</Label>
              <Combobox options={contractOptions} value={destinationContractId} onValueChange={setDestinationContractId} />
            </div>
            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <WeightInput value={weight} onChange={setWeight} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Motivo</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Obrigatório entre contratos" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={transferToContract} disabled={saving || !!originContractId}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Transferir saldo para contrato
            </Button>
            <Button
              variant="outline"
              disabled={!originContractId || !destinationContractId || weight <= 0 || !reason.trim()}
              onClick={() => setBetweenAuthOpen(true)}
            >
              Transferir entre contratos
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="py-6 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable<GrainContractTransfer>
          data={data}
          exportTitle="Transferências de Saldo"
          searchKeys={['origin_contract_number', 'destination_contract_number', 'user_name']}
          columns={[
            { key: 'created_at', label: 'Data', render: (t) => (t.created_at ? formatDateTimeBR(t.created_at) : '-') },
            { key: 'origin_contract_number', label: 'Contrato de origem', render: (t) => t.origin_contract_number ?? '-' },
            { key: 'destination_contract_number', label: 'Contrato de destino', render: (t) => t.destination_contract_number ?? '-' },
            { key: 'weight', label: 'Peso', render: (t) => formatWeightKg(t.weight) },
            { key: 'reason', label: 'Motivo', render: (t) => t.reason ?? '-' },
            { key: 'user_name', label: 'Usuário', render: (t) => t.user_name ?? '-' },
            { key: 'reversed_at', label: 'Estornada em', render: (t) => (t.reversed_at ? formatDateTimeBR(t.reversed_at) : '-') },
          ]}
          actions={(t) => (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Estornar"
              disabled={!!t.reversed_at}
              onClick={() => setReverseTarget(t)}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          )}
        />
      )}

      <AuthorizationFlowDialog
        open={betweenAuthOpen}
        onOpenChange={setBetweenAuthOpen}
        operationType="CONTRACT_TO_CONTRACT_TRANSFER"
        resourceType="grain_contract_transfer"
        payloadRequested={{
          grain_balance_id: balanceId,
          origin_contract_id: originContractId,
          destination_contract_id: destinationContractId,
          weight,
          reason,
        }}
        onApproved={async (authorizationId) => {
          try {
            await grainContractTransfersService.betweenContracts({
              grain_balance_id: balanceId,
              origin_contract_id: originContractId,
              destination_contract_id: destinationContractId,
              weight,
              reason: reason.trim(),
              authorization_request_id: authorizationId,
            });
            toast.success('Transferência entre contratos concluída.');
            setBetweenAuthOpen(false);
            invalidate();
          } catch (error) {
            applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível transferir entre contratos.' });
          }
        }}
      />

      <AuthorizationFlowDialog
        open={!!reverseTarget}
        onOpenChange={(open) => !open && setReverseTarget(null)}
        operationType="REVERSE_CONTRACT_TRANSFER"
        resourceType="grain_contract_transfer"
        resourceId={reverseTarget?.id ?? null}
        payloadRequested={{ transfer_id: reverseTarget?.id }}
        description="O estorno da transferência exige aprovação administrativa."
        onApproved={async (authorizationId) => {
          if (!reverseTarget) return;
          try {
            await grainContractTransfersService.reverse(reverseTarget.id, {
              authorization_request_id: authorizationId,
              reason: 'Estorno autorizado',
            });
            toast.success('Transferência estornada.');
            setReverseTarget(null);
            invalidate();
          } catch (error) {
            applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível estornar a transferência.' });
          }
        }}
      />
    </div>
  );
}
