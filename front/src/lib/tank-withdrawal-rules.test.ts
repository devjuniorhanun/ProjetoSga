import { describe, expect, it } from 'vitest';
import { buildWithdrawalPayload, parseQuantity, roundQuantity } from './tank-withdrawal-rules';

const base = { crop_id: '16', operator_id: '1', date: '2026-08-17' };

describe('retirada do tanque', () => {
  it('exige safra, tanqueiro e data', () => {
    const result = buildWithdrawalPayload({ ...base, crop_id: '', quantities: { '10': '5' } });
    expect(result.error).toBe('Selecione safra, tanqueiro e data.');
  });

  it('ignora produtos com quantidade zero ou vazia', () => {
    const result = buildWithdrawalPayload({
      ...base,
      quantities: { '10': '1000', '11': '0', '12': '' },
    });
    expect(result.payload?.products).toEqual([{ product_id: 10, quantity: 1000 }]);
  });

  it('limita a três casas decimais e aceita vírgula', () => {
    const result = buildWithdrawalPayload({ ...base, quantities: { '10': '12,34567' } });
    expect(result.payload?.products[0].quantity).toBe(12.346);
    expect(roundQuantity(1.23456)).toBe(1.235);
    expect(parseQuantity('3,5')).toBe(3.5);
  });

  it('permite retirada parcial abaixo da sugestão', () => {
    const result = buildWithdrawalPayload({ ...base, quantities: { '10': '1' } });
    expect(result.error).toBeUndefined();
    expect(result.payload?.products[0].quantity).toBe(1);
  });

  it('bloqueia envio sem nenhum produto', () => {
    const result = buildWithdrawalPayload({ ...base, quantities: { '10': '' } });
    expect(result.error).toBe('Informe a quantidade de pelo menos um produto.');
  });

  it('limita a observação a 500 caracteres', () => {
    const result = buildWithdrawalPayload({
      ...base,
      quantities: { '10': '1' },
      observation: 'a'.repeat(501),
    });
    expect(result.error).toContain('500');
  });

  it('envia observação e data como o backend espera', () => {
    const result = buildWithdrawalPayload({
      ...base,
      quantities: { '10': '1000', '11': '50' },
      observation: ' teste ',
    });
    expect(result.payload).toEqual({
      crop_id: 16,
      operator_id: 1,
      date: '2026-08-17',
      products: [
        { product_id: 10, quantity: 1000 },
        { product_id: 11, quantity: 50 },
      ],
      observation: 'teste',
    });
  });
});
