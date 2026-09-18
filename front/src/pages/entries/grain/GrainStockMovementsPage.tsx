import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/DataTable';
import { grainStockMovementsService } from '@/lib/api-services-grain';
import { formatDateTimeBR, formatWeightKg } from '@/lib/grain-format';
import { MOVEMENT_TYPE_LABELS, labelOr } from '@/lib/grain-labels';
import type { GrainStockMovement } from '@/types/grain';

export default function GrainStockMovementsPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['grain-stock-movements'],
    queryFn: () => grainStockMovementsService.getAll({ per_page: 50 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Movimentações de Estoque</h1>
        <p className="mt-1 text-muted-foreground">Histórico de todas as movimentações registradas pelo sistema</p>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable<GrainStockMovement>
          data={data}
          exportTitle="Movimentações de Estoque"
          searchKeys={['movement_type', 'reason', 'user_name']}
          columns={[
            { key: 'occurred_at', label: 'Data/hora', render: (m) => formatDateTimeBR(m.occurred_at) },
            { key: 'movement_type', label: 'Tipo', render: (m) => labelOr(MOVEMENT_TYPE_LABELS, m.movement_type) },
            { key: 'physical_quantity', label: 'Físico', render: (m) => formatWeightKg(m.physical_quantity) },
            { key: 'commercial_quantity', label: 'Comercial', render: (m) => formatWeightKg(m.commercial_quantity) },
            {
              key: 'physical_balance_after',
              label: 'Saldo físico após',
              render: (m) => (m.physical_balance_after != null ? formatWeightKg(m.physical_balance_after) : '-'),
            },
            {
              key: 'commercial_balance_after',
              label: 'Saldo comercial após',
              render: (m) => (m.commercial_balance_after != null ? formatWeightKg(m.commercial_balance_after) : '-'),
            },
            { key: 'reason', label: 'Motivo', render: (m) => m.reason ?? '-' },
            { key: 'user_name', label: 'Usuário', render: (m) => m.user_name ?? '-' },
          ]}
        />
      )}
    </div>
  );
}
