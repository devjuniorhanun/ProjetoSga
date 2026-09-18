import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Plus, Trash2, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { applyApiErrors } from '@/lib/form-errors';
import { FuelTankGaugeTable, fuelGaugeTablesService } from '@/lib/api-services-fuel-phase6';
import { useFuelOptions } from '../useFuelOptions';

interface DraftRow { centimeters: string; liters: string }

export default function FuelGaugeTablePage() {
  const queryClient = useQueryClient();
  const { stationOptions, tanksByStation } = useFuelOptions();
  const [stationId, setStationId] = useState('');
  const [tankId, setTankId] = useState('');
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['fuel-gauge-tables'],
    queryFn: fuelGaugeTablesService.getAll,
  });

  const tankRows = useMemo(
    () => rows
      .filter((r) => String(r.tank_id) === String(tankId))
      .sort((a, b) => Number(a.centimeters) - Number(b.centimeters)),
    [rows, tankId],
  );

  const addDraft = () => setDrafts((d) => [...d, { centimeters: '', liters: '' }]);
  const setDraft = (i: number, key: keyof DraftRow, value: string) =>
    setDrafts((d) => d.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  const removeDraft = (i: number) => setDrafts((d) => d.filter((_, idx) => idx !== i));

  const saveDrafts = async () => {
    if (!tankId) return toast.error('Selecione o tanque.');
    if (drafts.length === 0) return toast.error('Adicione pelo menos uma linha.');
    const invalid = drafts.some((d) => Number(d.centimeters) <= 0 || Number(d.liters) < 0 || d.centimeters === '' || d.liters === '');
    if (invalid) return toast.error('Informe centímetros maiores que zero e litros válidos.');

    setSaving(true);
    try {
      await Promise.all(drafts.map((d) => fuelGaugeTablesService.create({
        tank_id: tankId,
        centimeters: Number(d.centimeters),
        liters: Number(String(d.liters).replace(',', '.')),
      } as Omit<FuelTankGaugeTable, 'id'>)));
      toast.success('Régua atualizada!');
      setDrafts([]);
      queryClient.invalidateQueries({ queryKey: ['fuel-gauge-tables'] });
    } catch (error) {
      applyApiErrors(error, undefined, { fallbackMessage: 'Erro ao salvar as linhas da régua.' });
    } finally {
      setSaving(false);
    }
  };

  const updateRow = async (row: FuelTankGaugeTable, liters: string) => {
    try {
      await fuelGaugeTablesService.update(row.id, { liters: Number(String(liters).replace(',', '.')) });
      queryClient.invalidateQueries({ queryKey: ['fuel-gauge-tables'] });
      toast.success('Linha atualizada!');
    } catch (error) {
      applyApiErrors(error, undefined, { fallbackMessage: 'Erro ao atualizar a linha.' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fuelGaugeTablesService.delete(deleteId);
      queryClient.invalidateQueries({ queryKey: ['fuel-gauge-tables'] });
      toast.success('Linha excluída!');
    } catch (error) {
      applyApiErrors(error, undefined, { fallbackMessage: 'Erro ao excluir a linha.' });
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Régua dos Tanques</h1>
        <p className="text-muted-foreground mt-1">Tabela de conversão de centímetros para litros de cada tanque</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Tanque</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Posto</Label>
            <Combobox options={stationOptions} value={stationId} onValueChange={(v) => { setStationId(v); setTankId(''); }} placeholder="Selecione o posto" />
          </div>
          <div className="space-y-2">
            <Label>Tanque</Label>
            <Combobox options={tanksByStation(stationId)} value={tankId} onValueChange={setTankId} placeholder="Selecione o tanque" />
          </div>
        </CardContent>
      </Card>

      {!tankId ? (
        <p className="text-sm text-muted-foreground">Selecione um posto e um tanque para configurar a régua.</p>
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Novas linhas</CardTitle>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={addDraft}><Plus className="mr-2 h-4 w-4" /> Adicionar linha</Button>
                <Button type="button" onClick={saveDrafts} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Salvar linhas</>}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {drafts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma linha pendente. Clique em "Adicionar linha".</p>
              ) : (
                <div className="space-y-2">
                  {drafts.map((d, i) => (
                    <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <Input type="number" step="0.01" placeholder="Centímetros" value={d.centimeters} onChange={(e) => setDraft(i, 'centimeters', e.target.value)} />
                      <Input type="number" step="0.01" placeholder="Litros" value={d.liters} onChange={(e) => setDraft(i, 'liters', e.target.value)} />
                      <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeDraft(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Tabela cadastrada ({tankRows.length} linhas)</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              {tankRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma linha cadastrada para este tanque.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Centímetros</TableHead>
                      <TableHead>Litros</TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tankRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.centimeters}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            defaultValue={row.liters}
                            className="max-w-[160px]"
                            onBlur={(e) => {
                              if (Number(e.target.value) !== Number(row.liters)) updateRow(row, e.target.value);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(row.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
