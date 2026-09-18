/** Relatórios de colheita: consolidado e produtividade. Backend é a fonte dos números. */

export type HarvestProductivityDimension = 'PLOT' | 'FARM' | 'VARIETY' | 'HARVESTER';

export type HarvestReportOrderBy =
  | 'NAME_ASC'
  | 'PRODUCTIVITY_ASC'
  | 'PRODUCTIVITY_DESC'
  | 'PRODUCTION_DESC';

export interface HarvestReportFilterValues {
  date_from?: string;
  date_to?: string;
  producer_id?: string;
  owner_id?: string;
  warehouse_id?: string;
  culture_id?: string;
  farm_id?: string;
  plot_field_id?: string;
  variety_culture_id?: string;
  driver_id?: string;
  lanyard_id?: string;
  order_by?: HarvestReportOrderBy;
}

export interface HarvestReportOption {
  id: string;
  name: string;
  /** Campo secundário usado nos talhões (plot_fields). */
  field_name?: string;
  status?: 'A' | 'I';
}

export interface HarvestReportOptions {
  crops: HarvestReportOption[];
  active_crops: HarvestReportOption[];
  default_crop_id?: string | null;
  selected_crop_id?: string | null;
  producers: HarvestReportOption[];
  owners: HarvestReportOption[];
  farms: HarvestReportOption[];
  plot_fields: HarvestReportOption[];
  cultures: HarvestReportOption[];
  varieties: HarvestReportOption[];
  warehouses: HarvestReportOption[];
  drivers: HarvestReportOption[];
  harvesters: HarvestReportOption[];
  order_options?: { value: string; label: string }[];
}

export interface HarvestConsolidatedSummary {
  gross_weight_kg: number;
  gross_bags: number;
  discount_weight_kg: number;
  input_net_weight_kg: number;
  input_net_bags: number;
  transferred_weight_kg: number;
  transferred_bags: number;
  balance_weight_kg: number;
  balance_bags: number;
  shipping_value: number;
  entries_count: number;
  transfers_count: number;
  reconciled: boolean;
}

export interface HarvestConsolidatedRow {
  producer_id?: string;
  producer_name?: string;
  warehouse_id?: string;
  warehouse_name?: string;
  culture_id?: string;
  culture_name?: string;
  input_weight_kg: number;
  input_bags: number;
  transferred_weight_kg: number;
  transferred_bags: number;
  balance_weight_kg: number;
  balance_bags: number;
}

export interface HarvestConsolidatedEntry {
  id: string;
  release_date?: string;
  shipping_number?: string;
  control_number?: string;
  producer_name?: string;
  owner_name?: string;
  driver_name?: string;
  lanyard_name?: string;
  plot_field_name?: string;
  warehouse_name?: string;
  culture_name?: string;
  gross_weight?: number;
  discount_weight?: number;
  net_weight?: number;
  gross_bags?: number;
  liquid_bags?: number;
  shipping_value?: number;
}

export interface HarvestConsolidatedTransfer {
  id: string;
  transfer_date?: string;
  producer_name?: string;
  owner_name?: string;
  warehouse_name?: string;
  culture_name?: string;
  quantity_kg?: number;
  quantity_bags?: number;
  observation?: string | null;
}

export interface HarvestConsolidatedReport {
  report: string;
  crop?: { id: string; name: string };
  filters?: Record<string, unknown>;
  generated_at?: string;
  summary: HarvestConsolidatedSummary;
  rows?: HarvestConsolidatedRow[];
  consolidation?: HarvestConsolidatedRow[];
  entries?: HarvestConsolidatedEntry[];
  transfers?: HarvestConsolidatedTransfer[];
  warnings?: string[];
}

export interface HarvestProductivityCultureSummary {
  culture_id?: string;
  culture_name?: string;
  trips_count?: number;
  net_bags?: number;
  harvested_area_ha?: number | null;
  productivity_bags_ha?: number | null;
}

export interface HarvestProductivitySummary {
  trips_count: number;
  gross_weight_kg: number;
  discount_weight_kg: number;
  net_weight_kg: number;
  gross_bags: number;
  net_bags: number;
  harvested_area_ha: number | null;
  average_productivity_bags_ha: number | null;
  shipping_value: number;
  average_shipping_per_gross_bag: number | null;
  by_culture?: HarvestProductivityCultureSummary[];
}

export interface HarvestProductivityRow {
  id: string;
  name: string;
  culture_id?: string;
  culture_name?: string;
  trips_count: number;
  gross_weight_kg: number;
  discount_weight_kg: number;
  net_weight_kg: number;
  gross_bags: number;
  net_bags: number;
  harvested_area_ha: number | null;
  productivity_bags_ha: number | null;
  shipping_value: number;
}

export interface HarvestProductivityReport {
  report: string;
  dimension: HarvestProductivityDimension;
  crop?: { id: string; name: string };
  filters?: Record<string, unknown>;
  generated_at?: string;
  summary: HarvestProductivitySummary;
  area_method?: string;
  warnings?: string[];
  rows: HarvestProductivityRow[];
}
