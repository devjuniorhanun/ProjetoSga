import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { entryInvoicesService } from '@/lib/api-services-fiscal';
import { useFiscalOptions } from '@/hooks/use-fiscal-options';
import { formatCurrencyBRL } from '@/lib/format-helpers';
import type { FiscalEntryType, XmlImportPreview } from '@/types/fiscal';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Recebe a prévia já revisada para preencher o formulário da nota. */
  onUse: (preview: XmlImportPreview) => void;
  entryType: FiscalEntryType;
}

export function XmlImportDialog({ open, onOpenChange, onUse, entryType }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<XmlImportPreview | null>(null);
  const options = useFiscalOptions(entryType);

  const previewMutation = useMutation({
    mutationFn: (selected: File) => entryInvoicesService.previewXml(selected),
    onSuccess: (result) => setPreview(result),
    onError: () => toast.error('Não foi possível ler o XML enviado.'),
  });

  const linkMutation = useMutation({
    mutationFn: ({ itemId, productId }: { itemId: string; productId: string }) =>
      entryInvoicesService.linkImportItem(itemId, productId),
    onSuccess: (_data, variables) => {
      const product = options.products.find((item) => String(item.id) === variables.productId);
      setPreview((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((item) =>
                item.id === variables.itemId
                  ? { ...item, product_id: variables.productId, product_name: product?.name, unit: product?.unit, linked: true }
                  : item,
              ),
            }
          : prev,
      );
      toast.success('Produto vinculado.');
    },
    onError: () => toast.error('Não foi possível vincular o produto.'),
  });

  const unlinked = preview?.items.filter((item) => !item.linked && !item.product_id) ?? [];

  const close = () => {
    setFile(null);
    setPreview(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (value ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importar nota por XML</DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label>Arquivo XML</Label>
            <Input type="file" accept=".xml,text/xml" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <Button
            type="button"
            disabled={!file || previewMutation.isPending}
            onClick={() => file && previewMutation.mutate(file)}
          >
            <Upload className="mr-2 h-4 w-4" /> Analisar XML
          </Button>

          {preview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-md border p-3 text-sm md:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">Nota</p>
                  <p className="font-medium">{preview.invoice_number ?? '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Série</p>
                  <p className="font-medium">{preview.series ?? '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fornecedor</p>
                  <p className="font-medium">{preview.supplier_name ?? '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium">{formatCurrencyBRL(preview.invoice_total ?? 0)}</p>
                </div>
                <div className="col-span-2 md:col-span-4">
                  <p className="text-muted-foreground">Chave de acesso</p>
                  <p className="break-all font-medium">{preview.access_key ?? '-'}</p>
                </div>
              </div>

              {!!preview.warnings?.length && (
                <ul className="space-y-1 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                  {preview.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
              {!!preview.errors?.length && (
                <ul className="space-y-1 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {preview.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição no XML</TableHead>
                      <TableHead>Código fornecedor</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Valor unit.</TableHead>
                      <TableHead>Produto do cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.supplier_product_code ?? '-'}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrencyBRL(item.unit_value)}</TableCell>
                        <TableCell className="w-64">
                          <Combobox
                            options={options.productOptions}
                            value={item.product_id ?? ''}
                            onValueChange={(productId) => linkMutation.mutate({ itemId: item.id, productId })}
                            placeholder="Vincular produto"
                            disabled={linkMutation.isPending}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {unlinked.length > 0 && (
                <p className="text-sm text-destructive">
                  {unlinked.length} item(ns) ainda sem produto vinculado. Vincule todos antes de usar a nota.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={close}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!preview || unlinked.length > 0 || !!preview?.errors?.length}
            onClick={() => {
              if (preview) {
                onUse(preview);
                close();
              }
            }}
          >
            Usar dados no formulário
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
