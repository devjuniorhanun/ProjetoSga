import jsPDF from 'jspdf';
import { formatCurrencyBRL, formatNumberBR } from './format-helpers';
import { loadLogo } from './pdf-logo';
import type {
  ServiceContractParticipant,
  ServiceContractPdfData,
  ServiceContractType,
} from '@/types/service-contracts';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - MARGIN - 10;
const DEFAULT_BAG_WEIGHT_KG = 60;

function text(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function pick(source: Record<string, unknown> | null | undefined, ...keys: string[]): string {
  if (!source) return '';
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value);
  }
  return '';
}

function formatDateBR(value?: unknown): string {
  const raw = text(value);
  if (!raw) return '';
  const iso = raw.slice(0, 10);
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? raw : date.toLocaleDateString('pt-BR');
}

function toNumber(value: unknown): number {
  const num = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(num) ? Number(num) : 0;
}

function participantName(participant: ServiceContractParticipant): string {
  return participant.name || participant.participant_name || participant.description || '';
}

function participantDocument(participant: ServiceContractParticipant): string {
  return participant.cpf || participant.cpf_cnpj || '';
}

class ContractDoc {
  readonly doc: jsPDF;
  private y = MARGIN;
  private page = 1;

  constructor(private readonly logo: Awaited<ReturnType<typeof loadLogo>>) {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    this.header();
  }

  private header() {
    if (this.logo) {
      const maxW = 38;
      const maxH = 18;
      const ratio = Math.min(maxW / this.logo.width, maxH / this.logo.height);
      this.doc.addImage(
        this.logo.dataUrl,
        this.logo.format,
        MARGIN,
        MARGIN - 6,
        this.logo.width * ratio,
        this.logo.height * ratio,
      );
      this.y = MARGIN + 16;
    } else {
      this.y = MARGIN;
    }
  }

  private footer() {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.text(`Página ${this.page}`, PAGE_W - MARGIN, PAGE_H - 12, { align: 'right' });
  }

  private ensure(height: number) {
    if (this.y + height <= BOTTOM) return;
    this.footer();
    this.doc.addPage();
    this.page += 1;
    this.header();
  }

  title(value: string) {
    this.ensure(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(13);
    const lines = this.doc.splitTextToSize(value, CONTENT_W);
    this.doc.text(lines, PAGE_W / 2, this.y, { align: 'center' });
    this.y += 6 * lines.length + 4;
  }

  heading(value: string) {
    this.ensure(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.text(value, MARGIN, this.y);
    this.y += 6;
  }

  paragraph(value: string, bold = false) {
    if (!value) return;
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    this.doc.setFontSize(10);
    const lines = this.doc.splitTextToSize(value, CONTENT_W);
    lines.forEach((line: string) => {
      this.ensure(6);
      this.doc.text(line, MARGIN, this.y, { maxWidth: CONTENT_W });
      this.y += 5;
    });
    this.y += 2;
  }

  field(label: string, value: string) {
    if (!value) return;
    this.doc.setFontSize(10);
    const lines = this.doc.splitTextToSize(value, CONTENT_W - 45);
    this.ensure(5 * lines.length);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(label, MARGIN, this.y);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(lines, MARGIN + 45, this.y);
    this.y += 5 * lines.length;
  }

  spacer(height = 4) {
    this.y += height;
  }

  table(headers: string[], rows: string[][]) {
    if (!rows.length) return;
    const colW = CONTENT_W / headers.length;
    this.ensure(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    headers.forEach((head, index) => {
      this.doc.text(head, MARGIN + colW * index + 1, this.y);
    });
    this.y += 2;
    this.doc.setLineWidth(0.2);
    this.doc.line(MARGIN, this.y, PAGE_W - MARGIN, this.y);
    this.y += 4;
    this.doc.setFont('helvetica', 'normal');
    rows.forEach((row) => {
      this.ensure(6);
      row.forEach((cell, index) => {
        const lines = this.doc.splitTextToSize(cell || '-', colW - 2);
        this.doc.text(lines[0] ?? '-', MARGIN + colW * index + 1, this.y);
      });
      this.y += 5;
    });
    this.spacer(3);
  }

  signatures(contractingParty: string, contractor: string, city: string, date: string) {
    this.ensure(46);
    this.spacer(8);
    this.paragraph(`${city ? `${city}, ` : ''}${date}.`);
    this.spacer(14);
    const half = CONTENT_W / 2;
    const lineY = this.y;
    this.doc.setLineWidth(0.2);
    this.doc.line(MARGIN, lineY, MARGIN + half - 10, lineY);
    this.doc.line(MARGIN + half + 10, lineY, PAGE_W - MARGIN, lineY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.text(contractingParty || 'CONTRATANTE', MARGIN + (half - 10) / 2, lineY + 5, {
      align: 'center',
    });
    this.doc.text(contractor || 'CONTRATADO', MARGIN + half + 10 + (half - 10) / 2, lineY + 5, {
      align: 'center',
    });
    this.y = lineY + 16;

    this.ensure(24);
    const witnessY = this.y + 10;
    this.doc.line(MARGIN, witnessY, MARGIN + half - 10, witnessY);
    this.doc.line(MARGIN + half + 10, witnessY, PAGE_W - MARGIN, witnessY);
    this.doc.text('Testemunha 1', MARGIN + (half - 10) / 2, witnessY + 5, { align: 'center' });
    this.doc.text('Testemunha 2', MARGIN + half + 10 + (half - 10) / 2, witnessY + 5, {
      align: 'center',
    });
    this.y = witnessY + 12;
  }

  finish(): Blob {
    this.footer();
    return this.doc.output('blob');
  }
}

function bankLine(data: ServiceContractPdfData): string {
  const bank = data.bank_account;
  if (!bank) return '';
  return [
    bank.bank_name,
    bank.agency_number ? `Agência ${bank.agency_number}` : '',
    bank.operation_number ? `Operação ${bank.operation_number}` : '',
    bank.account_number ? `Conta ${bank.account_number}` : '',
    bank.account_type,
    bank.pix_key ? `PIX ${bank.pix_key}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

function commonClauses(doc: ContractDoc, observations: string) {
  doc.heading('DAS OBRIGAÇÕES DO CONTRATADO');
  doc.paragraph(
    'O CONTRATADO obriga-se a executar os serviços com pessoal próprio, devidamente habilitado e ' +
      'em condições legais de trabalho, respondendo integralmente pelos encargos trabalhistas, ' +
      'previdenciários, fiscais e securitários de seus empregados e prepostos, bem como por danos ' +
      'causados a terceiros, ao CONTRATANTE ou à produção durante a execução dos serviços.',
  );
  doc.paragraph(
    'O CONTRATADO deve manter os equipamentos e veículos em perfeito estado de conservação e ' +
      'funcionamento, com documentação regular, cumprindo as normas de segurança do trabalho e as ' +
      'orientações operacionais do CONTRATANTE.',
  );

  doc.heading('DAS OBRIGAÇÕES DO CONTRATANTE');
  doc.paragraph(
    'O CONTRATANTE obriga-se a disponibilizar as áreas e as informações necessárias à execução dos ' +
      'serviços e a efetuar os pagamentos nas condições ajustadas neste instrumento.',
  );

  doc.heading('DA RESCISÃO');
  doc.paragraph(
    'O presente contrato poderá ser rescindido por qualquer das partes, mediante comunicação prévia ' +
      'e por escrito, sem prejuízo da conclusão dos serviços em andamento e da quitação dos valores ' +
      'devidos até a data da rescisão. O descumprimento de qualquer cláusula autoriza a rescisão ' +
      'imediata pela parte prejudicada.',
  );

  if (observations) {
    doc.heading('DAS OBSERVAÇÕES');
    doc.paragraph(observations);
  }

  doc.heading('DO FORO');
  doc.paragraph(
    'As partes elegem o foro da comarca da situação do imóvel rural objeto deste contrato para ' +
      'dirimir quaisquer dúvidas ou controvérsias oriundas do presente instrumento, com renúncia a ' +
      'qualquer outro, por mais privilegiado que seja.',
  );
}

function identification(doc: ContractDoc, data: ServiceContractPdfData) {
  const producer = (data.producer ?? data.contracting_party) as Record<string, unknown> | null;
  const supplier = (data.supplier ?? data.contractor) as Record<string, unknown> | null;

  doc.heading('DAS PARTES');
  doc.field('CONTRATANTE:', pick(producer, 'name', 'producer_name', 'owner_name', 'corporate_reason'));
  doc.field('CPF/CNPJ:', pick(producer, 'cpf_cnpj', 'document'));
  doc.field('FAZENDA:', pick(producer, 'farm_name', 'property_name'));
  doc.field('CONTRATADO:', pick(supplier, 'name', 'supplier_name', 'corporate_reason', 'fantasy_name'));
  doc.field('CPF/CNPJ:', pick(supplier, 'cpf_cnpj', 'document'));
  doc.spacer(2);

  doc.heading('DO OBJETO E DO PERÍODO');
  doc.field('SAFRA:', text(data.crop?.name));
  doc.field(
    'PERÍODO:',
    `${formatDateBR(data.opening_date)} a ${formatDateBR(data.closing_date)}`.trim(),
  );
  doc.field('CONTRATO Nº:', text(data.contract_number));
  doc.spacer(2);
}

function participantsSection(
  doc: ContractDoc,
  data: ServiceContractPdfData,
  heading: string,
  columns: string[],
) {
  const participants = data.participants ?? [];
  if (!participants.length) return;
  doc.heading(heading);
  const rows = participants.map((participant) => {
    const base = [participantName(participant), participantDocument(participant)];
    if (columns.length === 3) base.push(participant.plate || participant.vehicle || participant.cnh || '');
    return base;
  });
  doc.table(columns, rows);
}

function bagBase(data: ServiceContractPdfData, fallbackBase: string): { base: string; weight: number } {
  const base = text(data.calculation_base) || fallbackBase;
  const weight = toNumber(data.bag_weight_kg) || DEFAULT_BAG_WEIGHT_KG;
  return { base, weight };
}

export async function buildServiceContractPdf(
  type: ServiceContractType,
  data: ServiceContractPdfData,
): Promise<Blob> {
  const logo = await loadLogo(data.logo_url);
  const doc = new ContractDoc(logo);
  const city = text(data.city);
  const producerName = pick(
    (data.producer ?? data.contracting_party) as Record<string, unknown> | null,
    'name',
    'producer_name',
    'owner_name',
    'corporate_reason',
  );
  const supplierName = pick(
    (data.supplier ?? data.contractor) as Record<string, unknown> | null,
    'name',
    'supplier_name',
    'corporate_reason',
    'fantasy_name',
  );

  if (type === 'TRANSPORT') {
    doc.title('CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE DE GRÃOS');
    identification(doc, data);
    participantsSection(doc, data, 'DOS MOTORISTAS INCLUÍDOS', ['Motorista', 'CPF', 'Veículo/CNH']);

    const { base, weight } = bagBase(data, 'GROSS_BAGS');
    doc.heading('DO PREÇO E DA FORMA DE PAGAMENTO');
    doc.paragraph(
      `Pelos serviços de transporte, o CONTRATANTE pagará ao CONTRATADO o valor de ` +
        `${formatCurrencyBRL(toNumber(data.shipping_cost))} por saca bruta transportada, tendo como ` +
        `base de cálculo ${base === 'GROSS_BAGS' ? 'sacas brutas (GROSS_BAGS)' : base}, considerando o ` +
        `peso padrão de ${formatNumberBR(weight)} kg por saca.`,
    );
    const bank = bankLine(data);
    doc.paragraph(
      bank
        ? `Os pagamentos serão efetuados na conta bancária indicada pelo CONTRATADO: ${bank}.`
        : 'O contrato foi gerado sem dados bancários informados pelo CONTRATADO.',
    );

    if (text(data.service_hours)) {
      doc.heading('DOS HORÁRIOS DE SERVIÇO');
      doc.paragraph(text(data.service_hours));
    }
    if (text(data.extra_service_description)) {
      doc.heading('DOS SERVIÇOS EXTRAS');
      doc.paragraph(text(data.extra_service_description));
    }

    commonClauses(doc, text(data.observations));
    doc.signatures(producerName, supplierName, city, formatDateBR(data.generated_at) || formatDateBR(data.opening_date));
    return doc.finish();
  }

  doc.title('CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE COLHEITA MECANIZADA');
  identification(doc, data);
  participantsSection(doc, data, 'DAS FRENTES DE COLHEITA INCLUÍDAS', ['Frente/Colhedor', 'CPF/CNPJ']);

  const { base, weight } = bagBase(data, 'LIQUID_BAGS');
  doc.heading('DA REMUNERAÇÃO');
  doc.paragraph(
    `Pelos serviços de colheita, o CONTRATANTE pagará ao CONTRATADO o percentual de ` +
      `${formatNumberBR(toNumber(data.remuneration_percentage))}% sobre a produção colhida, tendo como ` +
      `base de cálculo ${base === 'LIQUID_BAGS' ? 'sacas líquidas (LIQUID_BAGS)' : base}, considerando o ` +
      `peso padrão de ${formatNumberBR(weight)} kg por saca.`,
  );
  const bank = bankLine(data);
  doc.paragraph(
    bank
      ? `Os pagamentos serão efetuados na conta bancária indicada pelo CONTRATADO: ${bank}.`
      : 'O contrato foi gerado sem dados bancários informados pelo CONTRATADO.',
  );

  doc.heading('DO COMBUSTÍVEL');
  doc.paragraph(
    data.fuel_supplied_by === 'CONTRACTOR'
      ? 'O combustível utilizado nas máquinas e nos veículos empregados na colheita será fornecido pelo CONTRATADO.'
      : 'O combustível utilizado nas máquinas e nos veículos empregados na colheita será fornecido pelo CONTRATANTE.',
  );

  if (text(data.meal_allowance_description)) {
    doc.heading('DA ALIMENTAÇÃO E DAS DIÁRIAS');
    doc.paragraph(text(data.meal_allowance_description));
  }

  commonClauses(doc, text(data.observations));
  doc.signatures(producerName, supplierName, city, formatDateBR(data.generated_at) || formatDateBR(data.opening_date));
  return doc.finish();
}

export function contractPdfFileName(contractNumber: string, type: ServiceContractType): string {
  const slug = (contractNumber || 'contrato').replace(/[^\w.-]+/g, '-');
  return `contrato-${type.toLowerCase()}-${slug}.pdf`;
}
