import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LegacyImportHistory } from './LegacyImportHistory';

const mocks = vi.hoisted(() => ({
  preview: vi.fn(),
  run: vi.fn(),
  history: vi.fn(),
  getById: vi.fn(),
}));

vi.mock('@/lib/api-services-imports', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api-services-imports')>(
    '@/lib/api-services-imports'
  );
  return { ...actual, legacyImportsService: mocks };
});

function renderHistory() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LegacyImportHistory />
    </QueryClientProvider>
  );
}

describe('LegacyImportHistory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mostra estado vazio quando não há importações', async () => {
    mocks.history.mockResolvedValue([]);
    renderHistory();
    expect(await screen.findByText('Nenhuma importação encontrada.')).toBeInTheDocument();
  });

  it('lista importações e abre os detalhes', async () => {
    mocks.history.mockResolvedValue([
      {
        batch: 12,
        file_name: 'dados.zip',
        status: 'Concluída',
        records: 2249,
        user_name: 'Administrador',
        created_at: '2026-09-07T12:00:00Z',
      },
    ]);
    mocks.getById.mockResolvedValue({
      batch: 12,
      file_name: 'dados.zip',
      status: 'Concluída',
      summary: { records: 2249 },
    });

    renderHistory();

    expect(await screen.findByText('dados.zip')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Detalhes' }));
    await waitFor(() => expect(mocks.getById).toHaveBeenCalledWith(12));
    expect(await screen.findByText('Detalhes da Importação')).toBeInTheDocument();
  });

  it('mostra mensagem amigável quando a consulta falha', async () => {
    mocks.history.mockRejectedValue(new Error('falha'));
    renderHistory();
    expect(
      await screen.findByText('Não foi possível consultar o histórico de importações.')
    ).toBeInTheDocument();
  });
});
