import type { ExportConfig } from '@/lib/export-utils';
import type { AgriculturalDefensiveOrder } from '@/lib/api-services-entries';

export const DEFENSIVE_ORDER_LAYOUT = {
  minimumProductRows: 15,
  controlSections: 3,
  operatorsPerSection: 2,
  pageWidthPt: 595.28,
  pageHeightPt: 841.89,
  pageInsetPt: 8,
  producerHeightPt: 30,
  propertyHeightPt: 26,
  titleHeightPt: 20,
  infoRowHeightPt: 14,
  productRowHeightPt: 14,
  controlHeaderHeightPt: 13,
  operatorRowHeightPt: 12,
  footerRowHeightPt: 13,
} as const;

export const DEFENSIVE_ORDER_TEXT = {
  titlePrefix: 'ORDEM DE SERVIÇO DE APLICAÇÃO DE DEFENSIVOS AGRÍCOLA',
  products: 'PRODUTOS',
  productQuantity: 'QTD. DE PRODUTOS POR BOMBA',
  control: 'CONTROLE DE APLICAÇÃO DATA',
  tanker: 'TANQUEIRO.:',
  fleet: 'Nº UNIPORT.:',
  operator: 'OPERADOR.:',
  previousApplications: 'APLICAÇÕES ANTERIORES',
  previousOrder: 'O.S (ANTERIOR).:',
  previousField: 'TALHÃO (ANTERIOR).:',
  previousMix: 'CALDAS(LT)(ANTERIOR).:',
  bombs: 'BOMBAS.:',
  currentMix: 'CALDA USADA (TALHÃO ATUAL).:',
  totalApplied: 'TOTAL DE BOMBAS APLICADAS.:',
  totalReal: 'TOTAL GERAL DE BOMBAS REAIS APLICADAS.:',
  closingDate: 'DATA FECHAMENTO O.S.:',
  credit: 'Sisdeve • www.sisdeve.com.br • Gerado em',
  page: 'Página 1 de 1',
} as const;

export interface DefensiveOrderDocumentProduct {
  key: string;
  position: number;
  name: string;
  pump: string;
  empty: boolean;
}

export interface DefensiveOrderDocumentOperator {
  name: string;
  fleet: string;
}

export interface DefensiveOrderControlSection {
  date: string;
  tanker: string;
  operators: [DefensiveOrderDocumentOperator, DefensiveOrderDocumentOperator];
}

export interface DefensiveOrderInfoCell {
  label: string;
  value: string;
}

export interface DefensiveServiceOrderDocumentModel {
  number: string;
  producerName: string;
  propertyName: string;
  producerColor: string;
  propertyColor: string;
  producerTextColor: string;
  propertyTextColor: string;
  title: string;
  infoRows: [DefensiveOrderInfoCell[], DefensiveOrderInfoCell[], DefensiveOrderInfoCell[]];
  flow: string;
  products: DefensiveOrderDocumentProduct[];
  controls: DefensiveOrderControlSection[];
  usedBomb: string;
  closingDate: string;
  generatedAt: string;
  compact: boolean;
}

const EMPTY_OPERATOR: DefensiveOrderDocumentOperator = { name: '', fleet: '' };
const MANUAL_DATE = '____/____/______';
const FALLBACK_HEADER_COLOR = '#f0f0f0';

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

export function formatDocumentNumber(value: unknown, fallback = '-'): string {
  if (!hasValue(value)) return fallback;
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(parsed)) return fallback;
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(parsed);
}

export function formatDocumentDate(value: unknown, fallback = '-'): string {
  if (!hasValue(value)) return fallback;
  const text = String(value);
  const datePart = text.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

export function normalizeHeaderColor(value?: string): string {
  if (!value) return FALLBACK_HEADER_COLOR;
  const color = value.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(color) || /^#[0-9a-fA-F]{6}$/.test(color)) return color;
  return FALLBACK_HEADER_COLOR;
}

export function readableTextColor(background: string): '#000000' | '#ffffff' {
  const short = /^#([0-9a-fA-F]{3})$/.exec(background);
  const hex = short
    ? short[1].split('').map((character) => `${character}${character}`).join('')
    : background.replace('#', '');
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.6 ? '#000000' : '#ffffff';
}

export function buildDefensiveServiceOrderDocument(
  order: AgriculturalDefensiveOrder,
  config?: ExportConfig,
  generatedAt = new Date(),
): DefensiveServiceOrderDocumentModel {
  const number = String(order.os_number || order.id || '-');
  const producerColor = normalizeHeaderColor(config?.producer_color);
  const propertyColor = normalizeHeaderColor(config?.property_color);
  const sortedProducts = [...(order.products ?? [])].sort(
    (left, right) => (left.order ?? Number.POSITIVE_INFINITY) - (right.order ?? Number.POSITIVE_INFINITY),
  );
  const totalRows = Math.max(DEFENSIVE_ORDER_LAYOUT.minimumProductRows, sortedProducts.length);
  const products: DefensiveOrderDocumentProduct[] = Array.from({ length: totalRows }, (_, index) => {
    const product = sortedProducts[index];
    return {
      key: product ? String(product.id ?? product.product_id ?? index) : `empty-${index}`,
      position: index + 1,
      name: product?.product_name ?? '',
      pump: product ? formatDocumentNumber(product.pump, '') : '',
      empty: !product,
    };
  });

  const operators = order.operators ?? [];
  const tankers = operators.filter((operator) => operator.function === 'T');
  const applicators = operators.filter((operator) => operator.function !== 'T');
  const applicationDate = formatDocumentDate(order.application_date);
  const controls = Array.from({ length: DEFENSIVE_ORDER_LAYOUT.controlSections }, (_, sectionIndex) => ({
    date: sectionIndex === 0 ? applicationDate : MANUAL_DATE,
    tanker: tankers[sectionIndex]?.operator_name ?? '',
    operators: [0, 1].map((offset) => {
      const operator = applicators[sectionIndex * DEFENSIVE_ORDER_LAYOUT.operatorsPerSection + offset];
      if (!operator) return EMPTY_OPERATOR;
      return {
        name: operator.operator_name ?? '',
        fleet: operator.fleet_name ?? String(operator.fleet_id ?? ''),
      };
    }) as [DefensiveOrderDocumentOperator, DefensiveOrderDocumentOperator],
  }));

  const administrative = (value: unknown) => hasValue(value) ? String(value) : '-';
  return {
    number,
    producerName: config?.producer_name ?? '',
    propertyName: config?.property_name ?? '',
    producerColor,
    propertyColor,
    producerTextColor: readableTextColor(producerColor),
    propertyTextColor: readableTextColor(propertyColor),
    title: `${DEFENSIVE_ORDER_TEXT.titlePrefix} ${administrative(order.crop_name)} Nº ${number}`,
    infoRows: [
      [
        { label: 'TALHÃO.:', value: administrative(order.field_name) },
        { label: 'CAP. BOMBA.:', value: formatDocumentNumber(order.pump_capacity) },
        { label: 'BOMBAS REAIS.:', value: formatDocumentNumber(order.used_bomb) },
      ],
      [
        { label: 'ÁREA.:', value: formatDocumentNumber(order.area) },
        { label: 'OPERAÇÃO.:', value: administrative(order.type_operation_name) },
        { label: 'DIFERENÇA(%).:', value: formatDocumentNumber(order.difference_bomb) },
      ],
      [
        { label: 'VOLUME BOMBA.:', value: formatDocumentNumber(order.pump_volume) },
        { label: 'BOMBA RECOMENDADA.:', value: formatDocumentNumber(order.recommended_pump) },
        { label: 'DATA.:', value: applicationDate },
      ],
    ],
    flow: formatDocumentNumber(order.flow),
    products,
    controls,
    usedBomb: formatDocumentNumber(order.used_bomb, ''),
    closingDate: order.closing_date ? formatDocumentDate(order.closing_date, '') : MANUAL_DATE,
    generatedAt: `${generatedAt.toLocaleDateString('pt-BR')} às ${generatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    compact: products.length > DEFENSIVE_ORDER_LAYOUT.minimumProductRows,
  };
}
