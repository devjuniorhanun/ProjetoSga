import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LegacyImportWarnings } from './LegacyImportWarnings';

describe('LegacyImportWarnings', () => {
  it('mostra a mensagem completa e a severidade traduzida', () => {
    render(
      <LegacyImportWarnings
        warnings={[
          {
            message: 'O CSV de safras não possui agricultural_year_id.',
            file: 'safras.csv',
            record: null,
            severity: 'warning',
          },
        ]}
      />
    );
    expect(
      screen.getByText('O CSV de safras não possui agricultural_year_id.')
    ).toBeInTheDocument();
    expect(screen.getByText('Aviso')).toBeInTheDocument();
    expect(screen.getByText('Arquivo: safras.csv')).toBeInTheDocument();
  });

  it('aceita avisos em formato de string', () => {
    render(<LegacyImportWarnings warnings={['Aviso antigo em texto']} />);
    expect(screen.getByText('Aviso antigo em texto')).toBeInTheDocument();
  });

  it('limita a 10 avisos e permite mostrar todos', async () => {
    const warnings = Array.from({ length: 12 }, (_, index) => `Aviso número ${index + 1}`);
    render(<LegacyImportWarnings warnings={warnings} />);

    expect(screen.queryByText('Aviso número 12')).not.toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar todos' }));
    expect(screen.getByText('Aviso número 12')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar menos' }));
    expect(screen.queryByText('Aviso número 12')).not.toBeInTheDocument();
  });

  it('exibe erros normalizados', () => {
    render(<LegacyImportWarnings errors={[{ description: 'Coluna ausente' }]} />);
    expect(screen.getByText('Coluna ausente')).toBeInTheDocument();
  });
});
