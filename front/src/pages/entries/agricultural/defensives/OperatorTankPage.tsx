import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Eye, Loader2, Printer } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { agriculturalServicesDefensiveService } from '@/lib/api-services/agricultural-services-defensive';
import { buildWithdrawalPayload, formatQuantity } from '@/lib/tank-withdrawal-rules';
import type { OperatorTankWithdrawal } from '@/types/agricultural-services';

function apiMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response;
  const firstFieldError = response?.data?.errors
    ? Object.values(response.data.errors)[0]?.[0]
    : undefined;
  return firstFieldError || response?.data?.message || fallback;
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return formatDate(value);
  return parsed.toLocaleString('pt-BR');
}

export default function OperatorTankPage() {
  const queryClient = useQueryClient();
  const [cropId, setCropId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [date, setDate] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [observation, setObservation] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: crops = [], isLoading: loadingCrops } = useQuery({
    queryKey: ['defensive-active-crops'],
    queryFn: agriculturalServicesDefensiveService.getActiveCrops,
  });

  const { data: operators = [], isFetching: loadingOperators } = useQuery({
    queryKey: ['defensive-tank-operators', cropId],
    queryFn: () => agriculturalServicesDefensiveService.getTankOperators(cropId),
    enabled: !!cropId,
  });

  // As datas abertas só são carregadas depois de escolher safra e tanqueiro.
  const { data: openDates = [], isFetching: loadingDates } = useQuery({
    queryKey: ['defensive-tank-open-dates', cropId, operatorId],
    queryFn: ({ signal }) =>
      agriculturalServicesDefensiveService.getOpenTankDates(cropId, operatorId, signal),
    enabled: !!cropId && !!operatorId,
  });

  const { data: planning, isFetching: loadingPlanning } = useQuery({
    queryKey: ['tank-planning', cropId, operatorId, date],
    queryFn: () => agriculturalServicesDefensiveService.getTankPlanning(cropId, operatorId, date),
    enabled: !!cropId && !!operatorId && !!date,
  });

  const { data: withdrawals = [], isFetching: loadingWithdrawals } = useQuery({
    queryKey: ['tank-withdrawals', cropId, operatorId],
    queryFn: () =>
      agriculturalServicesDefensiveService.getTankWithdrawals({
        ...(cropId ? { crop_id: cropId } : {}),
        ...(operatorId ? { operator_id: operatorId } : {}),
      }),
  });

  const { data: detail, isFetching: loadingDetail } = useQuery({
    queryKey: ['tank-withdrawal', detailId],
    queryFn: () => agriculturalServicesDefensiveService.getTankWithdrawal(detailId!),
    enabled: !!detailId,
  });

  const planningProducts = useMemo(() => planning?.products ?? [], [planning]);
  const summary = planning?.summary;

  // A sugestão do backend preenche inicialmente o campo Retirar, que continua editável.
  useEffect(() => {
    if (!planningProducts.length) return;
    setQuantities(
      Object.fromEntries(
        planningProducts.map((product) => [
          String(product.product_id),
          product.suggested_withdrawal ? String(product.suggested_withdrawal) : '',
        ]),
      ),
    );
  }, [planningProducts]);

  const cropOptions = useMemo(() => crops.map((c) => ({ value: String(c.id), label: c.name })), [crops]);
  const operatorOptions = useMemo(
    () => operators.map((o) => ({ value: String(o.id), label: o.name })),
    [operators],
  );

  const withdrawalMutation = useMutation({
    mutationFn: agriculturalServicesDefensiveService.createTankWithdrawal,
    onSuccess: (result) => {
      toast.success(`Retirada ${result.withdrawal_number} registrada com sucesso.`);
      setQuantities({});
      setObservation('');
      queryClient.invalidateQueries({ queryKey: ['tank-planning'] });
      queryClient.invalidateQueries({ queryKey: ['operator-tank'] });
      queryClient.invalidateQueries({ queryKey: ['tank-withdrawals'] });
    },
    onError: (error) => {
      toast.error(apiMessage(error, 'Não foi possível registrar a retirada.'));
    },
  });

  const handleWithdrawal = () => {
    const { payload, error } = buildWithdrawalPayload({
      crop_id: cropId,
      operator_id: operatorId,
      date,
      quantities,
      observation,
    });
    if (error || !payload) {
      toast.error(error ?? 'Verifique os dados informados.');
      return;
    }
    withdrawalMutation.mutate(payload);
  };

  const summaryCards: Array<{ label: string; value: string }> = summary
    ? [
        { label: 'O.S. abertas', value: String(summary.open_orders ?? 0) },
        { label: 'Área total em aberto', value: formatQuantity(summary.total_open_area) },
        { label: 'Área parcialmente realizada', value: formatQuantity(summary.partially_completed_area) },
        { label: 'Área restante', value: formatQuantity(summary.remaining_area) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tanque do Operador</h1>
        <p className="text-muted-foreground mt-1">
          Selecione a safra, o tanqueiro e a data de corte para consolidar os produtos e registrar a retirada
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Seleção</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Safra</Label>
              {loadingCrops ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                </div>
              ) : (
                <Combobox
                  options={cropOptions}
                  value={cropId}
                  onValueChange={(v) => { setCropId(v); setOperatorId(''); setDate(''); setQuantities({}); }}
                  placeholder="Selecione a safra"
                  searchPlaceholder="Buscar safra..."
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Tanqueiro</Label>
              <Combobox
                options={operatorOptions}
                value={operatorId}
                onValueChange={(v) => { setOperatorId(v); setDate(''); setQuantities({}); }}
                placeholder={cropId ? 'Selecione o tanqueiro' : 'Selecione a safra primeiro'}
                searchPlaceholder="Buscar tanqueiro..."
              />
              {loadingOperators && <p className="text-xs text-muted-foreground">Carregando tanqueiros...</p>}
            </div>
            <div className="space-y-2">
              <Label>Data de corte</Label>
              <Select
                value={date}
                onValueChange={(v) => { setDate(v); setQuantities({}); }}
                disabled={!cropId || !operatorId || loadingDates}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !cropId || !operatorId
                        ? 'Selecione safra e tanqueiro'
                        : loadingDates
                          ? 'Carregando datas...'
                          : 'Selecione a data'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {openDates.map((d) => (
                    <SelectItem key={d.date} value={d.date}>
                      {formatDate(d.date)} — {d.open_orders} O.S. aberta(s)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!!cropId && !!operatorId && !loadingDates && openDates.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhuma data com O.S. aberta para este tanqueiro.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {summaryCards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-semibold">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Planejamento e retirada</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!cropId || !operatorId || !date ? (
            <p className="text-sm text-muted-foreground">Selecione safra, tanqueiro e data para ver o planejamento.</p>
          ) : loadingPlanning ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : planningProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum produto planejado para esta seleção.</p>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Bomba</TableHead>
                      <TableHead className="text-right">Planejado</TableHead>
                      <TableHead className="text-right">Utilizado</TableHead>
                      <TableHead className="text-right">Em aberto</TableHead>
                      <TableHead className="text-right">Saldo no tanque</TableHead>
                      <TableHead className="text-right">Necessidade adicional</TableHead>
                      <TableHead className="text-right w-40">Retirar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {planningProducts.map((p) => (
                      <TableRow key={String(p.product_id)}>
                        <TableCell>{p.product_name}</TableCell>
                        <TableCell className="text-right">{formatQuantity(p.pump)}</TableCell>
                        <TableCell className="text-right">{formatQuantity(p.planned_quantity)}</TableCell>
                        <TableCell className="text-right">{formatQuantity(p.used_quantity)}</TableCell>
                        <TableCell className="text-right">{formatQuantity(p.open_quantity)}</TableCell>
                        <TableCell className="text-right">{formatQuantity(p.tank_balance)}</TableCell>
                        <TableCell className="text-right">{formatQuantity(p.additional_need)}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            aria-label={`Retirar ${p.product_name}`}
                            className="text-right"
                            value={quantities[String(p.product_id)] ?? ''}
                            placeholder={String(p.suggested_withdrawal ?? 0)}
                            onChange={(e) =>
                              setQuantities((prev) => ({ ...prev, [String(p.product_id)]: e.target.value }))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tank-observation">Observação</Label>
                <Textarea
                  id="tank-observation"
                  value={observation}
                  maxLength={500}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Observação da retirada..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end">
                <Button type="button" disabled={withdrawalMutation.isPending} onClick={handleWithdrawal}>
                  {withdrawalMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Registrando...</>
                  ) : (
                    'Registrar retirada'
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Retiradas efetuadas</CardTitle></CardHeader>
        <CardContent>
          {loadingWithdrawals ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : withdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma retirada registrada para esta seleção.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Safra</TableHead>
                    <TableHead>Tanqueiro</TableHead>
                    <TableHead>Data de corte</TableHead>
                    <TableHead>Data/hora da retirada</TableHead>
                    <TableHead className="text-right">Itens</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((w) => (
                    <TableRow key={String(w.id)}>
                      <TableCell className="font-medium">{w.withdrawal_number}</TableCell>
                      <TableCell>{w.crop_name ?? '-'}</TableCell>
                      <TableCell>{w.operator_name ?? '-'}</TableCell>
                      <TableCell>{w.cutoff_date ? formatDate(w.cutoff_date) : '-'}</TableCell>
                      <TableCell>{formatDateTime(w.occurred_at)}</TableCell>
                      <TableCell className="text-right">{w.items_count}</TableCell>
                      <TableCell>{w.created_by_name ?? '-'}</TableCell>
                      <TableCell><Badge variant="secondary">{w.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Visualizar retirada ${w.withdrawal_number}`}
                            onClick={() => setDetailId(String(w.id))}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled
                            aria-label="Impressão indisponível"
                            title="Modelo de impressão será definido posteriormente"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Retirada {detail?.withdrawal_number ?? ''}
            </DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : !detail ? (
            <p className="text-sm text-muted-foreground">Retirada não encontrada.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p><span className="text-muted-foreground">Safra:</span> {detail.crop_name ?? '-'}</p>
                <p><span className="text-muted-foreground">Tanqueiro:</span> {detail.operator_name ?? '-'}</p>
                <p><span className="text-muted-foreground">Data de corte:</span> {detail.cutoff_date ? formatDate(detail.cutoff_date) : '-'}</p>
                <p><span className="text-muted-foreground">Retirada em:</span> {formatDateTime(detail.occurred_at)}</p>
                <p><span className="text-muted-foreground">Responsável:</span> {detail.created_by_name ?? '-'}</p>
                <p><span className="text-muted-foreground">Observação:</span> {detail.observation ?? '-'}</p>
              </div>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Estoque antes</TableHead>
                      <TableHead className="text-right">Estoque depois</TableHead>
                      <TableHead className="text-right">Tanque antes</TableHead>
                      <TableHead className="text-right">Tanque depois</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(detail.items ?? []).map((item) => (
                      <TableRow key={String(item.id)}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.unit ?? '-'}</TableCell>
                        <TableCell className="text-right">{formatQuantity(item.quantity)}</TableCell>
                        <TableCell className="text-right">{formatQuantity(item.stock_before)}</TableCell>
                        <TableCell className="text-right">{formatQuantity(item.stock_after)}</TableCell>
                        <TableCell className="text-right">{formatQuantity(item.tank_balance_before)}</TableCell>
                        <TableCell className="text-right">{formatQuantity(item.tank_balance_after)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export type { OperatorTankWithdrawal };
