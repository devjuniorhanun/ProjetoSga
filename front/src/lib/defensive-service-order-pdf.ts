import jsPDF from 'jspdf';
import type { AgriculturalDefensiveOrder } from '@/lib/api-services-entries';
import type { ExportConfig } from '@/lib/export-utils';
import {
  buildDefensiveServiceOrderDocument,
  DEFENSIVE_ORDER_LAYOUT,
  DEFENSIVE_ORDER_TEXT,
  type DefensiveServiceOrderDocumentModel,
} from '@/lib/defensive-service-order-document';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((character) => character + character).join('') : clean;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

function sanitizeFilePart(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '') || 'ordem';
}

function drawFittedText(
  doc: jsPDF,
  text: string,
  x: number,
  baseline: number,
  maxWidth: number,
  options?: { align?: 'left' | 'center' | 'right'; maxSize?: number; minSize?: number },
) {
  const maxSize = options?.maxSize ?? 7;
  const minSize = options?.minSize ?? 5;
  let size = maxSize;
  doc.setFontSize(size);
  while (size > minSize && doc.getTextWidth(text) > maxWidth) {
    size -= 0.25;
    doc.setFontSize(size);
  }
  const clipped = doc.getTextWidth(text) <= maxWidth ? text : `${text.slice(0, Math.max(1, Math.floor(text.length * maxWidth / doc.getTextWidth(text)) - 1))}…`;
  doc.text(clipped, x, baseline, { align: options?.align ?? 'left' });
}

function drawLabelValue(doc: jsPDF, label: string, value: string, x: number, y: number, width: number, height: number) {
  doc.rect(x, y, width, height, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  const labelWidth = doc.getTextWidth(label);
  doc.text(label, x + 3, y + height / 2 + 2.5);
  doc.setFont('helvetica', 'normal');
  drawFittedText(doc, value, x + 5 + labelWidth, y + height / 2 + 2.5, Math.max(8, width - labelWidth - 9), { maxSize: 7, minSize: 4.5 });
}

function renderPdf(model: DefensiveServiceOrderDocumentModel): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = DEFENSIVE_ORDER_LAYOUT.pageInsetPt;
  const width = pageWidth - margin * 2;
  const third = width / 3;
  const half = width / 2;
  const lineWidth = 0.55;
  let y = margin;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(lineWidth);

  const banner = (text: string, background: string, foreground: string, height: number, fontSize: number) => {
    doc.setFillColor(...hexToRgb(background));
    doc.rect(margin, y, width, height, 'FD');
    doc.setTextColor(...hexToRgb(foreground));
    doc.setFont('helvetica', 'bold');
    drawFittedText(doc, text, margin + width / 2, y + height / 2 + fontSize * 0.3, width - 8, { align: 'center', maxSize: fontSize, minSize: 8 });
    y += height;
  };

  banner(model.producerName, model.producerColor, model.producerTextColor, DEFENSIVE_ORDER_LAYOUT.producerHeightPt, 20);
  banner(model.propertyName, model.propertyColor, model.propertyTextColor, DEFENSIVE_ORDER_LAYOUT.propertyHeightPt, 17);
  doc.setTextColor(0, 0, 0);
  y += 5;
  doc.rect(margin, y, width, DEFENSIVE_ORDER_LAYOUT.titleHeightPt, 'S');
  doc.setFont('helvetica', 'bold');
  drawFittedText(doc, model.title, margin + width / 2, y + 13, width - 8, { align: 'center', maxSize: 10, minSize: 7 });
  y += DEFENSIVE_ORDER_LAYOUT.titleHeightPt + 5;

  model.infoRows.forEach((row) => {
    row.forEach((cell, index) => drawLabelValue(doc, cell.label, cell.value, margin + index * third, y, third, DEFENSIVE_ORDER_LAYOUT.infoRowHeightPt));
    y += DEFENSIVE_ORDER_LAYOUT.infoRowHeightPt;
  });
  drawLabelValue(doc, 'VAZÃO(LT).:', model.flow, margin, y, width, DEFENSIVE_ORDER_LAYOUT.infoRowHeightPt);
  y += DEFENSIVE_ORDER_LAYOUT.infoRowHeightPt + 5;

  const productHeight = model.compact
    ? Math.max(7.5, Math.min(DEFENSIVE_ORDER_LAYOUT.productRowHeightPt, 210 / model.products.length))
    : DEFENSIVE_ORDER_LAYOUT.productRowHeightPt;
  doc.setFontSize(model.compact ? 6 : 7.5);
  doc.setFont('helvetica', 'bold');
  doc.rect(margin, y, half, productHeight, 'S');
  doc.rect(margin + half, y, half, productHeight, 'S');
  doc.text(DEFENSIVE_ORDER_TEXT.products, margin + 3, y + productHeight / 2 + 2.5);
  doc.text(DEFENSIVE_ORDER_TEXT.productQuantity, margin + half + half / 2, y + productHeight / 2 + 2.5, { align: 'center' });
  y += productHeight;
  model.products.forEach((product) => {
    doc.rect(margin, y, half, productHeight, 'S');
    doc.rect(margin + half, y, half, productHeight, 'S');
    if (!product.empty) {
      doc.setFont('helvetica', 'normal');
      drawFittedText(doc, `${product.position} - ${product.name}`, margin + 3, y + productHeight / 2 + 2.25, half - 6, { maxSize: model.compact ? 6 : 7.5, minSize: 4.5 });
      doc.text(product.pump, margin + half + half / 2, y + productHeight / 2 + 2.25, { align: 'center' });
    }
    y += productHeight;
  });

  const ctrlHeight = DEFENSIVE_ORDER_LAYOUT.controlHeaderHeightPt;
  const operatorHeight = DEFENSIVE_ORDER_LAYOUT.operatorRowHeightPt;
  const operatorBlock = (x: number, top: number, operator: { name: string; fleet: string }) => {
    let blockY = top;
    drawLabelValue(doc, DEFENSIVE_ORDER_TEXT.fleet, operator.fleet, x, blockY, half / 2, operatorHeight);
    drawLabelValue(doc, DEFENSIVE_ORDER_TEXT.operator, operator.name, x + half / 2, blockY, half / 2, operatorHeight);
    blockY += operatorHeight;
    const full = (text: string, centered = false) => {
      doc.rect(x, blockY, half, operatorHeight, 'S');
      doc.setFont('helvetica', 'bold');
      drawFittedText(doc, text, centered ? x + half / 2 : x + 3, blockY + operatorHeight / 2 + 2.25, half - 6, { align: centered ? 'center' : 'left', maxSize: 6.5, minSize: 4.5 });
      blockY += operatorHeight;
    };
    full(DEFENSIVE_ORDER_TEXT.previousApplications, true);
    full(`${DEFENSIVE_ORDER_TEXT.previousOrder} `);
    full(`${DEFENSIVE_ORDER_TEXT.previousField} `);
    full(`${DEFENSIVE_ORDER_TEXT.previousMix} `);
    full(`${DEFENSIVE_ORDER_TEXT.bombs} ${Array.from({ length: 12 }, (_, index) => `${index + 1} (  )`).join(' ')}`);
    full(`${DEFENSIVE_ORDER_TEXT.currentMix} `);
    full(`${DEFENSIVE_ORDER_TEXT.totalApplied} `);
  };

  model.controls.forEach((control) => {
    doc.rect(margin, y, width, ctrlHeight, 'S');
    doc.setFont('helvetica', 'bold');
    drawFittedText(doc, `${DEFENSIVE_ORDER_TEXT.control} ${control.date}`, margin + width / 2, y + ctrlHeight / 2 + 2.5, width - 6, { align: 'center', maxSize: 7.5, minSize: 6 });
    y += ctrlHeight;
    drawLabelValue(doc, DEFENSIVE_ORDER_TEXT.tanker, control.tanker, margin, y, width, ctrlHeight);
    y += ctrlHeight;
    operatorBlock(margin, y, control.operators[0]);
    operatorBlock(margin + half, y, control.operators[1]);
    y += operatorHeight * 8;
  });

  drawLabelValue(doc, DEFENSIVE_ORDER_TEXT.totalReal, model.usedBomb, margin, y, width, DEFENSIVE_ORDER_LAYOUT.footerRowHeightPt);
  y += DEFENSIVE_ORDER_LAYOUT.footerRowHeightPt;
  drawLabelValue(doc, DEFENSIVE_ORDER_TEXT.closingDate, model.closingDate, margin, y, width, DEFENSIVE_ORDER_LAYOUT.footerRowHeightPt);

  doc.setTextColor(90, 90, 90);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`${DEFENSIVE_ORDER_TEXT.credit} ${model.generatedAt}`, margin, pageHeight - 5);
  doc.text(DEFENSIVE_ORDER_TEXT.page, pageWidth - margin, pageHeight - 5, { align: 'right' });
  return doc;
}

export function createDefensiveServiceOrderPdf(
  orderOrModel: AgriculturalDefensiveOrder | DefensiveServiceOrderDocumentModel,
  config?: ExportConfig,
  generatedAt?: Date,
): { doc: jsPDF; model: DefensiveServiceOrderDocumentModel; fileName: string } {
  const model = 'infoRows' in orderOrModel
    ? orderOrModel
    : buildDefensiveServiceOrderDocument(orderOrModel, config, generatedAt);
  const doc = renderPdf(model);
  return { doc, model, fileName: `ordem-de-servico-${sanitizeFilePart(model.number)}.pdf` };
}

export function exportDefensiveServiceOrderPdf(
  orderOrModel: AgriculturalDefensiveOrder | DefensiveServiceOrderDocumentModel,
  config?: ExportConfig,
  generatedAt?: Date,
): string {
  const { doc, fileName } = createDefensiveServiceOrderPdf(orderOrModel, config, generatedAt);
  doc.save(fileName);
  return fileName;
}
