import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus } from 'lucide-react';
import { grainTicketsService } from '@/lib/api-services-grain';
import { GrainTicketForm } from '@/components/grain/GrainTicketForm';
import { GrainTicketWorkflow } from '@/components/grain/GrainTicketWorkflow';
import { GrainStatusBadge } from '@/components/grain/GrainStatusBadge';
import { formatDateTimeBR, formatWeightKg } from '@/lib/grain-format';
import type { GrainOperationType, GrainTicket } from '@/types/grain';

interface Props {
  operationType: GrainOperationType;
  title: string;
  description: string;
}

/** Fluxo completo de uma operação de balança (recebimento, expedição ou impureza). */
export default function GrainOperationPage({ operationType, title, description }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ['grain-tickets', operationType],
    queryFn: () => grainTicketsService.getAll({ operation_type: operationType, per_page: 25 }),
  });

  if (selectedId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedId(null)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a lista
        </Button>
        <GrainTicketWorkflow ticketId={selectedId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova operação
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Tickets</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-6 text-center text-muted-foreground">Carregando...</p>
          ) : (
            <DataTable<GrainTicket>
              data={data}
              exportTitle={title}
              searchKeys={['ticket_number', 'producer_name', 'license_plate', 'culture_name']}
              columns={[
                { key: 'ticket_number', label: 'Ticket', render: (t) => t.ticket_number ?? t.id },
                { key: 'producer_name', label: 'Produtor', render: (t) => t.producer_name ?? '-' },
                { key: 'farm_name', label: 'Fazenda', render: (t) => t.farm_name ?? '-' },
                { key: 'culture_name', label: 'Cultura', render: (t) => t.culture_name ?? '-' },
                { key: 'license_plate', label: 'Placa', render: (t) => t.license_plate ?? '-' },
                { key: 'net_weight', label: 'Peso líquido', render: (t) => formatWeightKg(t.net_weight ?? 0) },
                { key: 'created_at', label: 'Abertura', render: (t) => (t.created_at ? formatDateTimeBR(t.created_at) : '-') },
                { key: 'status', label: 'Situação', render: (t) => <GrainStatusBadge kind="ticket" status={t.status} /> },
              ]}
              actions={(t) => (
                <Button variant="ghost" size="sm" onClick={() => setSelectedId(t.id)}>
                  Abrir
                </Button>
              )}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{title} — nova operação</DialogTitle></DialogHeader>
          <GrainTicketForm
            operationType={operationType}
            onCancel={() => setFormOpen(false)}
            onCreated={(ticket) => {
              setFormOpen(false);
              setSelectedId(ticket.id);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
