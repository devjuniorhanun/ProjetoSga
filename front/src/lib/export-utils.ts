import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { reportFooterText } from './report-footer';

export interface ExportConfig {
  producer_name?: string;
  property_name?: string;
  producer_color?: string;
  property_color?: string;
}

export interface ExportColumn {
  key: string;
  label: string;
}

function hexToRgb(hex?: string, fallback: [number, number, number] = [255, 255, 255]): [number, number, number] {
  if (!hex) return fallback;
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  if (full.length !== 6 || /[^0-9a-fA-F]/.test(full)) return fallback;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function readableTextColor(rgb: [number, number, number]): [number, number, number] {
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return luminance > 0.6 ? [0, 0, 0] : [255, 255, 255];
}

function sanitize(fileName: string) {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'relatorio';
}

function withoutStatus(columns: ExportColumn[]): ExportColumn[] {
  return columns.filter(
    c => c.key.toLowerCase() !== 'status' && c.label.trim().toLowerCase() !== 'status',
  );
}

export function exportToPdf(
  title: string,
  allColumns: ExportColumn[],
  rows: Record<string, unknown>[],
  config?: ExportConfig,
) {
  const columns = withoutStatus(allColumns);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 5;
  const gridWidth = pageWidth - margin * 2;

  let y = margin;

  const producerBg = hexToRgb(config?.producer_color, [240, 240, 240]);
  const propertyBg = hexToRgb(config?.property_color, [240, 240, 240]);

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.7);

  // Linha 1 - producer_name (largura total), 1.5rem ~ 24px, negrito, fundo producer_color
  const row1Height = 34;
  doc.setFillColor(...producerBg);
  doc.rect(margin, y, gridWidth, row1Height, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...readableTextColor(producerBg));
  doc.text(config?.producer_name || '', margin + gridWidth / 2, y + row1Height / 2 + 8, { align: 'center' });
  y += row1Height;

  // Linha 2 - property_name (largura total), 1.375rem ~ 22px, negrito, fundo property_color
  const row2Height = 32;
  doc.setFillColor(...propertyBg);
  doc.rect(margin, y, gridWidth, row2Height, 'FD');
  doc.setFontSize(22);
  doc.setTextColor(...readableTextColor(propertyBg));
  doc.text(config?.property_name || '', margin + gridWidth / 2, y + row2Height / 2 + 7, { align: 'center' });
  y += row2Height;

  // Linha 3 - em branco
  y += 12;

  // Linha 4 - nome do relatório (com borda)
  const row4Height = 24;
  doc.rect(margin, y, gridWidth, row4Height, 'S');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(title, margin + gridWidth / 2, y + row4Height / 2 + 5, { align: 'center' });
  y += row4Height;

  // Linha em branco antes da listagem
  y += 12;

  autoTable(doc, {
    startY: y,
    margin: { left: 5, right: 5, top: 5, bottom: 20 },
    head: [columns.map(c => c.label)],
    body: rows.map(r => columns.map(c => String(r[c.key] ?? ''))),
    styles: { fontSize: 6, cellPadding: 5, overflow: 'linebreak' },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.7, lineColor: [0, 0, 0] },
    showHead: 'everyPage',
    theme: 'grid',
  });

  // Rodapé: crédito à esquerda, paginação à direita
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalPages = doc.getNumberOfPages();
  const credit = reportFooterText();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text(credit, 8, pageHeight - 8, { align: 'left' });
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 8, pageHeight - 8, { align: 'right' });
  }

  doc.save(`${sanitize(title)}.pdf`);
}

export { exportDefensiveServiceOrderPdf as exportServiceOrderPdf } from './defensive-service-order-pdf';

export interface TankerOutputPdfData {
  id?: string | number;
  application_date?: string;
  operator_name?: string;
  products?: { productName?: string; productQtn?: string | number }[];
}

export function exportTankerOutputPdf(data: TankerOutputPdfData, config?: ExportConfig) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 5;
  const gridWidth = pageWidth - margin * 2;
  const cellWidth = gridWidth / 3;
  const halfWidth = gridWidth / 2;

  let y = margin;

  const producerBg = hexToRgb(config?.producer_color, [240, 240, 240]);
  const propertyBg = hexToRgb(config?.property_color, [240, 240, 240]);

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.7);

  // Linha 1 - producer_name (1.5rem ~ 24px, negrito)
  const row1Height = 34;
  doc.setFillColor(...producerBg);
  doc.rect(margin, y, gridWidth, row1Height, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...readableTextColor(producerBg));
  doc.text(config?.producer_name || '', margin + gridWidth / 2, y + row1Height / 2 + 8, { align: 'center' });
  y += row1Height;

  // Linha 2 - property_name (1.375rem ~ 22px, negrito)
  const row2Height = 32;
  doc.setFillColor(...propertyBg);
  doc.rect(margin, y, gridWidth, row2Height, 'FD');
  doc.setFontSize(22);
  doc.setTextColor(...readableTextColor(propertyBg));
  doc.text(config?.property_name || '', margin + gridWidth / 2, y + row2Height / 2 + 7, { align: 'center' });
  y += row2Height;

  // Linha 3 - em branco
  y += 12;

  // Linha 4 - nome do relatório
  const row4Height = 24;
  doc.rect(margin, y, gridWidth, row4Height, 'S');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('CONTROLE DE SAÍDA DE PRODUTOS', margin + gridWidth / 2, y + row4Height / 2 + 5, { align: 'center' });
  y += row4Height;

  // Linha 5 - id (vermelho) | CONTROLE INTERNO
  const row5Height = 22;
  doc.rect(margin, y, halfWidth, row5Height, 'S');
  doc.rect(margin + halfWidth, y, halfWidth, row5Height, 'S');
  doc.setFontSize(12);
  doc.setTextColor(255, 0, 0);
  doc.text(String(data.id ?? '-'), margin + halfWidth / 2, y + row5Height / 2 + 4, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  doc.text('CONTROLE INTERNO', margin + halfWidth + halfWidth / 2, y + row5Height / 2 + 4, { align: 'center' });
  y += row5Height;

  // Grade de produtos: 3 colunas x 15 linhas
  const prodRowHeight = 16;
  doc.setFontSize(9);
  // Linha 1 - cabeçalho
  doc.setFont('helvetica', 'bold');
  const headers = ['SAÍDA', 'PRODUTOS', 'DEVOLUÇÃO'];
  headers.forEach((h, i) => {
    doc.rect(margin + i * cellWidth, y, cellWidth, prodRowHeight, 'S');
    doc.text(h, margin + i * cellWidth + cellWidth / 2, y + prodRowHeight / 2 + 3, { align: 'center' });
  });
  y += prodRowHeight;

  // Linhas 2 a 15 - dados do array products
  const products = [...(data.products ?? [])];
  while (products.length < 14) products.push({});
  products.slice(0, 14).forEach((p) => {
    doc.rect(margin, y, cellWidth, prodRowHeight, 'S');
    doc.rect(margin + cellWidth, y, cellWidth, prodRowHeight, 'S');
    doc.rect(margin + cellWidth * 2, y, cellWidth, prodRowHeight, 'S');
    doc.setFont('helvetica', 'normal');
    if (p.productName) {
      const qtn = String(p.productQtn ?? '').replace('.', ',');
      doc.text(qtn, margin + cellWidth / 2, y + prodRowHeight / 2 + 3, { align: 'center' });
      doc.text(p.productName, margin + cellWidth + 4, y + prodRowHeight / 2 + 3);
    }
    y += prodRowHeight;
  });

  // Grid OBS.: 3 linhas com bordas
  const obsRowHeight = 16;
  for (let i = 0; i < 3; i++) {
    doc.rect(margin, y, gridWidth, obsRowHeight, 'S');
    if (i === 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('OBS.:', margin + 4, y + obsRowHeight / 2 + 3);
    }
    y += obsRowHeight;
  }

  // Linha com 3 divisões: TANQUEIRO / FRENTE / TALHÕES
  const infoRowHeight = 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const infoCells: [string, string][] = [
    ['TANQUEIRO.:', data.operator_name || ''],
    ['FRENTE.:', ''],
    ['TALHÕES.:', ''],
  ];
  infoCells.forEach(([label, value], i) => {
    const x = margin + i * cellWidth;
    doc.rect(x, y, cellWidth, infoRowHeight, 'S');
    doc.text(label, x + 4, y + infoRowHeight / 2 + 3);
    if (value) {
      doc.setFont('helvetica', 'normal');
      doc.text(value, x + 4 + doc.getTextWidth(label) + 3, y + infoRowHeight / 2 + 3);
      doc.setFont('helvetica', 'bold');
    }
  });
  y += infoRowHeight;

  // Linha com 3 divisões: data + espaços para assinatura
  const signRowHeight = 40;
  for (let i = 0; i < 3; i++) {
    const x = margin + i * cellWidth;
    doc.rect(x, y, cellWidth, signRowHeight, 'S');
  }
  doc.setFont('helvetica', 'bold');
  doc.text(data.application_date || '', margin + cellWidth / 2, y + signRowHeight / 2 + 3, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('ASSINATURA', margin + cellWidth + cellWidth / 2, y + signRowHeight - 6, { align: 'center' });
  doc.text('ASSINATURA', margin + cellWidth * 2 + cellWidth / 2, y + signRowHeight - 6, { align: 'center' });
  y += signRowHeight;

  // Rodapé: crédito à esquerda, paginação à direita
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(110, 110, 110);
  doc.text(reportFooterText(), 8, pageHeight - 6, { align: 'left' });
  doc.text('Página 1 de 1', pageWidth - 8, pageHeight - 6, { align: 'right' });

  doc.save(`${sanitize(`controle-saida-produtos-${data.id ?? ''}`)}.pdf`);
}


export function exportToXls(
  title: string,
  allColumns: ExportColumn[],
  rows: Record<string, unknown>[],
  config?: ExportConfig,
) {
  const columns = withoutStatus(allColumns);
  const colCount = Math.max(columns.length, 1);
  const blank = () => Array(colCount).fill('');

  const aoa: unknown[][] = [
    [config?.producer_name || '', ...Array(colCount - 1).fill('')],
    [config?.property_name || '', ...Array(colCount - 1).fill('')],
    blank(),
    [title, ...Array(colCount - 1).fill('')],
    blank(),
    columns.map(c => c.label),
    ...rows.map(r => columns.map(c => r[c.key] ?? '')),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: colCount - 1 } },
  ];
  ws['!cols'] = columns.map(c => ({ wch: Math.max(12, c.label.length + 4) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Relatorio');
  XLSX.writeFile(wb, `${sanitize(title)}.xls`, { bookType: 'biff8' });
}
