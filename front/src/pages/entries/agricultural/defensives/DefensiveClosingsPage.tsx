import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckSquare } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { defensiveOrdersService, AgriculturalDefensiveOrder } from '@/lib/api-services-entries';
import { DefensiveOrderClosingDialog } from './DefensiveOrderClosingDialog';

const STATUS_LABELS: Record<string, string> = { A: 'Ativo', I: 'Inativo', F: 'Finalizada' };

export default function DefensiveClosingsPage() {
  const [closingOrderId, setClosingOrderId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery<AgriculturalDefensiveOrder[]>({
    queryKey: ['defensive-orders'],
    queryFn: defensiveOrdersService.getAll,
  });

  const rows = useMemo(
    () =>
      orders.map((o) => {
        const closings = o.closings ?? [];
        const usedBomb = Number(o.used_bomb ?? closings.reduce((s, c) => s + Number(c.closing_bomb || 0), 0));
        return { order: o, closings, usedBomb };
      }),
    [orders],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fechamentos</h1>
        <p className="text-muted-foreground mt-1">Acompanhe e registre os fechamentos das ordens de serviço</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Ordens de serviço</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>O.S.</TableHead>
                  <TableHead>Safra</TableHead>
                  <TableHead>Talhão</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Bombas recomendadas</TableHead>
                  <TableHead className="text-right">Bombas utilizadas</TableHead>
                  <TableHead className="text-right">Fechamentos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-6">
                      Nenhuma ordem de serviço encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map(({ order, closings, usedBomb }) => (
                    <TableRow key={String(order.id)}>
                      <TableCell>{order.os_number || order.id}</TableCell>
                      <TableCell>{order.crop_name || '-'}</TableCell>
                      <TableCell>{order.field_name || '-'}</TableCell>
                      <TableCell>{order.application_date ? formatDate(order.application_date) : '-'}</TableCell>
                      <TableCell className="text-right">{order.recommended_pump ?? 0}</TableCell>
                      <TableCell className="text-right">{usedBomb}</TableCell>
                      <TableCell className="text-right">{closings.length}</TableCell>
                      <TableCell>
                        <Badge
                          variant={order.status === 'A' ? 'default' : 'secondary'}
                          className={order.status === 'A' ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15' : ''}
                        >
                          {STATUS_LABELS[order.status] ?? order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Fechar O.S."
                          onClick={() => setClosingOrderId(String(order.id))}
                        >
                          <CheckSquare className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DefensiveOrderClosingDialog
        orderId={closingOrderId}
        open={!!closingOrderId}
        onOpenChange={(open) => { if (!open) setClosingOrderId(null); }}
      />
    </div>
  );
}
