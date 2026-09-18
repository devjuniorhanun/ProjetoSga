import { describe, it, expect } from 'vitest';
import {
  canEditMatrixFreightPrice,
  isEffectiveRangeValid,
  matrixFreightSituation,
  sortByEffectiveFromDesc,
  toLaravelDateTime,
} from './matrix-freight-rules';

const reference = new Date('2026-06-15T12:00:00');

describe('matrizes de frete', () => {
  it('classifica a situação da versão', () => {
    expect(matrixFreightSituation({ status: 'I', effective_from: '2026-01-01 00:00:00', effective_to: null }, reference)).toBe('INATIVA');
    expect(matrixFreightSituation({ status: 'A', effective_from: '2026-01-01 00:00:00', effective_to: null }, reference)).toBe('VIGENTE');
    expect(matrixFreightSituation({ status: 'A', effective_from: '2026-01-01 00:00:00', effective_to: '2026-03-01 00:00:00' }, reference)).toBe('ENCERRADA');
    expect(matrixFreightSituation({ status: 'A', effective_from: '2026-09-01 00:00:00', effective_to: null }, reference)).toBe('FUTURA');
  });

  it('não permite alterar preço de versão encerrada', () => {
    expect(canEditMatrixFreightPrice({ status: 'A', effective_from: '2020-01-01 00:00:00', effective_to: '2020-06-01 00:00:00' })).toBe(false);
    expect(canEditMatrixFreightPrice({ status: 'A', effective_from: '2020-01-01 00:00:00', effective_to: null })).toBe(true);
  });

  it('exige fim de vigência posterior ao início', () => {
    expect(isEffectiveRangeValid('2026-01-01T00:00', '2026-01-02T00:00')).toBe(true);
    expect(isEffectiveRangeValid('2026-01-02T00:00', '2026-01-01T00:00')).toBe(false);
    expect(isEffectiveRangeValid('2026-01-02T00:00', '')).toBe(true);
  });

  it('ordena por início de vigência decrescente', () => {
    const rows = [{ effective_from: '2026-01-01 00:00:00' }, { effective_from: '2026-05-01 00:00:00' }];
    expect(sortByEffectiveFromDesc(rows)[0].effective_from).toBe('2026-05-01 00:00:00');
  });

  it('envia data/hora no formato aceito pelo Laravel', () => {
    expect(toLaravelDateTime('2026-05-01T08:30')).toBe('2026-05-01 08:30:00');
    expect(toLaravelDateTime('')).toBeNull();
  });
});
