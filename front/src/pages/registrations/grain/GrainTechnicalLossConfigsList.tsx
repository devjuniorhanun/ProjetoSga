import { useQuery } from '@tanstack/react-query';
import { CrudResourcePage, CrudField } from '@/components/crud/CrudResourcePage';
import { StatusBadge } from '@/components/StatusBadge';
import { grainSupportService, grainTechnicalLossConfigsService } from '@/lib/api-services-grain';
import { formatDateBR, formatPercentage } from '@/lib/grain-format';
import { hasOverlappingEffectivePeriod } from '@/lib/grain-rules';
import type { GrainTechnicalLossConfig } from '@/types/grain';

export default function GrainTechnicalLossConfigsList() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['grain-technical-loss-configs'],
    queryFn: () => grainTechnicalLossConfigsService.getAll({ per_page: 25 }),
  });

  const { data: producers = [] } = useQuery({
    queryKey: ['grain-support-producers'],
    queryFn: grainSupportService.producers,
  });
  const { data: cultures = [] } = useQuery({
    queryKey: ['grain-support-cultures', 'all'],
    queryFn: grainSupportService.cultures,
  });

  const overlapError = (values: Record<string, string>) =>
    values.producer_id && values.culture_id && values.effective_from &&
    hasOverlappingEffectivePeriod(
      {
        id: values.id,
        producer_id: values.producer_id,
        culture_id: values.culture_id,
        effective_from: values.effective_from,
        effective_until: values.effective_until || null,
      },
      data,
    )
      ? 'Já existe uma vigência para este produtor e cultura no período informado.'
      : undefined;

  const fields: CrudField[] = [
    {
      name: 'producer_id',
      label: 'Produtor',
      type: 'combobox',
      required: true,
      options: producers.map((p) => ({ value: p.id, label: p.name })),
    },
    {
      name: 'culture_id',
      label: 'Cultura',
      type: 'combobox',
      required: true,
      options: cultures.map((c) => ({ value: c.id, label: c.name })),
    },
    {
      name: 'monthly_percentage',
      label: 'Percentual mensal (%)',
      type: 'number',
      step: '0.00001',
      required: true,
    },
    {
      name: 'effective_from',
      label: 'Vigência inicial',
      type: 'date',
      required: true,
      validate: (values) => overlapError(values),
    },
    {
      name: 'effective_until',
      label: 'Vigência final',
      type: 'date',
      validate: (values) =>
        values.effective_until && values.effective_until < values.effective_from
          ? 'A vigência final deve ser posterior à inicial.'
          : overlapError(values),
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
  ];

  return (
    <CrudResourcePage<GrainTechnicalLossConfig>
      title="Configurações de Quebra Técnica"
      description="Percentual mensal de quebra técnica por produtor e cultura"
      singular="Configuração de quebra técnica"
      queryKey="grain-technical-loss-configs"
      service={grainTechnicalLossConfigsService}
      data={data}
      isLoading={isLoading}
      searchKeys={['producer_name', 'culture_name']}
      defaultValues={{ status: 'A' }}
      toFormValues={(item) => ({ id: String(item.id) })}
      buildPayload={(values) => ({
        producer_id: values.producer_id,
        culture_id: values.culture_id,
        monthly_percentage: Number(String(values.monthly_percentage).replace(',', '.')) || 0,
        effective_from: values.effective_from,
        effective_until: values.effective_until || null,
        status: values.status,
      })}
      columns={[
        { key: 'producer_name', label: 'Produtor', render: (item) => item.producer_name ?? '-' },
        { key: 'culture_name', label: 'Cultura', render: (item) => item.culture_name ?? '-' },
        {
          key: 'monthly_percentage',
          label: 'Percentual mensal',
          render: (item) => formatPercentage(item.monthly_percentage),
        },
        { key: 'effective_from', label: 'Início', render: (item) => formatDateBR(item.effective_from) },
        {
          key: 'effective_until',
          label: 'Fim',
          render: (item) => (item.effective_until ? formatDateBR(item.effective_until) : '-'),
        },
        { key: 'status', label: 'Situação', render: (item) => <StatusBadge status={item.status} /> },
      ]}
      fields={fields}
    />
  );
}
