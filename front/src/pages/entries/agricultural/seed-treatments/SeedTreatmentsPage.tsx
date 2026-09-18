import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { seedTreatmentsService } from '@/lib/api-services-agricultural-services';
import { SeedTreatmentFormDialog } from '@/components/agricultural/SeedTreatmentFormDialog';
import { SEED_TREATMENT_STATUS_LABELS } from '@/lib/agricultural-rules';
import { formatDate } from '@/lib/utils';
import type { SeedTreatment } from '@/types/agricultural';

export default function SeedTreatmentsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [completeId, setCompleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['seed-treatments'],
    queryFn: () => seedTreatmentsService.list({ per_page: 25 }),
  });

  const complete = useMutation({
    mutationFn: (id: string) => seedTreatmentsService.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seed-treatments'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      toast.success('Tratamento finalizado.');
      setCompleteId(null);
    },
    onError: (error: unknown) => {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      toast.error(response?.data?.message ?? 'Não foi possível finalizar o tratamento.');
      setCompleteId(null);
    },
  });

  const columns = [
    { key: 'id', label: 'Nº' },
    { key: 'crop_name', label: 'Safra' },
    { key: 'culture_name', label: 'Cultura' },
    {
      key: 'treatment_date',
      label: 'Data',
      render: (item: SeedTreatment) => formatDate(item.treatment_date),
    },
    { key: 'batch_count', label: 'Batidas' },
    {
      key: 'status',
      label: 'Situação',
      render: (item: SeedTreatment) => (
        <Badge variant="outline">{SEED_TREATMENT_STATUS_LABELS[item.status] ?? item.status}</Badge>
      ),
    },
  ];

  const actions = (item: SeedTreatment) =>
    item.status === 'DRAFT' ? (
      <Button variant="ghost" size="icon" aria-label="Finalizar" onClick={() => setCompleteId(item.id)}>
        <CheckCircle2 className="h-4 w-4" />
      </Button>
    ) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tratamento de Sementes</h1>
          <p className="text-muted-foreground">
            O rascunho não movimenta estoque; a finalização converte a semente e baixa os químicos.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo tratamento
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          data={data?.items ?? []}
          columns={columns}
          searchPlaceholder="Pesquisar tratamento..."
          searchKeys={['crop_name', 'culture_name']}
          actions={actions}
          exportTitle="Tratamento de Sementes"
        />
      )}

      <SeedTreatmentFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={!!completeId}
        onOpenChange={(open) => !open && setCompleteId(null)}
        title="Finalizar tratamento"
        description="A finalização converte a semente não tratada em tratada e baixa os produtos químicos. Deseja continuar?"
        confirmLabel="Finalizar"
        confirmVariant="success"
        onConfirm={() => completeId && complete.mutate(completeId)}
      />
    </div>
  );
}
