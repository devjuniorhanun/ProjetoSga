import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, Pencil, CalendarCheck, Play, CheckCircle2 } from 'lucide-react';
import { agriculturalServicesService } from '@/lib/api-services-agricultural-services';
import { AgriculturalServiceFormDialog } from '@/components/agricultural/AgriculturalServiceFormDialog';
import { ServiceStatusBadge } from '@/components/agricultural/ServiceStatusBadge';
import {
  SERVICE_STATUS_LABELS,
  canCompleteService,
  canEditService,
  canPlanService,
  canStartService,
  totalArea,
} from '@/lib/agricultural-rules';
import { formatDate } from '@/lib/utils';
import type { AgriculturalService, AgriculturalServiceCategory } from '@/types/agricultural';

interface Props {
  category: AgriculturalServiceCategory;
  title: string;
  description: string;
}

export function AgriculturalServicesPage({ category, title, description }: Props) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AgriculturalService | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'plan' | 'start' | 'complete' } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['agricultural-services', category, status],
    queryFn: () =>
      agriculturalServicesService.list({
        category,
        ...(status ? { status } : {}),
        per_page: 25,
      }),
  });

  const rows = useMemo(() => data?.items ?? [], [data]);

  const transition = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'plan' | 'start' | 'complete' }) => {
      if (action === 'plan') return agriculturalServicesService.plan(id);
      if (action === 'start') return agriculturalServicesService.start(id);
      return agriculturalServicesService.complete(id);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agricultural-services'] });
      if (variables.action === 'complete') {
        queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
        queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      }
      toast.success('Situação do serviço atualizada.');
      setConfirmAction(null);
    },
    onError: (error: unknown) => {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      toast.error(response?.data?.message ?? 'Não foi possível atualizar o serviço.');
      setConfirmAction(null);
    },
  });

  const columns = [
    { key: 'id', label: 'Nº' },
    { key: 'agricultural_service_type_name', label: 'Tipo' },
    { key: 'crop_name', label: 'Safra' },
    { key: 'culture_name', label: 'Cultura' },
    {
      key: 'service_date',
      label: 'Data',
      render: (item: AgriculturalService) => formatDate(item.service_date),
    },
    {
      key: 'area',
      label: 'Área (ha)',
      render: (item: AgriculturalService) => totalArea(item.items ?? []),
    },
    { key: 'product_name', label: 'Produto' },
    {
      key: 'status',
      label: 'Situação',
      render: (item: AgriculturalService) => <ServiceStatusBadge status={item.status} />,
    },
  ];

  const actions = (item: AgriculturalService) => (
    <div className="flex gap-1">
      {canEditService(item.status) && (
        <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setFormOpen(true); }} aria-label="Editar">
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {canPlanService(item.status) && (
        <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ id: item.id, action: 'plan' })} aria-label="Planejar">
          <CalendarCheck className="h-4 w-4" />
        </Button>
      )}
      {canStartService(item.status) && (
        <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ id: item.id, action: 'start' })} aria-label="Iniciar">
          <Play className="h-4 w-4" />
        </Button>
      )}
      {canCompleteService(item.status) && (
        <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ id: item.id, action: 'complete' })} aria-label="Concluir">
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo serviço
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <Label>Situação</Label>
          <Combobox
            options={[{ value: '', label: 'Todas' }, ...Object.entries(SERVICE_STATUS_LABELS).map(([value, label]) => ({ value, label }))]}
            value={status}
            onValueChange={setStatus}
            placeholder="Todas"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          searchPlaceholder="Pesquisar serviço..."
          searchKeys={['agricultural_service_type_name', 'crop_name', 'culture_name', 'product_name']}
          actions={actions}
          exportTitle={title}
        />
      )}

      <AgriculturalServiceFormDialog
        category={category}
        open={formOpen}
        onOpenChange={setFormOpen}
        service={editing}
      />

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          confirmAction?.action === 'complete'
            ? 'Concluir serviço'
            : confirmAction?.action === 'start'
              ? 'Iniciar serviço'
              : 'Planejar serviço'
        }
        description={
          confirmAction?.action === 'complete'
            ? 'A conclusão baixa o estoque com as quantidades reais informadas. Deseja continuar?'
            : 'O planejamento e o início não movimentam estoque. Deseja continuar?'
        }
        confirmLabel="Confirmar"
        confirmVariant="success"
        onConfirm={() => confirmAction && transition.mutate(confirmAction)}
      />
    </div>
  );
}

export default AgriculturalServicesPage;
