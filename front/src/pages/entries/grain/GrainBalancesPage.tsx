import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/DataTable';
import { grainBalancesService } from '@/lib/api-services-grain';
import { formatWeightKg } from '@/lib/grain-format';
import { OWNERSHIP_TYPE_LABELS, labelOr } from '@/lib/grain-labels';
import type { GrainBalance } from '@/types/grain';

export default function GrainBalancesPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['grain-balances'],
    queryFn: () => grainBalancesService.getAll({ per_page: 50 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Posição de Estoque</h1>
        <p className="mt-1 text-muted-foreground">
          Saldos calculados pelo sistema por produtor, inscrição estadual e cultura
        </p>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable<GrainBalance>
          data={data}
          exportTitle="Posição de Estoque"
          searchKeys={['producer_name', 'culture_name', 'state_registration']}
          columns={[
            { key: 'producer_name', label: 'Produtor', render: (b) => b.producer_name ?? '-' },
            { key: 'state_registration', label: 'Inscrição', render: (b) => b.state_registration ?? '-' },
            { key: 'culture_name', label: 'Cultura', render: (b) => b.culture_name ?? '-' },
            { key: 'ownership_type', label: 'Titularidade', render: (b) => labelOr(OWNERSHIP_TYPE_LABELS, b.ownership_type) },
            { key: 'physical_balance', label: 'Saldo físico', render: (b) => formatWeightKg(b.physical_balance) },
            { key: 'pending_impurity_weight', label: 'Impureza pendente', render: (b) => formatWeightKg(b.pending_impurity_weight) },
            { key: 'usable_physical_balance', label: 'Físico utilizável', render: (b) => formatWeightKg(b.usable_physical_balance) },
            { key: 'commercial_balance', label: 'Saldo comercial', render: (b) => formatWeightKg(b.commercial_balance) },
            { key: 'contract_balance', label: 'Em contratos', render: (b) => formatWeightKg(b.contract_balance) },
            { key: 'available_for_contract', label: 'Disponível p/ contrato', render: (b) => formatWeightKg(b.available_for_contract) },
          ]}
        />
      )}
    </div>
  );
}
