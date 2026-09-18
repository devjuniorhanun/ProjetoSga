import { describe, expect, it } from 'vitest';
import { createDefensiveServiceOrderPdf } from './defensive-service-order-pdf';
import { sampleDefensiveOrder } from '@/test/defensive-order-fixture';

describe('PDF da ordem de serviço', () => {
  it('gera A4 retrato em uma página com o nome correto', () => {
    const { doc, fileName } = createDefensiveServiceOrderPdf(sampleDefensiveOrder, undefined, new Date('2026-09-16T12:30:00'));
    expect(fileName).toBe('ordem-de-servico-OS-2026-0042.pdf');
    expect(doc.internal.pageSize.getWidth()).toBeLessThan(doc.internal.pageSize.getHeight());
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(595.28, 0);
    expect(doc.getNumberOfPages()).toBe(1);
    const output = doc.output();
    expect(output).not.toContain('Sequência de aplicação');
  });
});
