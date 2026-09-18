import jsPDF from 'jspdf';
import { formatCurrencyBRL } from './format-helpers';
import { numberToWordsPtBr } from './number-to-words-pt-br';

export interface TransferPdfItem {
  documentNumber: string;
  documentDate: string;
  producerName: string;
  farmName: string;
  supplierName: string;
  supplierDocument: string;
  bankName: string;
  agencyNumber: string;
  operationNumber: string;
  accountNumber: string;
  accountType: string;
  pixKey: string;
  value: number;
  description: string;
  authorizedBy: string;
  accountedFor: 'S' | 'N';
}

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 10;
const BLOCKS_PER_PAGE = 4;
const BLOCK_H = (PAGE_H - MARGIN * 2) / BLOCKS_PER_PAGE;

function formatDateBR(value?: string): string {
  if (!value) return '';
  const iso = value.slice(0, 10);
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
}

function drawBlock(doc: jsPDF, item: TransferPdfItem, top: number) {
  const left = MARGIN;
  const width = PAGE_W - MARGIN * 2;
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.rect(left, top, width, BLOCK_H - 4);

  let y = top + 6;
  const labelX = left + 3;
  const valueX = left + 32;
  const maxTextWidth = width - 36;

  const line = (label: string, value: string, bold = false) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(label, labelX, y);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(value || '-', maxTextWidth);
    doc.text(lines, valueX, y);
    y += 4 * lines.length;
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DADOS DO DEPOSITANTE', labelX, y);
  doc.text(
    `${formatDateBR(item.documentDate)} - ${item.documentNumber || ''}`,
    left + width - 3,
    y,
    { align: 'right' }
  );
  y += 5;

  line('NOME:', item.producerName);
  line('FAZENDA:', item.farmName);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DADOS DO BENEFICIÁRIO', labelX, y);
  y += 5;

  line('FAVORECIDO:', item.supplierName);
  line('CPF/CNPJ:', item.supplierDocument);
  line('BANCO:', item.bankName);
  line(
    'AGÊNCIA:',
    `${item.agencyNumber || '-'}    OP.: ${item.operationNumber || '-'}    CONTA: ${item.accountNumber || '-'} ${item.accountType || ''}`.trim()
  );
  if (item.pixKey) line('PIX:', item.pixKey);
  line('VALOR:', formatCurrencyBRL(item.value), true);
  line('POR EXTENSO:', numberToWordsPtBr(item.value));
  line('DESCRIÇÃO:', item.description);
  line('AUTORIZADO POR:', item.authorizedBy);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(item.accountedFor === 'S' ? 'CONTABILIZADO' : 'NÃO CONTABILIZADO', labelX, top + BLOCK_H - 7);
}

export function buildTransfersPdf(items: TransferPdfItem[]): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  items.forEach((item, index) => {
    const positionOnPage = index % BLOCKS_PER_PAGE;
    if (index > 0 && positionOnPage === 0) doc.addPage();
    drawBlock(doc, item, MARGIN + positionOnPage * BLOCK_H);
  });
  if (!items.length) {
    doc.setFontSize(12);
    doc.text('Nenhuma transferência selecionada.', MARGIN, MARGIN + 10);
  }
  return doc;
}

export function generateTransfersPdfBlob(items: TransferPdfItem[]): Blob {
  return buildTransfersPdf(items).output('blob');
}

export function transfersPdfFileName(date: string): string {
  return `transferencias-${date}.pdf`;
}
