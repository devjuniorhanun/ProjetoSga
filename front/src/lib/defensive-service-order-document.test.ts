import { describe, expect, it } from 'vitest';
import { buildDefensiveServiceOrderDocument, formatDocumentNumber } from './defensive-service-order-document';
import type { AgriculturalDefensiveOrder } from './api-services-entries';
import { sampleDefensiveOrder } from '@/test/defensive-order-fixture';

const config = {
  producer_name: 'Produtor Exemplo',
  property_name: 'Fazenda Exemplo',
  producer_color: '#123456',
  property_color: '#eeeeee',
};

describe('modelo da ordem de serviço de defensivos', () => {
  it('prepara cabeçalho, números e produtos em ordem sem recalcular valores', () => {
    const model = buildDefensiveServiceOrderDocument(sampleDefensiveOrder, config, new Date('2026-09-16T12:30:00'));
    expect(model.number).toBe('OS-2026-0042');
    expect(model.producerName).toBe('Produtor Exemplo');
    expect(model.producerTextColor).toBe('#ffffff');
    expect(model.propertyTextColor).toBe('#000000');
    expect(model.products).toHaveLength(15);
    expect(model.products.slice(0, 2).map((product) => product.name)).toEqual(['Produto A', 'Produto B']);
    expect(model.infoRows[2][1].value).toBe('10,25');
    expect(model.flow).toBe('12,346');
    expect(formatDocumentNumber(null)).toBe('-');
  });

  it('preserva todos os produtos acima de quinze', () => {
    const products = Array.from({ length: 18 }, (_, index) => ({
      product_id: String(index + 1), product_name: `Produto ${index + 1}`, dose: 1, pump: index + 0.5, order: index,
    }));
    const model = buildDefensiveServiceOrderDocument({ ...sampleDefensiveOrder, products }, config);
    expect(model.products).toHaveLength(18);
    expect(model.products[17].name).toBe('Produto 18');
    expect(model.compact).toBe(true);
  });

  it('separa tanqueiros e aplicadores nas três seções', () => {
    const model = buildDefensiveServiceOrderDocument(sampleDefensiveOrder, config);
    expect(model.controls).toHaveLength(3);
    expect(model.controls[0].tanker).toBe('Tanqueiro Um');
    expect(model.controls[1].tanker).toBe('Tanqueiro Dois');
    expect(model.controls[0].operators.map((operator) => operator.name)).toEqual(['Aplicador Um', 'Aplicador Dois']);
    expect(model.controls[2].operators.every((operator) => operator.name === '')).toBe(true);
  });
});
