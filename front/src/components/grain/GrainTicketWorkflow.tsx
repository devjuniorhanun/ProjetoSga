import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Printer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { applyApiErrors } from '@/lib/form-errors';
import {
  grainImpurityTypesService,
  grainTicketsService,
} from '@/lib/api-services-grain';
import { formatWeightKg } from '@/lib/grain-format';
import { canPrintTicket } from '@/lib/grain-rules';
import { OPERATION_TYPE_LABELS, labelOr } from '@/lib/grain-labels';
import { TicketStatusStepper } from './TicketStatusStepper';
import { WeightCapturePanel } from './WeightCapturePanel';
import { DiscountGrid } from './DiscountGrid';
import { ContractAllocationPreview } from './ContractAllocationPreview';
import { AuthorizationFlowDialog } from './AuthorizationFlowDialog';
import { GrainStatusBadge } from './GrainStatusBadge';
import { WeightInput } from './WeightInput';
import type { AvailableContractsPreview, GrainTicket, ImpurityItemPayload } from '@/types/grain';

interface Props {
  ticketId: string;
  onFinished?: () => void;
}

interface ImpurityRow extends ImpurityItemPayload {
  key: string;
}

export function GrainTicketWorkflow({ ticketId, onFinished }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<AvailableContractsPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [closing, setClosing] = useState(false);
  const [shipmentAuthId, setShipmentAuthId] = useState<string | null>(null);
  const [shipmentAuthOpen, setShipmentAuthOpen] = useState(false);
  const [cancelAuthOpen, setCancelAuthOpen] = useState(false);
  const [operatorName, setOperatorName] = useState('');
  const [vehicleDescription, setVehicleDescription] = useState('');
  const [destination, setDestination] = useState('');
  const [impurityRows, setImpurityRows] = useState<ImpurityRow[]>([]);

  const { data: ticket, isLoading, refetch } = useQuery({
    queryKey: ['grain-ticket', ticketId],
    queryFn: () => grainTicketsService.getById(ticketId),
  });

  const { data: impurityTypes = [] } = useQuery({
    queryKey: ['grain-impurity-types', 'active'],
    queryFn: () => grainImpurityTypesService.getAll({ status: 'A', per_page: 100 }),
    enabled: ticket?.operation_type === 'IMPURITY_OUTPUT',
  });

  const { data: sourceTickets = [] } = useQuery({
    queryKey: ['grain-source-entry-tickets', ticket?.culture_id],
    queryFn: () =>
      grainTicketsService.getAll({
        operation_type: 'ENTRY',
        status: 'CLOSED',
        culture_id: ticket?.culture_id,
        per_page: 100,
      }),
    enabled: ticket?.operation_type === 'IMPURITY_OUTPUT' && !!ticket?.culture_id,
  });

  const refresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['grain-tickets'] });
  };

  const impuritySum = useMemo(
    () => impurityRows.reduce((sum, r) => sum + Number(r.quantity || 0), 0),
    [impurityRows],
  );

  if (isLoading || !ticket) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isEntry = ticket.operation_type === 'ENTRY';
  const isExit = ticket.operation_type === 'EXIT';
  const isImpurity = ticket.operation_type === 'IMPURITY_OUTPUT';
  const firstMeaning = isEntry ? 'peso bruto' : 'tara';
  const secondMeaning = isEntry ? 'tara' : 'peso bruto';
  const netWeight = Number(ticket.net_weight ?? 0);

  const loadPreview = async () => {
    setLoadingPreview(true);
    try {
      setPreview(await grainTicketsService.availableContracts(ticket.id));
    } catch (error) {
      applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível consultar os contratos.' });
    } finally {
      setLoadingPreview(false);
    }
  };

  const closeTicket = async () => {
    if (isImpurity) {
      if (impurityRows.some((r) => !r.grain_impurity_type_id || !r.source_entry_ticket_id || r.quantity <= 0)) {
        toast.error('Preencha todos os itens de impureza.');
        return;
      }
      if (Math.abs(impuritySum - netWeight) > 0.001) {
        toast.error('A soma das impurezas deve ser igual ao peso líquido do ticket.');
        return;
      }
      if (!operatorName.trim()) {
        toast.error('Informe o operador responsável.');
        return;
      }
    }
    setClosing(true);
    try {
      await grainTicketsService.close(ticket.id, {
        authorization_request_id: shipmentAuthId,
        ...(isImpurity
          ? {
              operator_name: operatorName.trim(),
              vehicle_description: vehicleDescription.trim() || null,
              destination: destination.trim() || null,
              impurity_items: impurityRows.map(({ key, ...item }) => item),
            }
          : {}),
      });
      toast.success('Ticket fechado com sucesso.');
      setShipmentAuthId(null);
      refresh();
      onFinished?.();
    } catch (error) {
      applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível fechar o ticket.' });
    } finally {
      setClosing(false);
    }
  };

  const canPrint = canPrintTicket(ticket.status);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>
              Ticket {ticket.ticket_number ?? ticket.id} — {labelOr(OPERATION_TYPE_LABELS, ticket.operation_type)}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {ticket.producer_name} • {ticket.farm_name} • {ticket.culture_name} • Placa {ticket.license_plate ?? '-'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GrainStatusBadge kind="ticket" status={ticket.status} />
            <Button
              variant="outline"
              size="sm"
              disabled={!canPrint}
              title={canPrint ? 'Imprimir ticket' : 'Disponível somente após o fechamento do ticket'}
              onClick={() => navigate(`/entries/grain/tickets/${ticket.id}/print`)}
            >
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
            {ticket.status !== 'CLOSED' && ticket.status !== 'CANCELED' && (
              <Button variant="outline" size="sm" onClick={() => setCancelAuthOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Cancelar ticket
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <TicketStatusStepper status={ticket.status} operationType={ticket.operation_type} />
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Peso bruto</p>
              <p className="font-semibold">{formatWeightKg(ticket.gross_weight ?? 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tara</p>
              <p className="font-semibold">{formatWeightKg(ticket.tare_weight ?? 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Peso líquido</p>
              <p className="font-semibold">{formatWeightKg(netWeight)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Líquido comercial</p>
              <p className="font-semibold">{formatWeightKg(ticket.commercial_net_weight ?? 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {ticket.status === 'WAITING_FIRST_WEIGHT' && (
        <Card>
          <CardHeader><CardTitle>1ª pesagem ({firstMeaning})</CardTitle></CardHeader>
          <CardContent>
            <WeightCapturePanel ticket={ticket} stage="FIRST" stageMeaning={firstMeaning} onCaptured={refresh} />
          </CardContent>
        </Card>
      )}

      {ticket.status === 'WAITING_DISCOUNTS' && (
        <Card>
          <CardHeader><CardTitle>Descontos de qualidade</CardTitle></CardHeader>
          <CardContent>
            <DiscountGrid ticket={ticket} onSaved={refresh} />
          </CardContent>
        </Card>
      )}

      {ticket.status === 'WAITING_SECOND_WEIGHT' && (
        <Card>
          <CardHeader><CardTitle>2ª pesagem ({secondMeaning})</CardTitle></CardHeader>
          <CardContent>
            <WeightCapturePanel ticket={ticket} stage="SECOND" stageMeaning={secondMeaning} onCaptured={refresh} />
          </CardContent>
        </Card>
      )}

      {ticket.status === 'SECOND_WEIGHED' && (
        <Card>
          <CardHeader><CardTitle>Fechamento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isExit && (
              <>
                <Button variant="outline" onClick={loadPreview} disabled={loadingPreview}>
                  {loadingPreview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Consultar contratos disponíveis
                </Button>
                {preview && <ContractAllocationPreview preview={preview} />}
                {preview?.requires_authorization && !shipmentAuthId && (
                  <Button variant="outline" onClick={() => setShipmentAuthOpen(true)}>
                    Solicitar autorização de múltiplos contratos
                  </Button>
                )}
              </>
            )}

            {isImpurity && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Operador</Label>
                    <Input value={operatorName} onChange={(e) => setOperatorName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Veículo</Label>
                    <Input value={vehicleDescription} onChange={(e) => setVehicleDescription(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Destino</Label>
                    <Input value={destination} onChange={(e) => setDestination(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-3">
                  {impurityRows.map((row, index) => (
                    <div key={row.key} className="grid gap-3 sm:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Tipo de impureza</Label>
                        <Select
                          value={row.grain_impurity_type_id}
                          onValueChange={(v) =>
                            setImpurityRows((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, grain_impurity_type_id: v } : r)),
                            )
                          }
                        >
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {impurityTypes.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Ticket de origem</Label>
                        <Select
                          value={row.source_entry_ticket_id}
                          onValueChange={(v) =>
                            setImpurityRows((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, source_entry_ticket_id: v } : r)),
                            )
                          }
                        >
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {sourceTickets.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.ticket_number ?? t.id} — {formatWeightKg(t.net_weight ?? 0)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Quantidade (kg)</Label>
                        <WeightInput
                          value={row.quantity}
                          onChange={(v) =>
                            setImpurityRows((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, quantity: v } : r)),
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setImpurityRows((prev) => [
                          ...prev,
                          {
                            key: `${Date.now()}-${prev.length}`,
                            grain_impurity_type_id: '',
                            source_entry_ticket_id: '',
                            quantity: 0,
                          },
                        ])
                      }
                    >
                      Adicionar impureza
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Soma dos itens: {formatWeightKg(impuritySum)} • Peso líquido: {formatWeightKg(netWeight)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={closeTicket}
              disabled={closing || (isExit && (!preview || !preview.can_close))}
            >
              {closing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Fechar ticket
            </Button>
          </CardContent>
        </Card>
      )}

      <AuthorizationFlowDialog
        open={shipmentAuthOpen}
        onOpenChange={setShipmentAuthOpen}
        operationType="MULTIPLE_CONTRACT_SHIPMENT"
        resourceType="grain_ticket"
        resourceId={ticket.id}
        payloadRequested={{ allocations: preview?.allocations ?? [] }}
        onApproved={(id) => setShipmentAuthId(id)}
      />

      <AuthorizationFlowDialog
        open={cancelAuthOpen}
        onOpenChange={setCancelAuthOpen}
        operationType="CANCEL_TICKET"
        resourceType="grain_ticket"
        resourceId={ticket.id}
        payloadRequested={{ ticket_id: ticket.id }}
        description="O cancelamento do ticket exige aprovação administrativa."
        onApproved={async (authorizationId) => {
          try {
            await grainTicketsService.cancel(ticket.id, {
              authorization_request_id: authorizationId,
              reason: 'Cancelamento autorizado',
            });
            toast.success('Ticket cancelado.');
            setCancelAuthOpen(false);
            refresh();
          } catch (error) {
            applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível cancelar o ticket.' });
          }
        }}
      />
    </div>
  );
}
