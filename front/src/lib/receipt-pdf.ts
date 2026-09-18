import jsPDF from 'jspdf';
import { formatCurrencyBRL, formatNumberBR } from './format-helpers';
import { loadLogo } from './pdf-logo';
import type { PayAccountReceipt } from './api-services-pay-account-receipt';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 12;

function formatDateBR(value?: string): string {
  if (!value) return '';
  const iso = value.slice(0, 10);
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
}

/**
 * Pagamentos monetários mostram R$; pagamentos físicos mostram apenas a
 * quantidade com a unidade devolvida pela API (nunca equivalente em reais).
 */
export function formatReceiptAmount(receipt: PayAccountReceipt): string {
  const numericValue = typeof receipt.value === 'string' ? Number(receipt.value) : receipt.value;
  const value = Number.isFinite(numericValue) ? Number(numericValue) : 0;
  if (receipt.is_monetary) return formatCurrencyBRL(value);
  const unit = (receipt.unit || '').toUpperCase();
  if (unit === 'LT') return `${formatNumberBR(value)} LT`;
  if (unit === 'SC') return `${formatNumberBR(value)} SC`;
  return unit ? `${formatNumberBR(value)} ${unit}` : formatNumberBR(value);
}

function drawVia(
  doc: jsPDF,
  receipt: PayAccountReceipt,
  top: number,
  height: number,
  logo: Awaited<ReturnType<typeof loadLogo>>,
  viaLabel: string,
) {
  const left = MARGIN;
  const width = PAGE_W - MARGIN * 2;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(left, top, width, height);

  let y = top + 10;

  if (logo) {
    const maxW = 34;
    const maxH = 16;
    const ratio = Math.min(maxW / logo.width, maxH / logo.height);
    doc.addImage(logo.dataUrl, logo.format, left + 4, top + 4, logo.width * ratio, logo.height * ratio);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RECIBO', PAGE_W / 2, y, { align: 'center' });
  doc.setFontSize(9);
  doc.text(`Nº ${receipt.receipt_number ?? ''}`, left + width - 4, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(viaLabel, left + width - 4, y + 5, { align: 'right' });

  y += 12;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(formatReceiptAmount(receipt), left + 4, y);
  y += 8;

  const line = (label: string, value?: string) => {
    if (!value) return;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(label, left + 4, y);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(value, width - 46);
    doc.text(lines, left + 42, y);
    y += 5 * lines.length;
  };

  line('PAGADOR:', receipt.payer?.name);
  line('CPF/CNPJ:', receipt.payer?.cpf_cnpj || receipt.payer?.document);
  line('FAVORECIDO:', receipt.payee?.name);
  line('CPF/CNPJ:', receipt.payee?.cpf_cnpj || receipt.payee?.document);
  line('DATA:', formatDateBR(receipt.document_date));
  line('DOCUMENTO:', receipt.document_number);
  line('SAFRA:', receipt.crop?.name);
  line('FORMA DE PAGAMENTO:', receipt.payment_method);

  const bank = receipt.bank_account;
  if (bank && (bank.bank_name || bank.account_number || bank.pix_key)) {
    const parts = [
      bank.bank_name,
      bank.agency_number ? `Ag. ${bank.agency_number}` : '',
      bank.operation_number ? `Op. ${bank.operation_number}` : '',
      bank.account_number ? `C/C ${bank.account_number}` : '',
      bank.account_type,
      bank.pix_key ? `PIX ${bank.pix_key}` : '',
    ].filter(Boolean);
    line('CONTA BANCÁRIA:', parts.join(' · '));
  }

  line('DESCRIÇÃO:', receipt.description);

  const signatureY = top + height - 16;
  doc.setLineWidth(0.2);
  doc.line(left + 20, signatureY, left + width - 20, signatureY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(receipt.payee?.name || 'Assinatura do favorecido', PAGE_W / 2, signatureY + 5, {
    align: 'center',
  });
}

/** Gera um PDF A4 com duas vias idênticas separadas por linha de corte. */
export async function buildReceiptPdf(receipt: PayAccountReceipt): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const logo = await loadLogo(receipt.logo_url);
  const usable = PAGE_H - MARGIN * 2;
  const viaHeight = (usable - 8) / 2;

  drawVia(doc, receipt, MARGIN, viaHeight, logo, '1ª VIA');

  const cutY = MARGIN + viaHeight + 4;
  doc.setLineDashPattern([2, 2], 0);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, cutY, PAGE_W - MARGIN, cutY);
  doc.setLineDashPattern([], 0);

  drawVia(doc, receipt, cutY + 4, viaHeight, logo, '2ª VIA');

  return doc.output('blob');
}
