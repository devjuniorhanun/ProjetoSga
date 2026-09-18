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
import {
  destinationsMatchQuantity,
  isCompatibleFuelLocation,
  itemTotal,
  sumDestinations,
  validateInvoiceItem,
} from '@/lib/fiscal-rules';
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

  const locationOptions = useMemo(() => {
    if (entryType !== 'FUEL') return options.stockLocationOptions;
    const profile = options.stockProfiles.find((p) => String(p.product_id) === String(draft.product_id));
    return options.stockLocations
      .filter((location) => isCompatibleFuelLocation(location, profile))
      .map((location) => ({ value: String(location.id), label: location.name }));
  }, [entryType, options, draft.product_id]);

  const setDestination = (index: number, patch: Partial<InvoiceItemDestination>) => {
    setDraft((prev) => ({
      ...prev,
      destinations: prev.destinations.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    }));
  };

  const submitDraft = () => {
    const result = validateInvoiceItem(entryType, draft);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    const product = options.productOptions.find((p) => p.value === draft.product_id);
    onChange([...items, { ...draft, product_name: product?.label, total_value: itemTotal(draft) }]);
    setDraft(emptyItem());
    setErrors([]);
    setOpen(false);
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
              <TableHead>Destinos</TableHead>
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
                    {sumDestinations(item.destinations)} de {item.quantity}
                  </TableCell>
                  {!disabled && (
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => onChange(items.filter((_, i) => i !== index))}
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
        <Button type="button" variant="outline" onClick={() => { setDraft(emptyItem()); setErrors([]); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar item
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
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
                  onValueChange={(v) => setDraft((prev) => ({ ...prev, product_id: v }))}
                  placeholder="Selecione o produto"
                />
              </div>
              <div className="space-y-2">
                <Label>Código do fornecedor</Label>
                <Input
                  value={draft.supplier_product_code ?? ''}
                  onChange={(e) => setDraft((prev) => ({ ...prev, supplier_product_code: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={draft.description} onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>NCM</Label>
                <Input value={draft.ncm ?? ''} onChange={(e) => setDraft((prev) => ({ ...prev, ncm: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>CFOP</Label>
                <Input value={draft.cfop ?? ''} onChange={(e) => setDraft((prev) => ({ ...prev, cfop: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Input value={draft.unit} onChange={(e) => setDraft((prev) => ({ ...prev, unit: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={draft.quantity}
                  onChange={(e) => setDraft((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor unitário</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.unit_value}
                  onChange={(e) => setDraft((prev) => ({ ...prev, unit_value: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Desconto</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.discount_value ?? 0}
                  onChange={(e) => setDraft((prev) => ({ ...prev, discount_value: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Acréscimo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.addition_value ?? 0}
                  onChange={(e) => setDraft((prev) => ({ ...prev, addition_value: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Destinos ({sumDestinations(draft.destinations)} de {draft.quantity})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDraft((prev) => ({ ...prev, destinations: [...prev.destinations, emptyDestination()] }))}
                >
                  <Plus className="mr-1 h-3 w-3" /> Destino
                </Button>
              </div>
              {draft.destinations.map((destination, index) => (
                <div key={index} className="grid grid-cols-2 gap-3 rounded-md border p-3 md:grid-cols-3">
                  {entryType === 'INPUT' && (
                    <div className="space-y-1">
                      <Label className="text-xs">Talhão</Label>
                      <Combobox
                        options={options.fieldOptions}
                        value={destination.field_id ?? ''}
                        onValueChange={(v) => setDestination(index, { field_id: v, stock_location_id: null })}
                        placeholder="Talhão"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs">Local de estoque</Label>
                    <Combobox
                      options={locationOptions}
                      value={destination.stock_location_id ?? ''}
                      onValueChange={(v) => setDestination(index, { stock_location_id: v })}
                      placeholder="Local"
                    />
                  </div>
                  {entryType === 'SEED' && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">Cultura</Label>
                        <Combobox
                          options={options.cultureOptions}
                          value={destination.culture_id ?? ''}
                          onValueChange={(v) => setDestination(index, { culture_id: v, variety_id: null })}
                          placeholder="Cultura"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Variedade</Label>
                        <Combobox
                          options={options.varietiesByCulture(destination.culture_id)}
                          value={destination.variety_id ?? ''}
                          onValueChange={(v) => setDestination(index, { variety_id: v })}
                          placeholder="Variedade"
                          disabled={!destination.culture_id}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Lote</Label>
                        <Input
                          value={destination.batch ?? ''}
                          onChange={(e) => setDestination(index, { batch: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Validade</Label>
                        <Input
                          type="date"
                          value={destination.expiration_date ?? ''}
                          onChange={(e) => setDestination(index, { expiration_date: e.target.value })}
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
                      onChange={(e) => setDestination(index, { quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() =>
                        setDraft((prev) => ({ ...prev, destinations: prev.destinations.filter((_, i) => i !== index) }))
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
