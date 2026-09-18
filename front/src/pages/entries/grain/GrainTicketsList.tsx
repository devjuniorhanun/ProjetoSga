import { canPrintTicket } from '@/lib/grain-rules';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/DataTable';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer } from 'lucide-react';
import { grainTicketsService } from '@/lib/api-services-grain';
import { GrainStatusBadge } from '@/components/grain/GrainStatusBadge';
import { formatDateTimeBR, formatWeightKg } from '@/lib/grain-format';
import { OPERATION_TYPE_LABELS, TICKET_STATUS_LABELS, labelOr } from '@/lib/grain-labels';
import type { GrainTicket } from '@/types/grain';

const ALL = 'ALL';

export default function GrainTicketsList() {
  const navigate = useNavigate();
  const [operationType, setOperationType] = useState(ALL);
  const [status, setStatus] = useState(ALL);

  const { data = [], isLoading } = useQuery({
    queryKey: ['grain-tickets', operationType, status],
    queryFn: () =>
      grainTicketsService.getAll({
        per_page: 25,
        ...(operationType !== ALL ? { operation_type: operationType } : {}),
        ...(status !== ALL ? { status } : {}),
      }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portarias e Tickets</h1>
        <p className="mt-1 text-muted-foreground">Todos os tickets de balança registrados</p>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Operação</Label>
            <Select value={operationType} onValueChange={setOperationType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {Object.entries(OPERATION_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Situação</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="py-6 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable<GrainTicket>
          data={data}
          exportTitle="Portarias e Tickets"
          searchKeys={['ticket_number', 'producer_name', 'license_plate', 'culture_name']}
          columns={[
            { key: 'ticket_number', label: 'Ticket', render: (t) => t.ticket_number ?? t.id },
            { key: 'operation_type', label: 'Operação', render: (t) => labelOr(OPERATION_TYPE_LABELS, t.operation_type) },
            { key: 'producer_name', label: 'Produtor', render: (t) => t.producer_name ?? '-' },
            { key: 'culture_name', label: 'Cultura', render: (t) => t.culture_name ?? '-' },
            { key: 'license_plate', label: 'Placa', render: (t) => t.license_plate ?? '-' },
            { key: 'net_weight', label: 'Peso líquido', render: (t) => formatWeightKg(t.net_weight ?? 0) },
            { key: 'created_at', label: 'Abertura', render: (t) => (t.created_at ? formatDateTimeBR(t.created_at) : '-') },
            { key: 'status', label: 'Situação', render: (t) => <GrainStatusBadge kind="ticket" status={t.status} /> },
          ]}
          actions={(t) => (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Imprimir"
              disabled={!canPrintTicket(t.status)}
              onClick={() => navigate(`/entries/grain/tickets/${t.id}/print`)}
            >
              <Printer className="h-4 w-4" />
            </Button>
          )}
        />
      )}
    </div>
  );
}
