import { HarvestProductivityReportPage } from '@/components/reports/HarvestProductivityReportPage';

export default function ProductivityPlotsPage() {
  return (
    <HarvestProductivityReportPage
      dimension="PLOT"
      title="Produtividade por Talhão"
      description="Produção e produtividade de cada talhão colhido na safra."
      firstColumnLabel="Talhão"
    />
  );
}
