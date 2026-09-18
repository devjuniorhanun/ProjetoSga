import api from './api';
import { buildPaidAccountParams } from './report-rules';
import { downloadReportPdf } from './report-download';
import type {
  PaidAccountAnalyticalReport,
  PaidAccountByCostCenterReport,
  PaidAccountCropOptions,
  PaidAccountReportFilterValues,
} from '@/types/financial-reports';

export const PAID_ACCOUNTS_REPORT_ENDPOINT = '/reports/financial/paid-accounts';
export const PAID_ACCOUNTS_REPORT_PDF_ENDPOINT = '/reports/financial/paid-accounts/pdf';
export const PAID_ACCOUNTS_BY_COST_CENTER_ENDPOINT =
  '/reports/financial/paid-accounts/by-cost-center';
export const PAID_ACCOUNTS_BY_COST_CENTER_PDF_ENDPOINT =
  '/reports/financial/paid-accounts/by-cost-center/pdf';
export const PAID_ACCOUNTS_CROP_OPTIONS_ENDPOINT =
  '/reports/financial/paid-accounts/crop-options';
export const PAID_ACCOUNTS_BY_CROP_ENDPOINT = '/reports/financial/paid-accounts/by-crop';
export const PAID_ACCOUNTS_BY_CROP_PDF_ENDPOINT = '/reports/financial/paid-accounts/by-crop/pdf';

function unwrap<T>(payload: unknown): T {
  return ((payload as { data?: unknown })?.data ?? payload) as T;
}

export const paidAccountReportsService = {
  analytical: async (
    filters: PaidAccountReportFilterValues,
  ): Promise<PaidAccountAnalyticalReport> => {
    const { data } = await api.get(PAID_ACCOUNTS_REPORT_ENDPOINT, {
      params: buildPaidAccountParams(filters),
    });
    return unwrap<PaidAccountAnalyticalReport>(data);
  },
  analyticalPdf: (filters: PaidAccountReportFilterValues) =>
    downloadReportPdf(
      PAID_ACCOUNTS_REPORT_PDF_ENDPOINT,
      buildPaidAccountParams(filters),
      'contas-pagas-analitico.pdf',
    ),
  byCostCenter: async (
    filters: PaidAccountReportFilterValues,
  ): Promise<PaidAccountByCostCenterReport> => {
    const { data } = await api.get(PAID_ACCOUNTS_BY_COST_CENTER_ENDPOINT, {
      params: buildPaidAccountParams(filters),
    });
    return unwrap<PaidAccountByCostCenterReport>(data);
  },
  byCostCenterPdf: (filters: PaidAccountReportFilterValues) =>
    downloadReportPdf(
      PAID_ACCOUNTS_BY_COST_CENTER_PDF_ENDPOINT,
      buildPaidAccountParams(filters),
      'contas-pagas-centro-de-custo.pdf',
    ),
  cropOptions: async (agriculturalYearId?: string): Promise<PaidAccountCropOptions> => {
    const { data } = await api.get(PAID_ACCOUNTS_CROP_OPTIONS_ENDPOINT, {
      params: agriculturalYearId ? { agricultural_year_id: agriculturalYearId } : undefined,
    });
    return unwrap<PaidAccountCropOptions>(data);
  },
  byCrop: async (filters: PaidAccountReportFilterValues): Promise<PaidAccountAnalyticalReport> => {
    const { data } = await api.get(PAID_ACCOUNTS_BY_CROP_ENDPOINT, {
      params: buildPaidAccountParams(filters),
    });
    return unwrap<PaidAccountAnalyticalReport>(data);
  },
  byCropPdf: (filters: PaidAccountReportFilterValues) =>
    downloadReportPdf(
      PAID_ACCOUNTS_BY_CROP_PDF_ENDPOINT,
      buildPaidAccountParams(filters),
      'contas-pagas-safra.pdf',
    ),
};
