import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { CrudResourcePage, CrudField } from './CrudResourcePage';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

interface Row {
  id: string;
  culture_id: string;
  variety_id: string;
  name: string;
}

const service = {
  getAll: vi.fn(async () => [] as Row[]),
  create: vi.fn(async () => ({ id: '1', culture_id: '', variety_id: '', name: '' })),
  update: vi.fn(async () => ({ id: '1', culture_id: '', variety_id: '', name: '' })),
  delete: vi.fn(async () => undefined),
};

const fields: CrudField[] = [
  { name: 'culture_id', label: 'Cultura', type: 'text', placeholder: 'Cultura', clears: ['variety_id'] },
  { name: 'variety_id', label: 'Variedade', type: 'text', placeholder: 'Variedade' },
  { name: 'name', label: 'Nome', type: 'text', placeholder: 'Nome', required: true },
];

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
      <CrudResourcePage<Row>
        title="Teste"
        description="Teste de cadastro"
        singular="Registro"
        queryKey="teste"
        service={service}
        data={[]}
        isLoading={false}
        columns={[{ key: 'name', label: 'Nome' }]}
        fields={fields}
      />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CrudResourcePage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('limpa o campo filho quando o pai muda', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /Novo/ }));

    await userEvent.type(screen.getByPlaceholderText('Cultura'), '1');
    await userEvent.type(screen.getByPlaceholderText('Variedade'), '7');
    expect(screen.getByPlaceholderText('Variedade')).toHaveValue('7');

    await userEvent.type(screen.getByPlaceholderText('Cultura'), '2');
    await waitFor(() => expect(screen.getByPlaceholderText('Variedade')).toHaveValue(''));
  });

  it('marca o campo exato retornado em um erro 422', async () => {
    service.create.mockRejectedValueOnce({
      response: { status: 422, data: { errors: { name: ['O nome já está em uso.'] } } },
    });
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /Novo/ }));
    await userEvent.type(screen.getByPlaceholderText('Nome'), 'Duplicado');
    await userEvent.click(screen.getByRole('button', { name: 'Criar' }));

    expect(await screen.findByText('O nome já está em uso.')).toBeInTheDocument();
  });
});
