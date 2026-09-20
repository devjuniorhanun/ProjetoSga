import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import {
  AgriculturalDefensiveOrder,
  defensiveOrdersService,
} from '@/lib/api-services-entries';

interface Props {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function apiMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response;
  const firstFieldError = response?.data?.errors
    ? Object.values(response.data.errors)[0]?.[0]
    : undefined;
  return firstFieldError || response?.data?.message || fallback;
}

export function DefensiveOrderClosingDialog({ orderId, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [operatorTankId, setOperatorTankId] = useState('');
  const [closingBomb, setClosingBomb] = useState<string>('');
  const [closingType, setClosingType] = useState<'PARTIAL' | 'FINAL'>('PARTIAL');
  const [saving, setSaving] = useState(false);

  const { data: order, isLoading } = useQuery<AgriculturalDefensiveOrder>({
    queryKey: ['defensive-orders', orderId],
    queryFn: () => defensiveOrdersService.getById(String(orderId)),
    enabled: open && !!orderId,
  });

  useEffect(() => {
    if (!open) {
      setOperatorTankId('');
      setClosingBomb('');
      setClosingType('PARTIAL');
    }
  }, [open]);

  const recommended = Number(order?.recommended_pump ?? 0);
  const used = Number(order?.used_bomb ?? 0);
  const remaining = Math.max(recommended - used, 0);
  const percent = recommended > 0 ? Math.min((used / recommended) * 100, 100) : 0;

  const tanqueiros = (order?.operators ?? []).filter((op) => op.function === 'T');
  const closings = order?.closings ?? [];
  const orderProducts = order?.products ?? [];
  const closingBombValue = Number(String(closingBomb).replace(',', '.')) || 0;

  const handleClose = async () => {
    if (!operatorTankId) {
      toast.error('Selecione o tanque do operador (tanqueiro).');
      return;
    }
    if (closingBombValue <= 0 || !closingBomb) {
      toast.error('A quantidade de bombas deve ser maior que zero.');
      return;
    }
    setSaving(true);
    try {
      await defensiveOrdersService.close({
        order_id: String(orderId),
        operator_tank_id: operatorTankId,
        closing_bomb: closingBombValue,
        closing_type: closingType,
      });
      toast.success(closingType === 'FINAL' ? 'Fechamento final registrado!' : 'Fechamento parcial registrado!');
      queryClient.invalidateQueries({ queryKey: ['defensive-orders'] });
      queryClient.invalidateQueries({ queryKey: ['operator-tank'] });
      queryClient.invalidateQueries({ queryKey: ['tank-planning'] });
      onOpenChange(false);
    } catch (error) {
      toast.error(apiMessage(error, 'Erro ao registrar o fechamento.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Fechamento da O.S.</DialogTitle></DialogHeader>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Bombas recomendadas</p>
                <p className="text-lg font-semibold">{recommended}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Bombas utilizadas</p>
                <p className="text-lg font-semibold">{used}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Bombas restantes</p>
                <p className="text-lg font-semibold">{Number(remaining.toFixed(3))}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Executado</p>
                <p className="text-lg font-semibold">{percent.toFixed(1)}%</p>
              </div>
            </div>
            <Progress value={percent} />

            {closings.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Bombas</TableHead>
                      <TableHead className="text-right">Acumulado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {closings.map((c, idx) => {
                      const accumulated = c.accumulated_bomb ?? closings
                        .slice(0, idx + 1)
                        .reduce((sum, i) => sum + Number(i.closing_bomb || 0), 0);
                      const when = c.closed_at ?? c.closing_date;
                      return (
                        <TableRow key={String(c.id ?? idx)}>
                          <TableCell>{when ? formatDate(when) : '-'}</TableCell>
                          <TableCell>{c.closing_type ?? '-'}</TableCell>
                          <TableCell className="text-right">{c.closing_bomb}</TableCell>
                        <TableCell className="text-right">{Number(Number(accumulated).toFixed(3))}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tanqueiro</Label>
                <Select value={operatorTankId} onValueChange={setOperatorTankId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {tanqueiros.map((op) => (
                      <SelectItem
                        key={String(op.operator_tank_id ?? op.operator_id)}
                        value={String(op.operator_tank_id ?? op.operator_id)}
                      >
                        {op.operator_name || String(op.operator_id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bombas do fechamento</Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={closingBomb}
                  onChange={(e) => setClosingBomb(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de fechamento</Label>
                <Select value={closingType} onValueChange={(v) => setClosingType(v as 'PARTIAL' | 'FINAL')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PARTIAL">Parcial</SelectItem>
                    <SelectItem value="FINAL">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {orderProducts.length > 0 && closingBombValue > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Bomba (por bomba)</TableHead>
                      <TableHead className="text-right">Quantidade do fechamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderProducts.map((p, idx) => (
                      <TableRow key={String(p.product_id ?? idx)}>
                        <TableCell>{p.product_name || String(p.product_id)}</TableCell>
                        <TableCell className="text-right">{p.pump}</TableCell>
                        <TableCell className="text-right">
                          {Number((closingBombValue * Number(p.pump || 0)).toFixed(3))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              São permitidos vários fechamentos parciais. No fechamento final a O.S. passa para o status informado pelo servidor.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="button" disabled={saving} onClick={handleClose}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar fechamento'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
