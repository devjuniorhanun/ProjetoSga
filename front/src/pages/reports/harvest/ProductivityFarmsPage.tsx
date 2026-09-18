import { HarvestProductivityReportPage } from '@/components/reports/HarvestProductivityReportPage';

export default function ProductivityFarmsPage() {
  return (
    <HarvestProductivityReportPage
      dimension="FARM"
      title="Produtividade por Fazenda"
      description="Produção e produtividade consolidadas por fazenda na safra."
      firstColumnLabel="Fazenda"
    />
  );
}
