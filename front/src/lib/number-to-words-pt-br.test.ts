import { describe, it, expect } from 'vitest';
import { numberToWordsPtBr } from './number-to-words-pt-br';

describe('numberToWordsPtBr', () => {
  it('formata zero', () => {
    expect(numberToWordsPtBr(0)).toBe('zero reais');
  });

  it('formata singular', () => {
    expect(numberToWordsPtBr(1)).toBe('um real');
  });

  it('formata centavos', () => {
    expect(numberToWordsPtBr(0.01)).toBe('um centavo');
    expect(numberToWordsPtBr(1.5)).toBe('um real e cinquenta centavos');
  });

  it('formata centenas e milhares', () => {
    expect(numberToWordsPtBr(100)).toBe('cem reais');
    expect(numberToWordsPtBr(1234.56)).toBe('mil, duzentos e trinta e quatro reais e cinquenta e seis centavos');
  });

  it('formata milhões', () => {
    expect(numberToWordsPtBr(1000000)).toBe('um milhão de reais'.replace(' de reais', ' reais'));
  });
});
