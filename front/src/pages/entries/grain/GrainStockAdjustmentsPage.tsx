import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { applyApiErrors } from '@/lib/form-errors';
import { grainBalancesService, grainStockAdjustmentsService } from '@/lib/api-services-grain';
import { AuthorizationFlowDialog } from '@/components/grain/AuthorizationFlowDialog';
import { WeightInput } from '@/components/grain/WeightInput';
import { formatWeightKg } from '@/lib/grain-format';

export default function GrainStockAdjustmentsPage() {
  const queryClient = useQueryClient();
  const [balanceId, setBalanceId] = useState('');
  const [physical, setPhysical] = useState(0);
  const [commercial, setCommercial] = useState(0);
  const [reason, setReason] = useState('');
  const [authOpen, setAuthOpen] = useState(false);

  const { data: balances = [] } = useQuery({
    queryKey: ['grain-balances'],
    queryFn: () => grainBalancesService.getAll({ per_page: 100 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ajustes de Estoque</h1>
        <p className="mt-1 text-muted-foreground">
          Correções de saldo físico e comercial, sempre com autorização administrativa
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Novo ajuste</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Saldo</Label>
              <Combobox
                options={balances.map((b) => ({
                  value: b.id,
                  label: `${b.producer_name ?? '-'} • ${b.culture_name ?? '-'} • físico ${formatWeightKg(b.physical_balance)}`,
                }))}
                value={balanceId}
                onValueChange={setBalanceId}
              />
            </div>
            <div className="space-y-2">
              <Label>Quantidade física (kg)</Label>
              <WeightInput value={physical} onChange={setPhysical} allowNegative />
            </div>
            <div className="space-y-2">
              <Label>Quantidade comercial (kg)</Label>
              <WeightInput value={commercial} onChange={setCommercial} allowNegative />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Motivo</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>

          <Button
            disabled={!balanceId || !reason.trim() || (physical === 0 && commercial === 0)}
            onClick={() => setAuthOpen(true)}
          >
            Solicitar autorização do ajuste
          </Button>
        </CardContent>
      </Card>

      <AuthorizationFlowDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        operationType="STOCK_ADJUSTMENT"
        resourceType="grain_balance"
        resourceId={balanceId || null}
        payloadRequested={{
          grain_balance_id: balanceId,
          physical_quantity: physical,
          commercial_quantity: commercial,
          reason,
        }}
        onApproved={async (authorizationId) => {
          try {
            await grainStockAdjustmentsService.create({
              grain_balance_id: balanceId,
              physical_quantity: physical,
              commercial_quantity: commercial,
              reason: reason.trim(),
              authorization_request_id: authorizationId,
            });
            toast.success('Ajuste de estoque registrado.');
            setAuthOpen(false);
            setPhysical(0);
            setCommercial(0);
            setReason('');
            queryClient.invalidateQueries({ queryKey: ['grain-balances'] });
            queryClient.invalidateQueries({ queryKey: ['grain-stock-movements'] });
          } catch (error) {
            applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível registrar o ajuste.' });
          }
        }}
      />
    </div>
  );
}
