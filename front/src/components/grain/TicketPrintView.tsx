import { formatDateTimeBR, formatPercentage, formatWeightKg } from '@/lib/grain-format';
import { OPERATION_TYPE_LABELS, TICKET_STATUS_LABELS, WEIGHING_STAGE_LABELS, labelOr } from '@/lib/grain-labels';
import type { GrainTicket } from '@/types/grain';

interface Props {
  ticket: GrainTicket;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between gap-4 border-b border-dashed py-1 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value ?? '-'}</span>
  </div>
);

/** Layout A4 retrato do ticket, usado na impressão (somente CLOSED). */
export function TicketPrintView({ ticket }: Props) {
  return (
    <div className="mx-auto w-full max-w-[210mm] bg-background p-8 print:p-0">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">
          Ticket {ticket.ticket_number ?? ticket.id} — {labelOr(OPERATION_TYPE_LABELS, ticket.operation_type)}
        </h1>
        <p className="text-sm text-muted-foreground">
          Situação: {labelOr(TICKET_STATUS_LABELS, ticket.status)}
          {ticket.closed_at ? ` • Fechado em ${formatDateTimeBR(ticket.closed_at)}` : ''}
        </p>
      </header>

      <section className="grid gap-x-8 gap-y-1 md:grid-cols-2">
        <Row label="Produtor" value={ticket.producer_name} />
        <Row label="Fazenda" value={ticket.farm_name} />
        <Row label="Inscrição estadual" value={ticket.state_registration} />
        <Row label="Safra" value={ticket.crop_name} />
        <Row label="Cultura" value={ticket.culture_name} />
        <Row label="Comprador" value={ticket.buyer_name} />
        <Row label="Armazém" value={ticket.grain_warehouse_name} />
        <Row label="Local" value={ticket.grain_storage_location_name} />
        <Row label="Motorista" value={ticket.grain_transport_driver_name} />
        <Row label="Placa" value={ticket.license_plate} />
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">Pesagens</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1">Etapa</th>
              <th>Peso</th>
              <th>Origem</th>
              <th>Data/hora</th>
            </tr>
          </thead>
          <tbody>
            {(ticket.weighings ?? []).map((w, i) => (
              <tr key={w.id ?? i} className="border-b border-dashed">
                <td className="py-1">{labelOr(WEIGHING_STAGE_LABELS, w.stage)}</td>
                <td>{formatWeightKg(w.weight)}</td>
                <td>{w.source === 'MANUAL' ? 'Manual' : 'Automática'}</td>
                <td>{w.weighed_at ? formatDateTimeBR(w.weighed_at) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {(ticket.discounts ?? []).length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">Descontos</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-1">Tipo</th>
                <th>Percentual</th>
                <th>Peso descontado</th>
              </tr>
            </thead>
            <tbody>
              {(ticket.discounts ?? []).map((d, i) => (
                <tr key={d.id ?? i} className="border-b border-dashed">
                  <td className="py-1">{d.grain_discount_type_name ?? d.grain_discount_type_id}</td>
                  <td>{formatPercentage(d.percentage)}</td>
                  <td>{formatWeightKg(d.discount_weight ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="mt-6 grid gap-x-8 gap-y-1 md:grid-cols-2">
        <Row label="Peso bruto" value={formatWeightKg(ticket.gross_weight ?? 0)} />
        <Row label="Tara" value={formatWeightKg(ticket.tare_weight ?? 0)} />
        <Row label="Peso líquido" value={formatWeightKg(ticket.net_weight ?? 0)} />
        <Row label="Peso líquido comercial" value={formatWeightKg(ticket.commercial_net_weight ?? 0)} />
      </section>

      {ticket.status === 'CANCELED' && ticket.cancel_reason && (
        <p className="mt-6 text-sm text-destructive">Cancelamento: {ticket.cancel_reason}</p>
      )}

      <footer className="mt-10 text-xs text-muted-foreground">
        Código de verificação: {ticket.verification_code ?? '-'}
      </footer>
    </div>
  );
}
