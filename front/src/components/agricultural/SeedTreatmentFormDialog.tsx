import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { seedTreatmentsService } from '@/lib/api-services-agricultural-services';
import { inventoryBalancesService } from '@/lib/api-services-inventory-releases';
import { useAgriculturalOptions } from '@/hooks/use-agricultural-options';
import { chemicalQuantityFromDose, seedTreatmentIsValid } from '@/lib/agricultural-rules';
import type { SeedTreatmentChemical, SeedTreatmentPayload, SeedTreatmentSeed } from '@/types/agricultural';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const num = (value: string) => Number(String(value).replace(',', '.')) || 0;

export function SeedTreatmentFormDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const options = useAgriculturalOptions();
  const balances = useQuery({
    queryKey: ['inventory-balances', 'seed-treatment-options'],
    queryFn: () => inventoryBalancesService.list({ per_page: 100 }),
    enabled: open,
  });

  const [cropId, setCropId] = useState('');
  const [cultureId, setCultureId] = useState('');
  const [treatmentDate, setTreatmentDate] = useState('');
  const [batchCount, setBatchCount] = useState('');
  const [observation, setObservation] = useState('');
  const [seeds, setSeeds] = useState<SeedTreatmentSeed[]>([]);
  const [chemicals, setChemicals] = useState<SeedTreatmentChemical[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setCropId('');
    setCultureId('');
    setTreatmentDate('');
    setBatchCount('');
    setObservation('');
    setSeeds([]);
    setChemicals([]);
    setFieldErrors({});
  }, [open]);

  const addSeed = () =>
    setSeeds((prev) => [
      ...prev,
      {
        product_id: '',
        culture_id: cultureId,
        variety_id: '',
        product_stock_id: '',
        treated_quantity: 0,
        unit: '',
        quantity_per_batch: null,
      },
    ]);

  const addChemical = () =>
    setChemicals((prev) => [
      ...prev,
      { product_id: '', product_stock_id: '', dose_per_batch: null, actual_quantity: 0, unit: '' },
    ]);

  const stockOptions = (productId: string, treatmentStatus?: string) =>
    (balances.data?.items ?? [])
      .filter((stock) =>
        String(stock.product_id) === String(productId)
        && (!treatmentStatus || stock.treatment_status === treatmentStatus)
        && Number(stock.quantity) - Number(stock.reserved_quantity ?? 0) > 0,
      )
      .map((stock) => ({
        value: String(stock.id),
        label: [stock.stock_location_name ?? stock.location_name, stock.batch && `Lote ${stock.batch}`, stock.variety_name, stock.sieve && `Peneira ${stock.sieve}`]
          .filter(Boolean).join(' — '),
      }));

  const mutation = useMutation({
    mutationFn: (payload: SeedTreatmentPayload) => seedTreatmentsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seed-treatments'] });
      toast.success('Tratamento criado como rascunho.');
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const response = (error as { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } } }).response;
      if (response?.status === 422 && response.data?.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(response.data.errors).forEach(([key, messages]) => {
          mapped[key] = messages?.[0] ?? 'Campo inválido.';
        });
        setFieldErrors(mapped);
        toast.error('Verifique os campos destacados.');
        return;
      }
      toast.error(response?.data?.message ?? 'Não foi possível salvar o tratamento.');
    },
  });

  const handleSubmit = () => {
    const payload: SeedTreatmentPayload = {
      crop_id: cropId,
      culture_id: cultureId,
      treatment_date: treatmentDate,
      batch_count: num(batchCount),
      observation: observation || null,
      seeds,
      chemicals,
    };
    if (!seedTreatmentIsValid(payload)) {
      setFieldErrors({
        form: 'Informe safra, cultura, data, número de batidas, ao menos uma semente e um produto químico.',
      });
      return;
    }
    setFieldErrors({});
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo tratamento de sementes</DialogTitle>
          <DialogDescription>
            O rascunho não antecipa estoque. A finalização converte a semente e baixa os químicos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <Label>Safra</Label>
            <Combobox options={options.cropOptions} value={cropId} onValueChange={setCropId} placeholder="Selecione" />
          </div>
          <div>
            <Label>Cultura</Label>
            <Combobox
              options={options.cultureOptions}
              value={cultureId}
              onValueChange={(value) => {
                setCultureId(value);
                setSeeds((prev) => prev.map((s) => ({ ...s, culture_id: value, variety_id: '' })));
              }}
              placeholder="Selecione"
            />
          </div>
          <div>
            <Label htmlFor="treatment_date">Data</Label>
            <Input id="treatment_date" type="date" value={treatmentDate} onChange={(e) => setTreatmentDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="batch_count">Número de batidas</Label>
            <Input
              id="batch_count"
              value={batchCount}
              onChange={(e) => {
                setBatchCount(e.target.value);
                setChemicals((prev) =>
                  prev.map((c) => ({
                    ...c,
                    actual_quantity: c.dose_per_batch
                      ? chemicalQuantityFromDose(c.dose_per_batch, num(e.target.value))
                      : c.actual_quantity,
                  })),
                );
              }}
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Sementes</h3>
            <Button type="button" variant="outline" size="sm" onClick={addSeed}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar semente
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Variedade</TableHead>
                <TableHead>Posição/lote não tratado</TableHead>
                <TableHead>Qtd. tratada</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Qtd. por batida</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {seeds.map((seed, index) => (
                <TableRow key={index}>
                  <TableCell className="min-w-44">
                    <Combobox
                      options={options.productOptions}
                      value={seed.product_id}
                      onValueChange={(value) => setSeeds((prev) => prev.map((s, i) => (i === index ? { ...s, product_id: value, product_stock_id: '', batch: '', unit: '' } : s)))}
                      placeholder="Selecione"
                    />
                  </TableCell>
                  <TableCell className="min-w-44">
                    <Combobox
                      options={options.varietiesByCulture(seed.culture_id || cultureId)}
                      value={seed.variety_id}
                      onValueChange={(value) => setSeeds((prev) => prev.map((s, i) => (i === index ? { ...s, variety_id: value } : s)))}
                      placeholder="Selecione"
                    />
                  </TableCell>
                  <TableCell>
                    <Combobox
                      options={stockOptions(seed.product_id, 'UNTREATED')}
                      value={seed.product_stock_id}
                      onValueChange={(value) => {
                        const stock = balances.data?.items.find((item) => String(item.id) === value);
                        setSeeds((prev) => prev.map((s, i) => i === index ? {
                          ...s,
                          product_stock_id: value,
                          culture_id: String(stock?.culture_id ?? cultureId),
                          variety_id: String(stock?.variety_culture_id ?? s.variety_id),
                          batch: stock?.batch ?? '',
                          unit: stock?.unit ?? s.unit,
                        } : s));
                      }}
                      placeholder="Selecione o lote"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={seed.treated_quantity}
                      onChange={(e) => setSeeds((prev) => prev.map((s, i) => (i === index ? { ...s, treated_quantity: num(e.target.value) } : s)))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={seed.unit}
                      onChange={(e) => setSeeds((prev) => prev.map((s, i) => (i === index ? { ...s, unit: e.target.value } : s)))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={seed.quantity_per_batch ?? ''}
                      onChange={(e) => setSeeds((prev) => prev.map((s, i) => (i === index ? { ...s, quantity_per_batch: num(e.target.value) } : s)))}
                    />
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setSeeds((prev) => prev.filter((_, i) => i !== index))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Produtos químicos</h3>
            <Button type="button" variant="outline" size="sm" onClick={addChemical}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar produto
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Posição de estoque</TableHead>
                <TableHead>Dose por batida</TableHead>
                <TableHead>Quantidade real</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {chemicals.map((chemical, index) => (
                <TableRow key={index}>
                  <TableCell className="min-w-44">
                    <Combobox
                      options={options.productOptions}
                      value={chemical.product_id}
                      onValueChange={(value) => setChemicals((prev) => prev.map((c, i) => (i === index ? { ...c, product_id: value, product_stock_id: '', unit: '' } : c)))}
                      placeholder="Selecione"
                    />
                  </TableCell>
                  <TableCell>
                    <Combobox
                      options={stockOptions(chemical.product_id)}
                      value={chemical.product_stock_id}
                      onValueChange={(value) => {
                        const stock = balances.data?.items.find((item) => String(item.id) === value);
                        setChemicals((prev) => prev.map((c, i) => i === index ? {
                          ...c,
                          product_stock_id: value,
                          unit: stock?.unit ?? c.unit,
                        } : c));
                      }}
                      placeholder="Selecione a posição"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={chemical.dose_per_batch ?? ''}
                      onChange={(e) =>
                        setChemicals((prev) =>
                          prev.map((c, i) =>
                            i === index
                              ? {
                                  ...c,
                                  dose_per_batch: num(e.target.value),
                                  actual_quantity: chemicalQuantityFromDose(num(e.target.value), num(batchCount)),
                                }
                              : c,
                          ),
                        )
                      }
                      placeholder="Opcional"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={chemical.actual_quantity}
                      onChange={(e) => setChemicals((prev) => prev.map((c, i) => (i === index ? { ...c, actual_quantity: num(e.target.value) } : c)))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={chemical.unit}
                      onChange={(e) => setChemicals((prev) => prev.map((c, i) => (i === index ? { ...c, unit: e.target.value } : c)))}
                    />
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setChemicals((prev) => prev.filter((_, i) => i !== index))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {fieldErrors.form && <p className="text-sm text-destructive">{fieldErrors.form}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            Salvar rascunho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SeedTreatmentFormDialog;
