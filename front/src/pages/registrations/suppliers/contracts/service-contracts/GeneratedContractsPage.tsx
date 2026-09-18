import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/DataTable';
import { ContractPdfActions } from '@/components/contracts/ContractPdfActions';
import { serviceContractsService } from '@/lib/api-services-service-contracts';
import { cropsService, producersService, suppliersService } from '@/lib/api-services';
import {
  SERVICE_CONTRACT_TYPE_LABELS,
  type ServiceContract,
  type ServiceContractListFilters,
  type ServiceContractType,
} from '@/types/service-contracts';

const ALL = 'ALL';

const formatDate = (value?: string) =>
  value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '';

export default function GeneratedContractsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ServiceContractListFilters>({});

  const setFilter = (key: keyof ServiceContractListFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const { data = [], isLoading } = useQuery({
    queryKey: ['service-contracts', filters],
    queryFn: () => serviceContractsService.list(filters),
  });

  const { data: crops = [] } = useQuery({ queryKey: ['crops'], queryFn: cropsService.getAll });
  const { data: producers = [] } = useQuery({ queryKey: ['producers'], queryFn: producersService.getAll });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: suppliersService.getAll });

  const cropOptions = useMemo(
    () => crops.filter((c) => c.status === 'A').map((c) => ({ value: String(c.id), label: c.name })),
    [crops],
  );
  const producerOptions = useMemo(
    () =>
      producers
        .filter((p) => p.status === 'A')
        .map((p) => ({ value: String(p.id), label: p.owner_name || String(p.id) })),
    [producers],
  );
  const supplierOptions = useMemo(
    () =>
      suppliers
        .filter((s) => s.status === 'A')
        .map((s) => ({
          value: String(s.id),
          label: s.corporate_reason || s.fantasy_name || s.supplier_name,
        })),
    [suppliers],
  );

  const columns = [
    { key: 'contract_number', label: 'Nº do contrato' },
    {
      key: 'contract_type',
      label: 'Tipo',
      render: (item: ServiceContract) =>
        SERVICE_CONTRACT_TYPE_LABELS[item.contract_type] ?? item.contract_type,
    },
    { key: 'crop_name', label: 'Safra', render: (item: ServiceContract) => item.crop_name || '' },
    { key: 'producer_name', label: 'Produtor', render: (item: ServiceContract) => item.producer_name || '' },
    { key: 'supplier_name', label: 'Fornecedor contratado', render: (item: ServiceContract) => item.supplier_name || '' },
    {
      key: 'period',
      label: 'Período',
      render: (item: ServiceContract) =>
        `${formatDate(item.opening_date)} - ${formatDate(item.closing_date)}`,
    },
    {
      key: 'generated_at',
      label: 'Geração',
      render: (item: ServiceContract) => formatDate(item.generated_at || item.created_at),
    },
    {
      key: 'has_pdf',
      label: 'Situação do PDF',
      render: (item: ServiceContract) => (
        <Badge variant={item.has_pdf ? 'secondary' : 'outline'}>
          {item.has_pdf ? 'PDF gerado' : 'Sem PDF'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contratos gerados</h1>
        <p className="mt-1 text-muted-foreground">
          Histórico consolidado de contratos de transportadores e colhedores.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="space-y-1">
          <Label className="text-xs">Nº do contrato</Label>
          <Input
            value={filters.contract_number ?? ''}
            onChange={(e) => setFilter('contract_number', e.target.value)}
            placeholder="Número"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select
            value={filters.contract_type || ALL}
            onValueChange={(v) => setFilter('contract_type', v === ALL ? '' : (v as ServiceContractType))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {Object.entries(SERVICE_CONTRACT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Safra</Label>
          <Combobox
            options={cropOptions}
            value={filters.crop_id ?? ''}
            onValueChange={(v) => setFilter('crop_id', v)}
            placeholder="Todas"
            searchPlaceholder="Buscar safra..."
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Produtor</Label>
          <Combobox
            options={producerOptions}
            value={filters.producer_id ?? ''}
            onValueChange={(v) => setFilter('producer_id', v)}
            placeholder="Todos"
            searchPlaceholder="Buscar produtor..."
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Fornecedor</Label>
          <Combobox
            options={supplierOptions}
            value={filters.supplier_id ?? ''}
            onValueChange={(v) => setFilter('supplier_id', v)}
            placeholder="Todos"
            searchPlaceholder="Buscar fornecedor..."
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Situação</Label>
          <Select
            value={filters.status || ALL}
            onValueChange={(v) => setFilter('status', v === ALL ? '' : (v as 'A' | 'I'))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas</SelectItem>
              <SelectItem value="A">Ativo</SelectItem>
              <SelectItem value="I">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          data={data}
          columns={columns}
          searchKeys={['contract_number', 'producer_name', 'supplier_name']}
          searchPlaceholder="Buscar contrato..."
          actions={(item: ServiceContract) => (
            <ContractPdfActions
              contractId={item.id}
              contractNumber={item.contract_number}
              contractType={item.contract_type}
              hasPdf={item.has_pdf}
              onGenerated={() => queryClient.invalidateQueries({ queryKey: ['service-contracts'] })}
            />
          )}
        />
      )}
    </div>
  );
}
