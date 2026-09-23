import type { CSSProperties } from 'react';
import type { AgriculturalDefensiveOrder } from '@/lib/api-services-entries';
import type { ExportConfig } from '@/lib/export-utils';
import {
  buildDefensiveServiceOrderDocument,
  DEFENSIVE_ORDER_TEXT,
  type DefensiveOrderDocumentOperator,
  type DefensiveServiceOrderDocumentModel,
} from '@/lib/defensive-service-order-document';

interface Props {
  order?: AgriculturalDefensiveOrder;
  config?: ExportConfig;
  model?: DefensiveServiceOrderDocumentModel;
  generatedAt?: Date;
}

const manualLine = '\u00A0';
const bombs = Array.from({ length: 12 }, (_, index) => `${index + 1} (   )`).join('  ');

function OperatorBlock({ operator }: { operator: DefensiveOrderDocumentOperator }) {
  return (
    <table className="defensive-order-operator-table w-full table-fixed border-collapse">
      <tbody>
        <tr>
          <td className="w-1/2 border border-black px-1"><strong>{DEFENSIVE_ORDER_TEXT.fleet}</strong> {operator.fleet}</td>
          <td className="w-1/2 border border-black px-1"><strong>{DEFENSIVE_ORDER_TEXT.operator}</strong> {operator.name}</td>
        </tr>
        <tr><td className="border border-black px-1 text-center font-bold" colSpan={2}>{DEFENSIVE_ORDER_TEXT.previousApplications}</td></tr>
        <tr><td className="border border-black px-1 font-bold" colSpan={2}>{DEFENSIVE_ORDER_TEXT.previousOrder} {manualLine}</td></tr>
        <tr><td className="border border-black px-1 font-bold" colSpan={2}>{DEFENSIVE_ORDER_TEXT.previousField} {manualLine}</td></tr>
        <tr><td className="border border-black px-1 font-bold" colSpan={2}>{DEFENSIVE_ORDER_TEXT.previousMix} {manualLine}</td></tr>
        <tr><td className="defensive-order-bombs border border-black px-1 font-bold" colSpan={2}>{DEFENSIVE_ORDER_TEXT.bombs} {bombs}</td></tr>
        <tr><td className="border border-black px-1 font-bold" colSpan={2}>{DEFENSIVE_ORDER_TEXT.currentMix} {manualLine}</td></tr>
        <tr><td className="border border-black px-1 font-bold" colSpan={2}>{DEFENSIVE_ORDER_TEXT.totalApplied} {manualLine}</td></tr>
      </tbody>
    </table>
  );
}

export function DefensiveServiceOrderDocument({ order, config, model, generatedAt }: Props) {
  const document = model ?? (order ? buildDefensiveServiceOrderDocument(order, config, generatedAt) : null);
  if (!document) return null;

  const style = {
    '--producer-color': document.producerColor,
    '--producer-text-color': document.producerTextColor,
    '--property-color': document.propertyColor,
    '--property-text-color': document.propertyTextColor,
    '--product-row-height': document.compact ? `${Math.max(7.5, Math.min(14, 210 / document.products.length))}pt` : '14pt',
    '--document-font-size': document.compact ? '6pt' : '7pt',
  } as CSSProperties;

  return (
    <article className="defensive-order-document" data-testid="defensive-order-document" style={style}>
      <header>
        <div className="defensive-order-producer">{document.producerName || '\u00A0'}</div>
        <div className="defensive-order-property">{document.propertyName || '\u00A0'}</div>
      </header>

      <div className="defensive-order-spacer" />
      <h1 className="defensive-order-title">{document.title}</h1>
      <div className="defensive-order-spacer" />

      <table className="w-full table-fixed border-collapse">
        <tbody>
          {document.infoRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell) => (
                <td className="w-1/3 border border-black px-1" key={cell.label}>
                  <strong>{cell.label}</strong> {cell.value}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="border border-black px-1" colSpan={3}><strong>VAZÃO(LT).:</strong> {document.flow}</td>
          </tr>
        </tbody>
      </table>

      <div className="defensive-order-spacer" />
      <table className="defensive-order-products w-full table-fixed border-collapse">
        <thead>
          <tr>
            <th className="w-1/2 border border-black px-1 text-left">{DEFENSIVE_ORDER_TEXT.products}</th>
            <th className="w-1/2 border border-black px-1 text-center">{DEFENSIVE_ORDER_TEXT.productQuantity}</th>
          </tr>
        </thead>
        <tbody>
          {document.products.map((product) => (
            <tr key={product.key} data-product-row="true" data-empty={product.empty || undefined}>
              <td className="border border-black px-1">{product.name ? `${product.position} - ${product.name}` : manualLine}</td>
              <td className="border border-black px-1 text-center">{product.pump || manualLine}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="defensive-order-controls">
        {document.controls.map((control, index) => (
          <section className="defensive-order-control" key={index} data-testid="application-control">
            <table className="w-full table-fixed border-collapse">
              <tbody>
                <tr><td className="border border-black px-1 text-center font-bold">{DEFENSIVE_ORDER_TEXT.control} {control.date}</td></tr>
                <tr><td className="border border-black px-1"><strong>{DEFENSIVE_ORDER_TEXT.tanker}</strong> {control.tanker}</td></tr>
              </tbody>
            </table>
            <div className="grid grid-cols-2">
              <OperatorBlock operator={control.operators[0]} />
              <OperatorBlock operator={control.operators[1]} />
            </div>
          </section>
        ))}
      </section>

      <table className="w-full table-fixed border-collapse">
        <tbody>
          <tr><td className="border border-black px-1 font-bold">{DEFENSIVE_ORDER_TEXT.totalReal} {document.usedBomb}</td></tr>
          <tr><td className="border border-black px-1 font-bold">{DEFENSIVE_ORDER_TEXT.closingDate} {document.closingDate}</td></tr>
        </tbody>
      </table>

      <footer className="defensive-order-institutional-footer">
        <span>{DEFENSIVE_ORDER_TEXT.credit} {document.generatedAt}</span>
        <span>{DEFENSIVE_ORDER_TEXT.page}</span>
      </footer>
    </article>
  );
}

export default DefensiveServiceOrderDocument;
