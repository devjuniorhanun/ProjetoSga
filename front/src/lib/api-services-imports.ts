import api from './api';

/**
 * Serviço de Importação de Dados Legados.
 *
 * Usa exclusivamente o cliente HTTP existente (src/lib/api.ts).
 * O frontend não trabalha com UUID: os identificadores usados são
 * apenas os IDs gerados pelo próprio SISDEVE AGRO.
 *
 * Toda a compatibilidade entre os formatos antigo (strings) e novo
 * (objetos estruturados) da API fica centralizada nos normalizadores
 * deste arquivo — os componentes visuais recebem sempre dados prontos.
 */

export type LegacyImportSeverity = 'info' | 'warning' | 'error' | string;

export interface LegacyImportFile {
  name?: string;
  file?: string;
  entity?: string;
  entity_label?: string;
  rows?: number;
  records?: number;
  columns?: string[];
  status?: string;
}

export interface LegacyImportEntity {
  name?: string;
  label?: string;
  records?: number;
}

export interface LegacyImportRelationship {
  entity?: string;
  label?: string;
  depends_on?: string | string[];
  parent?: string;
  child?: string;
  chain?: string[];
}

export interface LegacyImportWarning {
  message: string;
  file?: string | null;
  record?: string | number | null;
  severity?: LegacyImportSeverity;
}

export interface LegacyImportError {
  message: string;
  file?: string | null;
  record?: string | number | null;
}

export interface LegacyImportSummary {
  files?: number;
  records?: number;
  entities?: number;
  warnings?: number;
  errors?: number;
  processed?: number;
  imported?: number;
  skipped?: number;
}

export interface LegacyImportReport {
  message?: string;
  exception?: string;
  warnings?: unknown[];
  errors?: unknown[];
  [key: string]: unknown;
}

export interface LegacyImportPreview {
  file_name?: string;
  file_type?: string;
  summary?: LegacyImportSummary;
  files?: LegacyImportFile[];
  supported_files?: LegacyImportFile[];
  unsupported_files?: LegacyImportFile[];
  entities?: LegacyImportEntity[];
  relationships?: LegacyImportRelationship[];
  warnings?: LegacyImportWarning[];
  errors?: LegacyImportError[];
  message?: string;
}

export interface LegacyImportBatch {
  id?: number | string;
  batch?: number | string;
  file_name?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  user_name?: string;
  user?: { name?: string } | string;
  records?: number;
  processed_rows?: number;
  imported_rows?: number;
  failed_rows?: number;
  report?: LegacyImportReport;
  summary?: LegacyImportSummary;
  files?: LegacyImportFile[];
  unsupported_files?: LegacyImportFile[];
  entities?: LegacyImportEntity[];
  relationships?: LegacyImportRelationship[];
  warnings?: LegacyImportWarning[];
  errors?: LegacyImportError[];
  message?: string;
}

export interface LegacyImportHistoryFilters {
  start_date?: string;
  end_date?: string;
  status?: string;
  user?: string;
  file_name?: string;
}

export type LegacyWarningInput = LegacyImportWarning | string | Record<string, unknown>;
export type LegacyErrorInput = LegacyImportError | string | Record<string, unknown>;

const BASE = '/imports/legacy';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const firstText = (source: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return undefined;
};

const optionalText = (value: unknown): string | null | undefined => {
  if (typeof value === 'string' && value.trim() !== '') return value.trim();
  return undefined;
};

const optionalRecordRef = (value: unknown): string | number | null | undefined => {
  if (typeof value === 'number') return value;
  return optionalText(value);
};

const optionalNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

/** Normaliza um aviso vindo como string (formato antigo) ou objeto (formato atual). */
export function normalizeWarning(value: LegacyWarningInput, index = 0): LegacyImportWarning {
  if (typeof value === 'string') {
    return { message: value, severity: 'warning' };
  }
  const source = asRecord(value);
  const message =
    firstText(source, ['message', 'description', 'warning', 'detail', 'title']) ??
    `Aviso da importação #${index + 1}`;
  return {
    message,
    file: optionalText(source.file) ?? null,
    record: optionalRecordRef(source.record) ?? null,
    severity: firstText(source, ['severity']) ?? 'warning',
  };
}

/** Normaliza um erro vindo como string (formato antigo) ou objeto (formato atual). */
export function normalizeError(value: LegacyErrorInput, index = 0): LegacyImportError {
  if (typeof value === 'string') {
    return { message: value };
  }
  const source = asRecord(value);
  const message =
    firstText(source, ['message', 'description', 'error', 'detail', 'title']) ??
    `Erro da importação #${index + 1}`;
  return {
    message,
    file: optionalText(source.file) ?? null,
    record: optionalRecordRef(source.record) ?? null,
  };
}

const normalizeFile = (value: unknown): LegacyImportFile => {
  const source = asRecord(value);
  const name = firstText(source, ['name', 'file']);
  return {
    name,
    file: firstText(source, ['file']) ?? name,
    entity: firstText(source, ['entity']),
    entity_label: firstText(source, ['entity_label']),
    rows: optionalNumber(source.rows),
    records: optionalNumber(source.records) ?? optionalNumber(source.rows),
    columns: Array.isArray(source.columns)
      ? source.columns.filter((column): column is string => typeof column === 'string')
      : undefined,
    status: firstText(source, ['status']),
  };
};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const normalizeFiles = (value: unknown): LegacyImportFile[] => asArray(value).map(normalizeFile);

const collectWarnings = (payload: Record<string, unknown>): LegacyImportWarning[] => {
  const report = asRecord(payload.report);
  const raw = Array.isArray(payload.warnings)
    ? payload.warnings
    : asArray(report.warnings);
  return raw.map((item, index) => normalizeWarning(item as LegacyWarningInput, index));
};

const collectErrors = (payload: Record<string, unknown>): LegacyImportError[] => {
  const report = asRecord(payload.report);
  const raw = Array.isArray(payload.errors) ? payload.errors : asArray(report.errors);
  const errors = raw.map((item, index) => normalizeError(item as LegacyErrorInput, index));

  const status = String(payload.status ?? '').toUpperCase();
  const reportMessage = firstText(report, ['message']);
  if (status === 'FAILED' && reportMessage && !errors.some((e) => e.message === reportMessage)) {
    errors.push({ message: reportMessage });
  }
  return errors;
};

const normalizeSummary = (
  payload: Record<string, unknown>,
  files: LegacyImportFile[],
  warnings: LegacyImportWarning[],
  errors: LegacyImportError[]
): LegacyImportSummary => {
  const raw = asRecord(payload.summary);
  const totalRecords = files.reduce((total, file) => total + (file.records ?? 0), 0);
  return {
    files: optionalNumber(raw.files) ?? files.length,
    records: optionalNumber(raw.records) ?? totalRecords,
    entities: optionalNumber(raw.entities) ?? asArray(payload.entities).length,
    warnings: optionalNumber(raw.warnings) ?? warnings.length,
    errors: optionalNumber(raw.errors) ?? errors.length,
    processed: optionalNumber(raw.processed) ?? optionalNumber(payload.processed_rows),
    imported: optionalNumber(raw.imported) ?? optionalNumber(payload.imported_rows),
    skipped: optionalNumber(raw.skipped) ?? optionalNumber(payload.failed_rows),
  };
};

/** Normaliza a resposta da pré-visualização (formatos antigo e atual). */
export function normalizePreview(payload: unknown): LegacyImportPreview {
  const source = asRecord(payload);
  const files = normalizeFiles(
    Array.isArray(source.files) && source.files.length > 0 ? source.files : source.supported_files
  );
  const unsupported = normalizeFiles(source.unsupported_files);
  const warnings = collectWarnings(source);
  const errors = collectErrors(source);

  return {
    file_name: firstText(source, ['file_name']),
    file_type: firstText(source, ['file_type']),
    message: firstText(source, ['message']),
    files,
    supported_files: files,
    unsupported_files: unsupported,
    entities: asArray(source.entities) as LegacyImportEntity[],
    relationships: asArray(source.relationships) as LegacyImportRelationship[],
    warnings,
    errors,
    summary: normalizeSummary(source, files, warnings, errors),
  };
}

/** Normaliza um lote de importação (execução, histórico e detalhes). */
export function normalizeBatch(payload: unknown): LegacyImportBatch {
  const source = asRecord(payload);
  const files = normalizeFiles(
    Array.isArray(source.files) && source.files.length > 0 ? source.files : source.supported_files
  );
  const warnings = collectWarnings(source);
  const errors = collectErrors(source);

  return {
    ...(source as LegacyImportBatch),
    files,
    unsupported_files: normalizeFiles(source.unsupported_files),
    warnings,
    errors,
    summary: normalizeSummary(source, files, warnings, errors),
  };
}

const toFormData = (file: File, extra?: Record<string, string>) => {
  const formData = new FormData();
  formData.append('file', file);
  Object.entries(extra ?? {}).forEach(([key, value]) => formData.append(key, value));
  return formData;
};

/**
 * Monta o multipart do envio: um arquivo vai em `file`,
 * vários arquivos vão em `files[]`. Nunca os dois ao mesmo tempo.
 */
export function buildImportFormData(files: File[]): FormData {
  const formData = new FormData();
  if (files.length === 1) {
    formData.append('file', files[0], files[0].name);
  } else {
    files.forEach((file) => formData.append('files[]', file, file.name));
  }
  return formData;
}

/** Desembrulha respostas no formato { data: ... } usadas pela API. */
const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

export const legacyImportsService = {
  preview: async (file: File): Promise<LegacyImportPreview> => {
    const { data } = await api.post(`${BASE}/preview`, toFormData(file));
    return normalizePreview(unwrap(data));
  },

  run: async (files: File[]): Promise<LegacyImportBatch> => {
    if (!files.length) throw new Error('Selecione ao menos um arquivo.');
    // Content-Type nunca é definido manualmente: o boundary é gerado pelo navegador.
    const { data } = await api.post(BASE, buildImportFormData(files));
    return normalizeBatch(unwrap(data));
  },

  history: async (filters: LegacyImportHistoryFilters = {}): Promise<LegacyImportBatch[]> => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
    );
    const { data } = await api.get(BASE, { params });
    const unwrapped = unwrap<LegacyImportBatch[] | { data?: LegacyImportBatch[] }>(data);
    const list = Array.isArray(unwrapped) ? unwrapped : unwrapped?.data ?? [];
    return list.map(normalizeBatch);
  },

  getById: async (batch: string | number): Promise<LegacyImportBatch> => {
    const { data } = await api.get(`${BASE}/${batch}`);
    return normalizeBatch(unwrap(data));
  },
};

/** Extensões aceitas pelo módulo de importação. */
export const ACCEPTED_IMPORT_EXTENSIONS = ['.csv', '.zip', '.txt'] as const;

/** Tamanho máximo aceito pelo backend (50 MB). */
export const MAX_IMPORT_FILE_BYTES = 50 * 1024 * 1024;

export function isAcceptedImportFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_IMPORT_EXTENSIONS.some((ext) => name.endsWith(ext));
}

/** Quantidade máxima de arquivos por envio. */
export const MAX_IMPORT_FILES = 30;

const isZip = (file: File) => file.name.toLowerCase().endsWith('.zip');

/**
 * Valida a seleção completa antes do envio.
 * Retorna a mensagem do primeiro problema encontrado ou null quando está tudo certo.
 */
export function validateImportSelection(files: File[]): string | null {
  if (!files.length) return 'Selecione ao menos um arquivo.';
  if (files.length > MAX_IMPORT_FILES) {
    return `Selecione no máximo ${MAX_IMPORT_FILES} arquivos por envio.`;
  }

  const invalid = files.find((file) => !isAcceptedImportFile(file));
  if (invalid) return `Formato inválido: ${invalid.name}. Aceitos: .csv, .txt ou .zip.`;

  const tooBig = files.find((file) => file.size > MAX_IMPORT_FILE_BYTES);
  if (tooBig) return `O arquivo ${tooBig.name} ultrapassa o limite de 50 MB.`;

  if (files.length > 1 && files.some(isZip)) {
    return 'Arquivos ZIP devem ser enviados sozinhos. Para envio múltiplo, use apenas CSV ou TXT.';
  }

  const names = new Set<string>();
  for (const file of files) {
    const key = file.name.toLowerCase();
    if (names.has(key)) return `Arquivo duplicado na seleção: ${file.name}.`;
    names.add(key);
  }

  return null;
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${units[index]}`;
}

/** Traduções dos status de lote retornados pelo backend. */
export const LEGACY_IMPORT_STATUS_LABELS: Record<string, string> = {
  PROCESSING: 'Processando',
  COMPLETED: 'Concluída',
  FAILED: 'Falhou',
};

export function legacyImportStatusLabel(status?: string): string {
  if (!status) return '—';
  return LEGACY_IMPORT_STATUS_LABELS[status.toUpperCase()] ?? status;
}

export const LEGACY_IMPORT_SEVERITY_LABELS: Record<string, string> = {
  warning: 'Aviso',
  info: 'Informação',
  error: 'Erro',
};

export function legacyImportSeverityLabel(severity?: string): string | undefined {
  if (!severity) return undefined;
  return LEGACY_IMPORT_SEVERITY_LABELS[severity.toLowerCase()] ?? severity;
}
