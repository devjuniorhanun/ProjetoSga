import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DefensiveServiceOrderDocument } from './DefensiveServiceOrderDocument';
import { buildDefensiveServiceOrderDocument } from '@/lib/defensive-service-order-document';
import { sampleDefensiveOrder } from '@/test/defensive-order-fixture';

describe('documento da ordem de serviço', () => {
  it('mostra cabeçalhos, campos e cores sem controles de sequência', () => {
    const model = buildDefensiveServiceOrderDocument(sampleDefensiveOrder, {
      producer_name: 'Produtor Exemplo', property_name: 'Fazenda Exemplo', producer_color: '#123456', property_color: '#eeeeee',
    });
    render(<DefensiveServiceOrderDocument model={model} />);
    const documentRoot = screen.getByTestId('defensive-order-document');
    expect(documentRoot.style.getPropertyValue('--producer-color')).toBe('#123456');
    expect(documentRoot.style.getPropertyValue('--producer-text-color')).toBe('#ffffff');
    expect(documentRoot.style.getPropertyValue('--property-color')).toBe('#eeeeee');
    expect(documentRoot.style.getPropertyValue('--property-text-color')).toBe('#000000');
    expect(screen.getByText(/Talhão Norte/)).toBeInTheDocument();
    expect(screen.queryByText(/Sequência de aplicação/i)).not.toBeInTheDocument();
    expect(screen.getAllByTestId('application-control')).toHaveLength(3);
    expect(document.querySelectorAll('[data-product-row="true"]')).toHaveLength(15);
    const productRows = Array.from(document.querySelectorAll('[data-product-row="true"]')).map((row) => row.textContent);
    expect(productRows[0]).toContain('Produto A');
    expect(productRows[1]).toContain('Produto B');
    expect(screen.getByText(/Tanqueiro Um/)).toBeInTheDocument();
    expect(screen.getByText(/Aplicador Um/)).toBeInTheDocument();
  });
});
