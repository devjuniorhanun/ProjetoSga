import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ProductOutputsPage from './ProductOutputsPage';

const toastError = vi.fn();
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: (...args: unknown[]) => toastError(...args), info: vi.fn() } }));

const create = vi.fn();
const list = vi.fn(async () => ({ items: [] }));

vi.mock('@/lib/api-services-inventory-releases', () => ({
  productOutputsService: {
    list: (...args: unknown[]) => list(...(args as [])),
    create: (...args: unknown[]) => create(...(args as [])),
    confirm: vi.fn(),
    getById: vi.fn(),
    registerReturn: vi.fn(),
  },
  inventoryBalancesService: { list: vi.fn(async () => ({ items: [] })) },
}));

vi.mock('@/hooks/use-fiscal-options', () => ({
  useFiscalOptions: () => ({
    supplierOptions: [],
    producerOptions: [],
    costCenterOptions: [],
    farmOptions: [],
    fieldOptions: [],
    productOptions: [],
    cultureOptions: [],
    cropOptions: [],
    stockLocationOptions: [],
    typePayAccountOptions: [],
    varietiesByCulture: () => [],
    stockLocations: [],
    stockProfiles: [],
    freightRates: [],
    isLoading: false,
  }),
  useAdministrativeCentersByProducer: () => ({ data: [] }),
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ProductOutputsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Saídas de produtos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    list.mockResolvedValue({ items: [] });
  });

  it('empréstimo exige data prevista de retorno', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /nova saída/i }));
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));

    await waitFor(() => {
      expect(screen.getByText(/informe a data da saída/i)).toBeInTheDocument();
      expect(screen.getByText(/adicione ao menos um item/i)).toBeInTheDocument();
    });
    expect(create).not.toHaveBeenCalled();
  });
});
