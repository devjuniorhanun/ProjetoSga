import { HarvestProductivityReportPage } from '@/components/reports/HarvestProductivityReportPage';

export default function ProductivityHarvestersPage() {
  return (
    <HarvestProductivityReportPage
      dimension="HARVESTER"
      title="Produtividade por Colhedor"
      description="Produção e produtividade por colhedor na safra."
      firstColumnLabel="Colhedor"
    />
  );
}
