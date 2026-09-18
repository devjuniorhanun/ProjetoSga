import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { agriculturalServicesDefensiveService } from '@/lib/api-services/agricultural-services-defensive';

export default function DefensiveConsolidationPage() {
  const [cropId, setCropId] = useState('');
  const [operatorId, setOperatorId] = useState('');

  const { data: crops = [], isLoading: loadingCrops } = useQuery({
    queryKey: ['defensive-active-crops'],
    queryFn: agriculturalServicesDefensiveService.getActiveCrops,
  });

  const { data: operators = [] } = useQuery({
    queryKey: ['defensive-tank-operators', cropId],
    queryFn: () => agriculturalServicesDefensiveService.getTankOperators(cropId),
    enabled: !!cropId,
  });

  const { data: tank, isFetching } = useQuery({
    queryKey: ['operator-tank', operatorId],
    queryFn: () => agriculturalServicesDefensiveService.getOperatorTank(operatorId),
    enabled: !!operatorId,
  });

  const rows = useMemo(
    () =>
      (tank?.products ?? []).map((p) => {
        const expected = Number(p.used_quantity) + Number(p.current_quantity) + Number(p.returned_quantity);
        const difference = Number((Number(p.withdrawn_quantity) - expected).toFixed(4));
        return { ...p, expected, difference, divergence: difference !== 0 };
      }),
    [tank],
  );

  const hasDivergence = rows.some((r) => r.divergence);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Consolidação</h1>
        <p className="text-muted-foreground mt-1">
          Compara retirado com utilizado, saldo no tanque e devolvido
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Seleção</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Safra</Label>
              {loadingCrops ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                </div>
              ) : (
                <Combobox
                  options={crops.map((c) => ({ value: String(c.id), label: c.name }))}
                  value={cropId}
                  onValueChange={(v) => { setCropId(v); setOperatorId(''); }}
                  placeholder="Selecione a safra"
                  searchPlaceholder="Buscar safra..."
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Tanqueiro</Label>
              <Combobox
                options={operators.map((o) => ({ value: String(o.id), label: o.name }))}
                value={operatorId}
                onValueChange={setOperatorId}
                placeholder={cropId ? 'Selecione o tanqueiro' : 'Selecione a safra primeiro'}
                searchPlaceholder="Buscar tanqueiro..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Consolidação por produto</CardTitle>
          {rows.length > 0 && (
            <Badge variant={hasDivergence ? 'destructive' : 'secondary'}>
              {hasDivergence ? 'Divergência encontrada' : 'Sem divergências'}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {!operatorId ? (
            <p className="text-sm text-muted-foreground">Selecione um tanqueiro para consolidar.</p>
          ) : isFetching ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum produto no tanque deste operador.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Retirado</TableHead>
                    <TableHead className="text-right">Utilizado</TableHead>
                    <TableHead className="text-right">Saldo no tanque</TableHead>
                    <TableHead className="text-right">Devolvido</TableHead>
                    <TableHead className="text-right">Esperado</TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={String(r.product_id)}>
                      <TableCell>{r.product_name}</TableCell>
                      <TableCell className="text-right">{r.withdrawn_quantity}</TableCell>
                      <TableCell className="text-right">{r.used_quantity}</TableCell>
                      <TableCell className="text-right">{r.current_quantity}</TableCell>
                      <TableCell className="text-right">{r.returned_quantity}</TableCell>
                      <TableCell className="text-right">{r.expected}</TableCell>
                      <TableCell className={`text-right ${r.divergence ? 'text-destructive font-medium' : ''}`}>
                        {r.difference}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
