import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DefensiveServiceOrder from './DefensiveServiceOrder';
import { sampleDefensiveOrder } from '@/test/defensive-order-fixture';

const getById = vi.fn();
const getConfigs = vi.fn();
const exportPdf = vi.fn();

vi.mock('@/lib/api-services-entries', () => ({ defensiveOrdersService: { getById: (...args: unknown[]) => getById(...args) } }));
vi.mock('@/lib/api-services-admin', () => ({ configsService: { getAll: (...args: unknown[]) => getConfigs(...args) } }));
vi.mock('@/lib/defensive-service-order-pdf', () => ({ exportDefensiveServiceOrderPdf: (...args: unknown[]) => exportPdf(...args) }));
vi.mock('./DefensiveOrderClosingDialog', () => ({
  DefensiveOrderClosingDialog: ({ open, orderId }: { open: boolean; orderId: string | null }) => open ? <div role="dialog">Fechamento {orderId}</div> : null,
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/entries/agricultural/defensives/order/42']}>
        <Routes><Route path="/entries/agricultural/defensives/order/:id" element={<DefensiveServiceOrder />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('página da ordem de serviço', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getById.mockResolvedValue(sampleDefensiveOrder);
    getConfigs.mockResolvedValue([{ producer_name: 'Produtor Exemplo', property_name: 'Fazenda Exemplo', producer_color: '#123456', property_color: '#eeeeee' }]);
  });

  it('carrega pelo id, remove a sequência e mantém o diálogo de fechamento', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText('Produtor Exemplo')).toBeInTheDocument();
    expect(getById).toHaveBeenCalledWith('42');
    expect(screen.queryByText(/Sequência de aplicação/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Fechar O\.S\./i }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Fechamento 42');
  });

  it('gera o PDF a partir do mesmo modelo preparado', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: /Gerar PDF/i }));
    await waitFor(() => expect(exportPdf).toHaveBeenCalledTimes(1));
    expect(exportPdf.mock.calls[0][0].products).toHaveLength(15);
  });
});
