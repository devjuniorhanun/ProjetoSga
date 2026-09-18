import { describe, it, expect } from 'vitest';
import {
  normalizeWarning,
  normalizeError,
  normalizePreview,
  normalizeBatch,
  isAcceptedImportFile,
  MAX_IMPORT_FILE_BYTES,
  MAX_IMPORT_FILES,
  buildImportFormData,
  validateImportSelection,
  legacyImportStatusLabel,
} from './api-services-imports';

const csv = (name: string, size = 10) =>
  new File([new Uint8Array(size)], name, { type: 'text/csv' });

describe('buildImportFormData', () => {
  it('usa o campo file quando há um único CSV', () => {
    const form = buildImportFormData([csv('safras.csv')]);
    expect(form.get('file')).toBeInstanceOf(File);
    expect(form.getAll('files[]')).toHaveLength(0);
  });

  it('usa o campo file quando há um único ZIP', () => {
    const form = buildImportFormData([new File(['x'], 'dados.zip')]);
    expect((form.get('file') as File).name).toBe('dados.zip');
  });

  it('usa files[] quando há vários arquivos e nunca envia file junto', () => {
    const form = buildImportFormData([csv('a.csv'), csv('b.csv'), csv('c.csv')]);
    expect(form.getAll('files[]')).toHaveLength(3);
    expect(form.get('file')).toBeNull();
  });

  it('não depende da ordem de seleção', () => {
    const names = (form: FormData) => (form.getAll('files[]') as File[]).map((f) => f.name).sort();
    expect(names(buildImportFormData([csv('a.csv'), csv('b.csv')]))).toEqual(
      names(buildImportFormData([csv('b.csv'), csv('a.csv')]))
    );
  });
});

describe('validateImportSelection', () => {
  it('bloqueia seleção vazia', () => {
    expect(validateImportSelection([])).toMatch(/ao menos um arquivo/);
  });

  it('recusa arquivo acima de 50 MB', () => {
    const big = new File(['x'], 'grande.csv');
    Object.defineProperty(big, 'size', { value: MAX_IMPORT_FILE_BYTES + 1 });
    expect(validateImportSelection([big])).toMatch(/50 MB/);
  });

  it('recusa mais de 30 arquivos', () => {
    const many = Array.from({ length: MAX_IMPORT_FILES + 1 }, (_, i) => csv(`arquivo-${i}.csv`));
    expect(validateImportSelection(many)).toMatch(/no máximo 30/);
  });

  it('recusa ZIP acompanhado de outro arquivo', () => {
    expect(validateImportSelection([csv('a.csv'), new File(['x'], 'b.zip')])).toMatch(/ZIP/);
  });

  it('recusa nomes duplicados ignorando maiúsculas', () => {
    expect(validateImportSelection([csv('a.csv'), csv('A.CSV')])).toMatch(/duplicado/);
  });

  it('aceita vários CSVs válidos', () => {
    expect(validateImportSelection([csv('a.csv'), csv('b.txt')])).toBeNull();
  });
});

describe('normalizeWarning', () => {
  it('aceita warnings como string', () => {
    expect(normalizeWarning('Safra sem ano agrícola')).toEqual({
      message: 'Safra sem ano agrícola',
      severity: 'warning',
    });
  });

  it('aceita objetos com message', () => {
    const result = normalizeWarning({
      message: 'CSV sem agricultural_year_id',
      file: 'safras.csv',
      record: null,
      severity: 'warning',
    });
    expect(result.message).toBe('CSV sem agricultural_year_id');
    expect(result.file).toBe('safras.csv');
    expect(result.severity).toBe('warning');
  });

  it('usa description como fallback', () => {
    expect(normalizeWarning({ description: 'Coluna extra ignorada' }).message).toBe(
      'Coluna extra ignorada'
    );
  });

  it('usa texto numerado como último recurso', () => {
    expect(normalizeWarning({}, 2).message).toBe('Aviso da importação #3');
  });
});

describe('normalizeError', () => {
  it('aceita string e fallback numerado', () => {
    expect(normalizeError('Falhou').message).toBe('Falhou');
    expect(normalizeError({}, 0).message).toBe('Erro da importação #1');
    expect(normalizeError({ detail: 'Coluna ausente' }).message).toBe('Coluna ausente');
  });
});

describe('normalizePreview', () => {
  it('usa supported_files como fallback e rows como registros', () => {
    const preview = normalizePreview({
      supported_files: [{ file: 'safras.csv', rows: 25, columns: ['id'], status: 'SUPPORTED' }],
      warnings: ['aviso antigo'],
    });
    expect(preview.files?.[0].name).toBe('safras.csv');
    expect(preview.files?.[0].records).toBe(25);
    expect(preview.warnings?.[0].message).toBe('aviso antigo');
    expect(preview.summary?.records).toBe(25);
  });

  it('preserva files quando vem diretamente e summary com zeros', () => {
    const preview = normalizePreview({
      files: [{ name: 'produtores.csv', records: 0 }],
      summary: { files: 1, records: 0, entities: 0, warnings: 0, errors: 0 },
    });
    expect(preview.files).toHaveLength(1);
    expect(preview.summary).toMatchObject({ records: 0, warnings: 0, errors: 0 });
  });
});

describe('normalizeBatch', () => {
  it('normaliza report.warnings de lotes antigos', () => {
    const batch = normalizeBatch({
      id: 9,
      status: 'COMPLETED',
      report: { warnings: ['aviso 1', 'aviso 2'] },
    });
    expect(batch.warnings?.map((w) => w.message)).toEqual(['aviso 1', 'aviso 2']);
    expect(batch.summary?.warnings).toBe(2);
  });

  it('adiciona report.message aos erros quando o lote falhou', () => {
    const batch = normalizeBatch({
      id: 15,
      status: 'FAILED',
      report: { message: 'Descrição técnica útil', exception: 'RuntimeException' },
    });
    expect(batch.errors?.[0].message).toBe('Descrição técnica útil');
  });

  it('mapeia linhas processadas para o resumo', () => {
    const batch = normalizeBatch({
      id: 3,
      processed_rows: 100,
      imported_rows: 98,
      failed_rows: 2,
    });
    expect(batch.summary).toMatchObject({ processed: 100, imported: 98, skipped: 2 });
  });
});

describe('validação de arquivo', () => {
  it('aceita CSV, TXT e ZIP', () => {
    expect(isAcceptedImportFile(new File(['a'], 'dados.csv'))).toBe(true);
    expect(isAcceptedImportFile(new File(['a'], 'dados.txt'))).toBe(true);
    expect(isAcceptedImportFile(new File(['a'], 'dados.zip'))).toBe(true);
    expect(isAcceptedImportFile(new File(['a'], 'foto.png'))).toBe(false);
  });

  it('define 50 MB como limite', () => {
    expect(MAX_IMPORT_FILE_BYTES).toBe(52428800);
  });
});

describe('legacyImportStatusLabel', () => {
  it('traduz os status do backend', () => {
    expect(legacyImportStatusLabel('PROCESSING')).toBe('Processando');
    expect(legacyImportStatusLabel('COMPLETED')).toBe('Concluída');
    expect(legacyImportStatusLabel('FAILED')).toBe('Falhou');
  });
});
