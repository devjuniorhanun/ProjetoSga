import { useQuery } from '@tanstack/react-query';
import { CrudResourcePage, CrudField } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import { grainScaleChannelsService, grainScalesService } from '@/lib/api-services-grain';
import { formatWeightKg } from '@/lib/grain-format';
import { validateChannelLimits } from '@/lib/grain-rules';
import type { GrainScaleChannel } from '@/types/grain';

const toNumber = (value: string | undefined) => Number(String(value ?? '').replace(',', '.')) || 0;

const numericLimits = (values: Record<string, string>) => ({
  minimum_weight: toNumber(values.minimum_weight),
  maximum_weight: toNumber(values.maximum_weight),
  division_weight: toNumber(values.division_weight),
});

export default function GrainScaleChannelsList() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['grain-scale-channels'],
    queryFn: () => grainScaleChannelsService.getAll({ per_page: 25 }),
  });

  const { data: scales = [] } = useQuery({
    queryKey: ['grain-scales', 'active'],
    queryFn: () => grainScalesService.getAll({ status: 'A', per_page: 100 }),
  });

  const fields: CrudField[] = [
    {
      name: 'grain_scale_id',
      label: 'Balança',
      type: 'combobox',
      required: true,
      options: scales.map((s) => ({ value: s.id, label: s.name })),
    },
    { name: 'code', label: 'Código do canal', type: 'text', required: true },
    { name: 'description', label: 'Descrição', type: 'text' },
    {
      name: 'minimum_weight',
      label: 'Peso mínimo (kg)',
      type: 'number',
      step: '0.001',
      required: true,
      validate: (values) => validateChannelLimits(numericLimits(values)),
    },
    {
      name: 'maximum_weight',
      label: 'Peso máximo (kg)',
      type: 'number',
      step: '0.001',
      required: true,
      validate: (values) => validateChannelLimits(numericLimits(values)),
    },
    {
      name: 'division_weight',
      label: 'Divisão (kg)',
      type: 'number',
      step: '0.001',
      required: true,
      validate: (values) => validateChannelLimits(numericLimits(values)),
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
    {
      name: 'serial_configuration',
      label: 'Configuração serial (JSON)',
      type: 'textarea',
      fullWidth: true,
      placeholder: '{"baud_rate":9600,"data_bits":8,"parity":"none","stop_bits":1}',
      validate: (values) => {
        const raw = (values.serial_configuration ?? '').trim();
        if (!raw) return undefined;
        try {
          JSON.parse(raw);
          return undefined;
        } catch {
          return 'Informe um JSON válido.';
        }
      },
    },
  ];

  return (
    <CrudResourcePage<GrainScaleChannel>
      title="Canais da Balança"
      description="Canais de leitura configurados para cada balança"
      singular="Canal"
      queryKey="grain-scale-channels"
      service={grainScaleChannelsService}
      data={data}
      isLoading={isLoading}
      searchKeys={['code', 'description']}
      defaultValues={{ status: 'A' }}
      toFormValues={(item) => ({
        serial_configuration: item.serial_configuration
          ? JSON.stringify(item.serial_configuration, null, 2)
          : '',
      })}
      buildPayload={(values) => ({
        grain_scale_id: values.grain_scale_id,
        code: values.code,
        description: values.description || null,
        minimum_weight: Number(String(values.minimum_weight).replace(',', '.')) || 0,
        maximum_weight: Number(String(values.maximum_weight).replace(',', '.')) || 0,
        division_weight: Number(String(values.division_weight).replace(',', '.')) || 0,
        unit: 'kg',
        serial_configuration: values.serial_configuration?.trim()
          ? JSON.parse(values.serial_configuration)
          : null,
        status: values.status,
      })}
      columns={[
        { key: 'code', label: 'Canal' },
        {
          key: 'grain_scale_name',
          label: 'Balança',
          render: (item) => item.grain_scale_name ?? item.scale?.name ?? '-',
        },
        { key: 'minimum_weight', label: 'Mínimo', render: (item) => formatWeightKg(item.minimum_weight) },
        { key: 'maximum_weight', label: 'Máximo', render: (item) => formatWeightKg(item.maximum_weight) },
        { key: 'division_weight', label: 'Divisão', render: (item) => formatWeightKg(item.division_weight) },
        { key: 'status', label: 'Situação', render: (item) => <StatusBadge status={item.status} /> },
      ]}
      fields={fields}
    />
  );
}
