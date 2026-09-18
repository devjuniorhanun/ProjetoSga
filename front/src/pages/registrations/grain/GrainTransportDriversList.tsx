import { useQuery } from '@tanstack/react-query';
import { CrudResourcePage, CrudField } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import { grainTransportDriversService } from '@/lib/api-services-grain';
import { formatCPF } from '@/lib/format-helpers';
import type { GrainTransportDriver } from '@/types/grain';

const fields: CrudField[] = [
  { name: 'name', label: 'Nome', type: 'text', required: true, fullWidth: true },
  { name: 'cpf', label: 'CPF', type: 'text', placeholder: '000.000.000-00' },
  { name: 'phone', label: 'Telefone', type: 'text', placeholder: '(00) 00000-0000' },
  {
    name: 'status',
    label: 'Situação',
    type: 'select',
    required: true,
    options: [
      { value: 'A', label: 'Ativo' },
      { value: 'I', label: 'Inativo' },
    ],
  },
  { name: 'notes', label: 'Observações', type: 'textarea', fullWidth: true },
];

export default function GrainTransportDriversList() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['grain-transport-drivers'],
    queryFn: () => grainTransportDriversService.getAll({ per_page: 25 }),
  });

  return (
    <CrudResourcePage<GrainTransportDriver>
      title="Motoristas da Balança"
      description="Motoristas identificados nas pesagens"
      singular="Motorista"
      queryKey="grain-transport-drivers"
      service={grainTransportDriversService}
      data={data}
      isLoading={isLoading}
      searchKeys={['name', 'cpf', 'phone']}
      defaultValues={{ status: 'A' }}
      buildPayload={(values) => ({
        name: values.name,
        cpf: values.cpf ? formatCPF(values.cpf) : null,
        phone: values.phone || null,
        status: values.status,
        notes: values.notes || null,
      })}
      columns={[
        { key: 'name', label: 'Nome' },
        { key: 'cpf', label: 'CPF', render: (item) => (item.cpf ? formatCPF(item.cpf) : '-') },
        { key: 'phone', label: 'Telefone', render: (item) => item.phone ?? '-' },
        { key: 'status', label: 'Situação', render: (item) => <StatusBadge status={item.status} /> },
      ]}
      fields={fields}
    />
  );
}
