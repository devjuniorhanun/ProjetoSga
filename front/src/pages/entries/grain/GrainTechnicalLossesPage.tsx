import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { Loader2, Play, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { applyApiErrors } from '@/lib/form-errors';
import { grainTechnicalLossesService } from '@/lib/api-services-grain';
import { AuthorizationFlowDialog } from '@/components/grain/AuthorizationFlowDialog';
import { formatDateBR, formatPercentage, formatWeightKg } from '@/lib/grain-format';
import type { GrainTechnicalLoss } from '@/types/grain';

export default function GrainTechnicalLossesPage() {
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [reverseTarget, setReverseTarget] = useState<GrainTechnicalLoss | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ['grain-technical-losses'],
    queryFn: () => grainTechnicalLossesService.getAll({ per_page: 25 }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['grain-technical-losses'] });
    queryClient.invalidateQueries({ queryKey: ['grain-balances'] });
  };

  const process = async () => {
    setProcessing(true);
    try {
      const result = await grainTechnicalLossesService.process();
      toast.success(`Quebras técnicas processadas: ${result.processed ?? 0}.`);
      invalidate();
    } catch (error) {
      applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível processar as quebras técnicas.' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quebras Técnicas</h1>
          <p className="mt-1 text-muted-foreground">Perdas mensais calculadas pelo sistema sobre o saldo armazenado</p>
        </div>
        <Button onClick={process} disabled={processing}>
          {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
          Processar período
        </Button>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable<GrainTechnicalLoss>
          data={data}
          exportTitle="Quebras Técnicas"
          searchKeys={['producer_name', 'culture_name']}
          columns={[
            {
              key: 'reference',
              label: 'Referência',
              render: (l) => `${String(l.reference_month).padStart(2, '0')}/${l.reference_year}`,
            },
            { key: 'producer_name', label: 'Produtor', render: (l) => l.producer_name ?? '-' },
            { key: 'culture_name', label: 'Cultura', render: (l) => l.culture_name ?? '-' },
            { key: 'base_weight', label: 'Peso base', render: (l) => formatWeightKg(l.base_weight) },
            { key: 'percentage', label: 'Percentual', render: (l) => formatPercentage(l.percentage) },
            { key: 'loss_weight', label: 'Perda', render: (l) => formatWeightKg(l.loss_weight) },
            { key: 'period_start', label: 'Início', render: (l) => (l.period_start ? formatDateBR(l.period_start) : '-') },
            { key: 'reversed_at', label: 'Estornada', render: (l) => (l.reversed_at ? 'Sim' : 'Não') },
          ]}
          actions={(l) => (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Estornar"
              disabled={!!l.reversed_at}
              onClick={() => setReverseTarget(l)}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          )}
        />
      )}

      <AuthorizationFlowDialog
        open={!!reverseTarget}
        onOpenChange={(open) => !open && setReverseTarget(null)}
        operationType="REVERSE_TECHNICAL_LOSS"
        resourceType="grain_technical_loss"
        resourceId={reverseTarget?.id ?? null}
        payloadRequested={{ technical_loss_id: reverseTarget?.id }}
        description="O estorno da quebra técnica exige aprovação administrativa."
        onApproved={async (authorizationId) => {
          if (!reverseTarget) return;
          try {
            await grainTechnicalLossesService.reverse(reverseTarget.id, {
              authorization_request_id: authorizationId,
              reason: 'Estorno autorizado',
            });
            toast.success('Quebra técnica estornada.');
            setReverseTarget(null);
            invalidate();
          } catch (error) {
            applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível estornar a quebra técnica.' });
          }
        }}
      />
    </div>
  );
}
