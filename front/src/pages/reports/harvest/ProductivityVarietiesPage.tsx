import { HarvestProductivityReportPage } from '@/components/reports/HarvestProductivityReportPage';

export default function ProductivityVarietiesPage() {
  return (
    <HarvestProductivityReportPage
      dimension="VARIETY"
      title="Produtividade por Variedade"
      description="Produção e produtividade por variedade colhida na safra."
      firstColumnLabel="Variedade"
    />
  );
}
