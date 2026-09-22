import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import { useFiscalOptions } from '@/hooks/use-fiscal-options';
import { destinationsMatchQuantity, itemTotal, sumDestinations, validateInvoiceItem } from '@/lib/fiscal-rules';
import type { EntryInvoiceItem, FiscalEntryType, InvoiceItemDestination } from '@/types/fiscal';

interface Props {
  entryType: FiscalEntryType;
  items: EntryInvoiceItem[];
  onChange: (items: EntryInvoiceItem[]) => void;
  disabled?: boolean;
}

const emptyItem = (): EntryInvoiceItem => ({
  product_id: '',
  description: '',
  ncm: '',
  cfop: '',
  unit: '',
  quantity: 0,
  unit_value: 0,
  discount_value: 0,
  addition_value: 0,
  destinations: [],
});

const emptyDestination = (): InvoiceItemDestination => ({ quantity: 0 });

export function InvoiceItemsEditor({ entryType, items, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<EntryInvoiceItem>(emptyItem());
  const [errors, setErrors] = useState<string[]>([]);
  const options = useFiscalOptions();
  const isSeed = entryType === 'SEED';
  const isDefensive = entryType === 'DEFENSIVE';
  const isFuelOrLubricant = entryType === 'FUEL' || entryType === 'LUBRICANT';

  const locationOptions = useMemo(
    () =>
      options.stockLocations
        .filter(
          (location) =>
            !isFuelOrLubricant ||
            (location.location_type === 'FUEL_STATION' && location.fuel_station_type === 'F'),
        )
        .map((location) => ({ value: String(location.id), label: location.name })),
    [isFuelOrLubricant, options.stockLocations],
  );

  const setDestination = (index: number, patch: Partial<InvoiceItemDestination>) => {
    setDraft((prev) => ({
      ...prev,
      destinations: prev.destinations.map((destination, current) =>
        current === index ? { ...destination, ...patch } : destination,
      ),
    }));
  };

  const selectLocation = (index: number, stockLocationId: string) => {
    const location = options.stockLocations.find((item) => String(item.id) === stockLocationId);
    setDestination(index, {
      stock_location_id: stockLocationId,
      fuel_station_id: location?.fuel_station_id ? String(location.fuel_station_id) : null,
    });
  };

  const selectVariety = (index: number, varietyId: string) => {
    const variety = options.varieties.find((item) => String(item.id) === varietyId);
    setDestination(index, {
      variety_culture_id: varietyId,
      culture_id: variety?.culture_id ? String(variety.culture_id) : null,
    });
  };

  const submitDraft = () => {
    const result = validateInvoiceItem(entryType, draft);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    const product = options.productOptions.find((item) => item.value === draft.product_id);
    onChange([...items, { ...draft, product_name: product?.label, total_value: itemTotal(draft) }]);
    setDraft(emptyItem());
    setErrors([]);
    setOpen(false);
  };

  const destinationSummary = (item: EntryInvoiceItem) => {
    if (isSeed || isDefensive) return `${item.destinations.length} lote(s)`;
    return `${sumDestinations(item.destinations)} de ${item.quantity}`;
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="text-right">Valor unit.</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>{isSeed || isDefensive ? 'Lotes' : 'Destinos'}</TableHead>
              {!disabled && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center text-muted-foreground">
                  Nenhum item adicionado
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.product_name ?? item.product_id}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrencyBRL(item.unit_value)}</TableCell>
                  <TableCell className="text-right">{formatCurrencyBRL(itemTotal(item))}</TableCell>
                  <TableCell className={destinationsMatchQuantity(item) ? '' : 'text-destructive'}>
                    {destinationSummary(item)}
                  </TableCell>
                  {!disabled && (
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => onChange(items.filter((_, current) => current !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!disabled && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setDraft(emptyItem());
            setErrors([]);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Adicionar item
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Adicionar item</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Produto</Label>
                <Combobox
                  options={options.productOptions}
                  value={draft.product_id}
                  onValueChange={(value) => {
                    const product = options.productOptions.find((item) => item.value === value);
                    setDraft((prev) => ({
                      ...prev,
                      product_id: value,
                      description: prev.description || product?.label || '',
                    }));
                  }}
                  placeholder="Selecione o produto"
                />
              </div>
              <div className="space-y-2">
                <Label>Código do fornecedor</Label>
                <Input
                  value={draft.supplier_product_code ?? ''}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, supplier_product_code: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={draft.description}
                onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>NCM</Label>
                <Input
                  value={draft.ncm ?? ''}
                  onChange={(event) => setDraft((prev) => ({ ...prev, ncm: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>CFOP</Label>
                <Input
                  value={draft.cfop ?? ''}
                  onChange={(event) => setDraft((prev) => ({ ...prev, cfop: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Input
                  value={draft.unit}
                  onChange={(event) => setDraft((prev) => ({ ...prev, unit: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={draft.quantity}
                  onChange={(event) => setDraft((prev) => ({ ...prev, quantity: Number(event.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor unitário</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.unit_value}
                  onChange={(event) => setDraft((prev) => ({ ...prev, unit_value: Number(event.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Desconto</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.discount_value ?? 0}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, discount_value: Number(event.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Acréscimo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.addition_value ?? 0}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, addition_value: Number(event.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  {isSeed || isDefensive ? 'Lotes' : 'Destinos'} ({sumDestinations(draft.destinations)} de{' '}
                  {draft.quantity})
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      destinations: [...prev.destinations, emptyDestination()],
                    }))
                  }
                >
                  <Plus className="mr-1 h-3 w-3" /> {isSeed || isDefensive ? 'Lote' : 'Destino'}
                </Button>
              </div>

              {draft.destinations.map((destination, index) => (
                <div key={index} className="grid grid-cols-2 gap-3 rounded-md border p-3 md:grid-cols-4">
                  {entryType === 'INPUT' && (
                    <div className="space-y-1">
                      <Label className="text-xs">Talhão</Label>
                      <Combobox
                        options={options.fieldOptions}
                        value={destination.plot_field_id ?? ''}
                        onValueChange={(value) =>
                          setDestination(index, { plot_field_id: value, stock_location_id: null })
                        }
                        placeholder="Talhão"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs">
                      {isFuelOrLubricant ? 'Posto físico' : 'Local de estoque'}
                    </Label>
                    <Combobox
                      options={locationOptions}
                      value={destination.stock_location_id ?? ''}
                      onValueChange={(value) => selectLocation(index, value)}
                      placeholder={isFuelOrLubricant ? 'Selecione o posto' : 'Selecione o local'}
                    />
                  </div>

                  {(isDefensive || isSeed) && (
                    <div className="space-y-1">
                      <Label className="text-xs">Lote</Label>
                      <Input
                        value={destination.batch ?? ''}
                        onChange={(event) => setDestination(index, { batch: event.target.value })}
                      />
                    </div>
                  )}

                  {isSeed && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">Peneira</Label>
                        <Input
                          value={destination.sieve ?? ''}
                          onChange={(event) => setDestination(index, { sieve: event.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Variedade</Label>
                        <Combobox
                          options={options.varietyOptions}
                          value={destination.variety_culture_id ?? ''}
                          onValueChange={(value) => selectVariety(index, value)}
                          placeholder="Selecione"
                        />
                      </div>
                    </>
                  )}

                  {isDefensive && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">Data de fabricação</Label>
                        <Input
                          type="date"
                          max={destination.expiration_date ?? undefined}
                          value={destination.manufacturing_date ?? ''}
                          onChange={(event) =>
                            setDestination(index, { manufacturing_date: event.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Data de vencimento</Label>
                        <Input
                          type="date"
                          min={destination.manufacturing_date ?? undefined}
                          value={destination.expiration_date ?? ''}
                          onChange={(event) => setDestination(index, { expiration_date: event.target.value })}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs">Quantidade</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={destination.quantity}
                      onChange={(event) => setDestination(index, { quantity: Number(event.target.value) })}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          destinations: prev.destinations.filter((_, current) => current !== index),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {errors.length > 0 && (
              <ul className="space-y-1 text-sm text-destructive">
                {errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={submitDraft}>
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
