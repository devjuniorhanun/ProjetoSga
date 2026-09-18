import { useQuery } from '@tanstack/react-query';
import { CrudResourcePage, CrudField } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import { grainTransportTrucksService } from '@/lib/api-services-grain';
import { isValidPlate, normalizePlate } from '@/lib/grain-rules';
import { formatWeightKg } from '@/lib/grain-format';
import type { GrainTransportTruck } from '@/types/grain';

const fields: CrudField[] = [
  {
    name: 'license_plate',
    label: 'Placa',
    type: 'text',
    required: true,
    placeholder: 'ABC1D23',
    validate: (values) =>
      isValidPlate(values.license_plate ?? '') ? undefined : 'Informe uma placa válida (ABC1D23 ou ABC1234).',
  },
  { name: 'description', label: 'Descrição', type: 'text' },
  { name: 'brand', label: 'Marca', type: 'text' },
  { name: 'model', label: 'Modelo', type: 'text' },
  { name: 'color', label: 'Cor', type: 'text' },
  {
    name: 'maximum_gross_weight',
    label: 'Peso bruto máximo (kg)',
    type: 'number',
    step: '0.001',
    required: true,
    validate: (values) =>
      Number(String(values.maximum_gross_weight ?? '').replace(',', '.')) > 0
        ? undefined
        : 'Informe o peso bruto máximo do caminhão.',
  },
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

export default function GrainTransportTrucksList() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['grain-transport-trucks'],
    queryFn: () => grainTransportTrucksService.getAll({ per_page: 25 }),
  });

  return (
    <CrudResourcePage<GrainTransportTruck>
      title="Caminhões da Balança"
      description="Veículos de transporte utilizados nas pesagens"
      singular="Caminhão"
      queryKey="grain-transport-trucks"
      service={grainTransportTrucksService}
      data={data}
      isLoading={isLoading}
      searchKeys={['license_plate', 'description', 'brand', 'model']}
      defaultValues={{ status: 'A' }}
      buildPayload={(values) => ({
        license_plate: normalizePlate(values.license_plate ?? ''),
        description: values.description || null,
        brand: values.brand || null,
        model: values.model || null,
        color: values.color || null,
        maximum_gross_weight: Number(String(values.maximum_gross_weight).replace(',', '.')) || 0,
        status: values.status,
        notes: values.notes || null,
      })}
      columns={[
        { key: 'license_plate', label: 'Placa' },
        { key: 'description', label: 'Descrição' },
        { key: 'brand', label: 'Marca' },
        { key: 'model', label: 'Modelo' },
        {
          key: 'maximum_gross_weight',
          label: 'PBT máximo',
          render: (item) => formatWeightKg(item.maximum_gross_weight),
        },
        { key: 'status', label: 'Situação', render: (item) => <StatusBadge status={item.status} /> },
      ]}
      fields={fields}
    />
  );
}
