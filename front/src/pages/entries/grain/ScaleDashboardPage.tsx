import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { grainReadingsService, grainScaleChannelsService, grainScalesService, grainTicketsService } from '@/lib/api-services-grain';
import { WeightDisplay } from '@/components/grain/WeightDisplay';
import { GrainStatusBadge } from '@/components/grain/GrainStatusBadge';
import { formatWeightKg } from '@/lib/grain-format';
import { OPERATION_TYPE_LABELS, labelOr } from '@/lib/grain-labels';

export default function ScaleDashboardPage() {
  const [scaleId, setScaleId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const { data: scales = [] } = useQuery({
    queryKey: ['grain-scales', 'active'],
    queryFn: () => grainScalesService.getAll({ status: 'A', per_page: 100 }),
  });
  const { data: channels = [] } = useQuery({
    queryKey: ['grain-scale-channels', scaleId],
    queryFn: () => grainScaleChannelsService.getAll({ grain_scale_id: scaleId, status: 'A', per_page: 100 }),
    enabled: !!scaleId,
  });
  const { data: reading = null } = useQuery({
    queryKey: ['grain-latest-reading', channelId],
    queryFn: () => grainReadingsService.latest(channelId),
    enabled: !!channelId,
    refetchInterval: 1000,
    retry: false,
  });
  const { data: tickets = [] } = useQuery({
    queryKey: ['grain-tickets', 'panel'],
    queryFn: () => grainTicketsService.getAll({ per_page: 15 }),
    refetchInterval: 15000,
  });

  useEffect(() => setChannelId(''), [scaleId]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const openTickets = tickets.filter((t) => t.status !== 'CLOSED' && t.status !== 'CANCELED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel da Balança</h1>
        <p className="mt-1 text-muted-foreground">Leitura ao vivo do canal selecionado e tickets em andamento</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Leitura ao vivo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Balança</Label>
              <Select value={scaleId} onValueChange={setScaleId}>
                <SelectTrigger><SelectValue placeholder="Selecione a balança" /></SelectTrigger>
                <SelectContent>
                  {scales.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={channelId} onValueChange={setChannelId} disabled={!scaleId}>
                <SelectTrigger><SelectValue placeholder="Selecione o canal" /></SelectTrigger>
                <SelectContent>
                  {channels.map((c) => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <WeightDisplay reading={reading} now={now} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tickets em andamento</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Operação</TableHead>
                <TableHead>Produtor</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Peso líquido</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum ticket em andamento.
                  </TableCell>
                </TableRow>
              ) : (
                openTickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.ticket_number ?? t.id}</TableCell>
                    <TableCell>{labelOr(OPERATION_TYPE_LABELS, t.operation_type)}</TableCell>
                    <TableCell>{t.producer_name ?? '-'}</TableCell>
                    <TableCell>{t.license_plate ?? '-'}</TableCell>
                    <TableCell>{formatWeightKg(t.net_weight ?? 0)}</TableCell>
                    <TableCell><GrainStatusBadge kind="ticket" status={t.status} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
