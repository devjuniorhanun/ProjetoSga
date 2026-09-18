/**
 * Substitui variáveis no formato {{variavel}} pelo valor correspondente
 * vindo da API. Variáveis sem valor são mantidas em branco.
 */
export function renderContractBody(
  body: string,
  variables: Record<string, unknown> = {},
): string {
  return (body || '').replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

/** Abre a janela de impressão com o contrato em formato A4 retrato. */
export function printContract(title: string, html: string) {
  const win = window.open('', '_blank', 'width=900,height=1200');
  if (!win) return;

  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      @page { size: A4 portrait; margin: 20mm 15mm; }
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; font-size: 12pt; line-height: 1.5; color: #000; margin: 0; }
      h1, h2, h3 { margin: 0 0 12px; }
      p { margin: 0 0 10px; }
      table { width: 100%; border-collapse: collapse; }
      table td, table th { border: 1px solid #000; padding: 4px; }
      img { max-width: 100%; }
      .ql-align-center { text-align: center; }
      .ql-align-right { text-align: right; }
      .ql-align-justify { text-align: justify; }
    </style>
  </head>
  <body>${html}</body>
</html>`);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 300);
}
