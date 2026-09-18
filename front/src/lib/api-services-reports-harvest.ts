import api from './api';
import { buildHarvestReportParams } from './report-rules';
import { downloadReportPdf } from './report-download';
import type {
  HarvestConsolidatedReport,
  HarvestProductivityDimension,
  HarvestProductivityReport,
  HarvestReportFilterValues,
  HarvestReportOptions,
} from '@/types/harvest-reports';

export const HARVEST_REPORT_OPTIONS_ENDPOINT = '/reports/harvest/productivity/options';

export const harvestReportEndpoints = {
  consolidated: (cropId: string) => `/reports/harvest/crops/${cropId}/consolidated`,
  consolidatedPdf: (cropId: string) => `/reports/harvest/crops/${cropId}/consolidated/pdf`,
  productivity: (cropId: string, path: string) =>
    `/reports/harvest/crops/${cropId}/productivity/${path}`,
  productivityPdf: (cropId: string, path: string) =>
    `/reports/harvest/crops/${cropId}/productivity/${path}/pdf`,
};

export const PRODUCTIVITY_DIMENSION_PATHS: Record<HarvestProductivityDimension, string> = {
  PLOT: 'plots',
  FARM: 'farms',
  VARIETY: 'varieties',
  HARVESTER: 'harvesters',
};

function unwrap<T>(payload: unknown): T {
  return ((payload as { data?: unknown })?.data ?? payload) as T;
}

export const harvestReportsService = {
  options: async (cropId?: string): Promise<HarvestReportOptions> => {
    const { data } = await api.get(HARVEST_REPORT_OPTIONS_ENDPOINT, {
      params: cropId ? { crop_id: cropId } : undefined,
    });
    return unwrap<HarvestReportOptions>(data);
  },
  consolidated: async (
    cropId: string,
    filters: HarvestReportFilterValues,
  ): Promise<HarvestConsolidatedReport> => {
    const { data } = await api.get(harvestReportEndpoints.consolidated(cropId), {
      params: buildHarvestReportParams(filters),
    });
    return unwrap<HarvestConsolidatedReport>(data);
  },
  consolidatedPdf: (cropId: string, filters: HarvestReportFilterValues) =>
    downloadReportPdf(
      harvestReportEndpoints.consolidatedPdf(cropId),
      buildHarvestReportParams(filters),
      'colheita-consolidado.pdf',
    ),
  productivity: async (
    dimension: HarvestProductivityDimension,
    cropId: string,
    filters: HarvestReportFilterValues,
  ): Promise<HarvestProductivityReport> => {
    const path = PRODUCTIVITY_DIMENSION_PATHS[dimension];
    const { data } = await api.get(harvestReportEndpoints.productivity(cropId, path), {
      params: buildHarvestReportParams(filters),
    });
    return unwrap<HarvestProductivityReport>(data);
  },
  productivityPdf: (
    dimension: HarvestProductivityDimension,
    cropId: string,
    filters: HarvestReportFilterValues,
  ) => {
    const path = PRODUCTIVITY_DIMENSION_PATHS[dimension];
    return downloadReportPdf(
      harvestReportEndpoints.productivityPdf(cropId, path),
      buildHarvestReportParams(filters),
      `colheita-produtividade-${path}.pdf`,
    );
  },
};
