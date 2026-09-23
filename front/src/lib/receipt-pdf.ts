import { jsPDF } from 'jspdf';
import { formatCurrencyBRL, formatNumberBR } from './format-helpers';
import { loadLogo } from './pdf-logo';
import { numberToWordsPtBr } from './number-to-words-pt-br';
import type { PayAccountReceipt } from './api-services-pay-account-receipt';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 10;
const MARGIN_Y = 8;
const VIA_GAP = 7;
const BORDER_COLOR = 210;

function formatDateBR(value?: string): string {
  if (!value) return '-';
  const iso = value.slice(0, 10);
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
}

export function formatReceiptAmount(receipt: PayAccountReceipt): string {
  const numericValue = typeof receipt.value === 'string' ? Number(receipt.value) : receipt.value;
  const value = Number.isFinite(numericValue) ? Number(numericValue) : 0;
  if (receipt.is_monetary) return formatCurrencyBRL(value);
  const unit = (receipt.unit || '').toUpperCase();
  if (unit === 'LT') return `${formatNumberBR(value)} LT`;
  if (unit === 'SC') return `${formatNumberBR(value)} SC`;
  return unit ? `${formatNumberBR(value)} ${unit}` : formatNumberBR(value);
}

function receiptAmountInWords(receipt: PayAccountReceipt): string {
  const numericValue = typeof receipt.value === 'string' ? Number(receipt.value) : receipt.value;
  const value = Number.isFinite(numericValue) ? Number(numericValue) : 0;
  return receipt.is_monetary ? numberToWordsPtBr(value) : formatReceiptAmount(receipt);
}

function paymentMethodName(receipt: PayAccountReceipt): string {
  if (!receipt.payment_method) return '-';
  return typeof receipt.payment_method === 'string'
    ? receipt.payment_method
    : receipt.payment_method.name || receipt.payment_method.abbreviation || '-';
}

function payerDocument(receipt: PayAccountReceipt): string {
  return receipt.payer?.cpf_cnpj || receipt.payer?.document || '';
}

function payeeDocument(receipt: PayAccountReceipt): string {
  return receipt.payee?.cpf_cnpj || receipt.payee?.document || '-';
}

function payerAddress(receipt: PayAccountReceipt): string {
  return receipt.payer?.address || receipt.payer?.farm || receipt.payer?.farm_name || '-';
}

function referenceText(receipt: PayAccountReceipt): string {
  const description = receipt.description?.trim() || '-';
  const crop = receipt.crop?.name?.trim();
  if (!crop || description.toLocaleUpperCase('pt-BR').includes(crop.toLocaleUpperCase('pt-BR'))) {
    return description;
  }
  return `${description} - ${crop}`;
}

function fitText(doc: jsPDF, value: string, maxWidth: number, initialSize = 8.5, minimumSize = 6.2): number {
  let size = initialSize;
  doc.setFontSize(size);
  while (size > minimumSize && doc.getTextWidth(value) > maxWidth) {
    size -= 0.25;
    doc.setFontSize(size);
  }
  return size;
}

function drawInlineRow(
  doc: jsPDF,
  left: number,
  top: number,
  width: number,
  height: number,
  label: string,
  value: string,
) {
  doc.setDrawColor(BORDER_COLOR);
  doc.roundedRect(left, top, width, height, 0.8, 0.8);
  const baseline = top + height / 2 + 1.2;
  doc.setTextColor(15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.text(label, left + 3, baseline);
  const labelWidth = doc.getTextWidth(label);
  doc.setFont('helvetica', 'bold');
  fitText(doc, value, width - labelWidth - 8, 8.2);
  doc.text(value, left + 4 + labelWidth, baseline);
}

function drawVia(
  doc: jsPDF,
  receipt: PayAccountReceipt,
  top: number,
  height: number,
  logo: Awaited<ReturnType<typeof loadLogo>>,
  viaLabel: string,
) {
  const left = MARGIN_X;
  const width = PAGE_W - MARGIN_X * 2;
  const headerHeight = 17;
  const rowHeight = 8;
  const titleWidth = 60;
  const numberWidth = 63;
  const valueWidth = width - titleWidth - numberWidth;

  doc.setDrawColor(BORDER_COLOR);
  doc.setLineWidth(0.25);
  doc.roundedRect(left, top, width, height, 0.8, 0.8);
  doc.roundedRect(left, top, titleWidth, headerHeight, 0.8, 0.8);
  doc.roundedRect(left + titleWidth, top, numberWidth, headerHeight, 0.8, 0.8);
  doc.roundedRect(left + titleWidth + numberWidth, top, valueWidth, headerHeight, 0.8, 0.8);

  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Recibo', left + titleWidth / 2, top + 11.5, { align: 'center' });

  doc.setFontSize(8);
  doc.text('Nº', left + titleWidth + 3, top + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(String(receipt.receipt_number ?? ''), left + titleWidth + 3, top + 12.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Valor R$', left + titleWidth + numberWidth + 3, top + 5);
  doc.setFont('helvetica', 'normal');
  fitText(doc, formatReceiptAmount(receipt), valueWidth - 6, 10);
  doc.text(formatReceiptAmount(receipt), left + titleWidth + numberWidth + 3, top + 12.5);

  let y = top + headerHeight + 2;
  const payerName = receipt.payer?.name || '-';
  const payerDoc = payerDocument(receipt);
  drawInlineRow(doc, left, y, width, rowHeight, 'Recebi(emos) de:', payerDoc ? `${payerName} - CPF/CNPJ: ${payerDoc}` : payerName);
  y += rowHeight + 1.5;
  drawInlineRow(doc, left, y, width, rowHeight, 'Endereço:', payerAddress(receipt));
  y += rowHeight + 1.5;
  drawInlineRow(doc, left, y, width, rowHeight, 'A importância de:', `( ${receiptAmountInWords(receipt)} )`);
  y += rowHeight + 1.5;
  drawInlineRow(doc, left, y, width, rowHeight, 'Referente a:', referenceText(receipt));
  y += rowHeight + 1.5;

  const paymentTitleHeight = 7;
  doc.roundedRect(left, y, width, paymentTitleHeight, 0.8, 0.8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Recebimento através de', PAGE_W / 2, y + 4.8, { align: 'center' });
  y += paymentTitleHeight + 1.5;

  const paymentWidth = width / 4;
  const paymentValues = [
    paymentMethodName(receipt),
    receipt.document_number ? `Nº ${receipt.document_number}` : 'Nº -',
    receipt.bank_account?.bank_name ? `Banco: ${receipt.bank_account.bank_name}` : 'Banco: -',
    receipt.bank_account?.agency_number ? `Agência: ${receipt.bank_account.agency_number}` : 'Agência: -',
  ];
  paymentValues.forEach((value, index) => {
    const cellLeft = left + paymentWidth * index;
    doc.roundedRect(cellLeft, y, paymentWidth, rowHeight, 0.8, 0.8);
    doc.setFont('helvetica', index === 0 ? 'normal' : 'bold');
    fitText(doc, value, paymentWidth - 6, 8.2);
    doc.text(value, cellLeft + 3, y + 5.3);
  });
  y += rowHeight + 1.5;

  const remainingHeight = top + height - y;
  const leftColumn = 63;
  const middleColumn = 63;
  const rightColumn = width - leftColumn - middleColumn;
  const emitterHeight = remainingHeight * 0.46;
  const addressHeight = remainingHeight * 0.27;
  const documentHeight = remainingHeight - emitterHeight - addressHeight;

  doc.roundedRect(left, y, leftColumn, emitterHeight, 0.8, 0.8);
  doc.roundedRect(left, y + emitterHeight, leftColumn, addressHeight, 0.8, 0.8);
  doc.roundedRect(left, y + emitterHeight + addressHeight, leftColumn, documentHeight, 0.8, 0.8);
  doc.roundedRect(left + leftColumn, y, middleColumn, remainingHeight, 0.8, 0.8);
  doc.roundedRect(left + leftColumn + middleColumn, y, rightColumn, remainingHeight, 0.8, 0.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Nome do Emitente', left + 3, y + 4.5);
  doc.setFont('helvetica', 'bold');
  const payeeName = receipt.payee?.name || '-';
  fitText(doc, payeeName, leftColumn - 6, 8.2);
  doc.text(doc.splitTextToSize(payeeName, leftColumn - 6).slice(0, 2), left + 3, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Endereço', left + 3, y + emitterHeight + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.payee?.address || '-', left + 3, y + emitterHeight + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Cpf / Cnpj', left + 3, y + emitterHeight + addressHeight + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(payeeDocument(receipt), left + 3, y + emitterHeight + addressHeight + 10);

  const middleLeft = left + leftColumn;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Data', middleLeft + 3, y + 4.5);
  doc.setFontSize(9);
  doc.text(formatDateBR(receipt.document_date), middleLeft + middleColumn / 2, y + 13, { align: 'center' });
  const signatureY = y + remainingHeight - 12;
  doc.setDrawColor(BORDER_COLOR);
  doc.line(middleLeft + 6, signatureY, middleLeft + middleColumn - 6, signatureY);
  doc.setFontSize(8);
  doc.text('Assinatura', middleLeft + middleColumn / 2, signatureY + 6, { align: 'center' });

  const logoLeft = left + leftColumn + middleColumn;
  if (logo) {
    const maxW = rightColumn - 10;
    const maxH = remainingHeight - 16;
    const ratio = Math.min(maxW / logo.width, maxH / logo.height);
    const logoW = logo.width * ratio;
    const logoH = logo.height * ratio;
    doc.addImage(logo.dataUrl, logo.format, logoLeft + (rightColumn - logoW) / 2, y + (remainingHeight - logoH) / 2 - 2, logoW, logoH);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(viaLabel, left + width - 3, top + height - 3, { align: 'right' });
}

/** Gera um PDF A4 retrato com duas vias idênticas separadas por linha de corte. */
export async function buildReceiptPdf(receipt: PayAccountReceipt): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const logo = await loadLogo(receipt.logo_url);
  const usableHeight = PAGE_H - MARGIN_Y * 2 - VIA_GAP;
  const viaHeight = usableHeight / 2;

  drawVia(doc, receipt, MARGIN_Y, viaHeight, logo, '1ª Via');

  const cutY = MARGIN_Y + viaHeight + VIA_GAP / 2;
  doc.setDrawColor(170);
  doc.setLineDashPattern([2, 2], 0);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, cutY, PAGE_W - MARGIN_X, cutY);
  doc.setLineDashPattern([], 0);

  drawVia(doc, receipt, MARGIN_Y + viaHeight + VIA_GAP, viaHeight, logo, '2ª Via');
  return doc.output('blob');
}
