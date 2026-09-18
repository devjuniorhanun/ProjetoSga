import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LegacyImportPage from './LegacyImportPage';

const mocks = vi.hoisted(() => ({
  preview: vi.fn(),
  run: vi.fn(),
  history: vi.fn(),
  getById: vi.fn(),
  roles: { allowed: true },
}));

vi.mock('@/lib/api-services-imports', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api-services-imports')>(
    '@/lib/api-services-imports'
  );
  return { ...actual, legacyImportsService: mocks };
});

vi.mock('@/contexts/RolesContext', () => ({
  useRoles: () => ({ hasRole: () => mocks.roles.allowed }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <LegacyImportPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const csv = (name: string) => new File(['a;b'], name, { type: 'text/csv' });

function select(...files: File[]) {
  const input = screen.getByLabelText('Selecionar arquivos de importação') as HTMLInputElement;
  fireEvent.change(input, { target: { files } });
}

describe('LegacyImportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.roles.allowed = true;
    mocks.history.mockResolvedValue([]);
    mocks.run.mockResolvedValue({ message: 'Tudo certo', summary: { imported: 10 } });
  });

  it('renderiza o título da página', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Importação de Dados Legados' })).toBeInTheDocument();
  });

  it('bloqueia o acesso de quem não é SUPER ou ADM', () => {
    mocks.roles.allowed = false;
    renderPage();
    expect(
      screen.queryByRole('heading', { name: 'Importação de Dados Legados' })
    ).not.toBeInTheDocument();
  });

  it('rejeita arquivo com extensão inválida', async () => {
    renderPage();
    select(new File(['x'], 'foto.png', { type: 'image/png' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Formato inválido');
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it('rejeita ZIP junto com outro arquivo', async () => {
    renderPage();
    select(csv('safras.csv'), new File(['x'], 'dados.zip', { type: 'application/zip' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('ZIP');
  });

  it('rejeita arquivos duplicados', async () => {
    renderPage();
    select(csv('safras.csv'));
    select(csv('SAFRAS.CSV'));
    expect(await screen.findByRole('alert')).toHaveTextContent('duplicado');
  });

  it('permite remover um arquivo e limpar a seleção', async () => {
    renderPage();
    select(csv('safras.csv'), csv('culturas.csv'));
    await userEvent.click(await screen.findByRole('button', { name: 'Remover safras.csv' }));
    expect(screen.queryByText('safras.csv')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Limpar seleção' }));
    expect(screen.queryByText('culturas.csv')).not.toBeInTheDocument();
  });

  it('envia todos os arquivos em uma única requisição e limpa a seleção', async () => {
    renderPage();
    select(csv('safras.csv'), csv('culturas.csv'));
    await userEvent.click(await screen.findByRole('button', { name: 'Enviar arquivos' }));

    await waitFor(() => expect(mocks.run).toHaveBeenCalledTimes(1));
    expect(mocks.run.mock.calls[0][0].map((file: File) => file.name)).toEqual([
      'safras.csv',
      'culturas.csv',
    ]);
    expect(await screen.findByText('Importação concluída com sucesso')).toBeInTheDocument();
    expect(screen.queryByText('safras.csv')).not.toBeInTheDocument();
  });

  it('trata sucesso com avisos como sucesso', async () => {
    mocks.run.mockResolvedValue({ status: 'COMPLETED', summary: { warnings: 2 } });
    renderPage();
    select(csv('safras.csv'));
    await userEvent.click(await screen.findByRole('button', { name: 'Enviar arquivos' }));
    expect(await screen.findByText('Importação concluída com sucesso')).toBeInTheDocument();
    expect(screen.getByText(/2 avisos registrados/)).toBeInTheDocument();
  });

  it('mantém os arquivos e mostra a mensagem da API em erro 422', async () => {
    mocks.run.mockRejectedValue({
      response: {
        data: {
          message: 'The given data was invalid.',
          batch_id: 15,
          errors: { file: ['Selecione um arquivo ZIP/CSV ou vários arquivos CSV.'] },
          report: { message: 'Motivo', exception: 'RuntimeException' },
        },
      },
    });
    renderPage();
    select(csv('safras.csv'));
    await userEvent.click(await screen.findByRole('button', { name: 'Enviar arquivos' }));

    expect(
      await screen.findByText('Selecione um arquivo ZIP/CSV ou vários arquivos CSV.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver detalhes do lote' })).toBeInTheDocument();
    expect(screen.getByText('safras.csv')).toBeInTheDocument();
    expect(screen.queryByText('RuntimeException')).not.toBeInTheDocument();
  });

  it('não dispara duas importações no clique duplo', async () => {
    mocks.run.mockImplementation(() => new Promise(() => {}));
    renderPage();
    select(csv('safras.csv'));
    const button = await screen.findByRole('button', { name: 'Enviar arquivos' });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(mocks.run).toHaveBeenCalledTimes(1));
  });
});
