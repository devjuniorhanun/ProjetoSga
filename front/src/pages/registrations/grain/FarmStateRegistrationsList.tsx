import { useQuery } from '@tanstack/react-query';
import { CrudResourcePage, CrudField } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import { farmStateRegistrationsService, grainSupportService } from '@/lib/api-services-grain';
import type { FarmStateRegistration } from '@/types/grain';

export default function FarmStateRegistrationsList() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['farm-state-registrations'],
    queryFn: () => farmStateRegistrationsService.getAll({ per_page: 25 }),
  });

  const { data: producers = [] } = useQuery({
    queryKey: ['grain-support-producers'],
    queryFn: grainSupportService.producers,
  });
  const { data: farms = [] } = useQuery({
    queryKey: ['grain-support-farms', 'all'],
    queryFn: () => grainSupportService.farms(),
  });
  const fields: CrudField[] = [
    {
      name: 'producer_id',
      label: 'Produtor',
      type: 'combobox',
      required: true,
      options: producers.map((p) => ({ value: p.id, label: p.name })),
    },
    {
      name: 'farm_id',
      label: 'Fazenda',
      type: 'combobox',
      required: true,
      options: (values) =>
        farms
          .filter((f) => !values.producer_id || !f.producer_id || f.producer_id === values.producer_id)
          .map((f) => ({ value: f.id, label: f.name })),
    },
    { name: 'state_registration', label: 'Inscrição estadual', type: 'text', required: true },
    { name: 'description', label: 'Descrição', type: 'text' },
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
  ];

  return (
    <CrudResourcePage<FarmStateRegistration>
      title="Inscrições Estaduais"
      description="Inscrições estaduais por produtor e fazenda"
      singular="Inscrição estadual"
      queryKey="farm-state-registrations"
      service={farmStateRegistrationsService}
      data={data}
      isLoading={isLoading}
      searchKeys={['state_registration', 'producer_name', 'farm_name']}
      defaultValues={{ status: 'A' }}
      buildPayload={(values) => ({
        producer_id: values.producer_id,
        farm_id: values.farm_id,
        state_registration: values.state_registration,
        description: values.description || null,
        status: values.status,
      })}
      columns={[
        { key: 'state_registration', label: 'Inscrição' },
        { key: 'producer_name', label: 'Produtor', render: (item) => item.producer_name ?? '-' },
        { key: 'farm_name', label: 'Fazenda', render: (item) => item.farm_name ?? '-' },
        { key: 'description', label: 'Observações', render: (item) => item.description ?? '-' },
        { key: 'status', label: 'Situação', render: (item) => <StatusBadge status={item.status} /> },
      ]}
      fields={fields}
    />
  );
}
