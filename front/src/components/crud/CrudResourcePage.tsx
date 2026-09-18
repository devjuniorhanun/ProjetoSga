import { useMemo, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { applyApiErrors, getApiValidationErrors } from '@/lib/form-errors';

export type CrudFormValues = Record<string, string>;

export interface CrudFieldOption {
  value: string;
  label: string;
}

export interface CrudField {
  name: string;
  label: string | ((values: CrudFormValues) => string);
  type: 'text' | 'number' | 'date' | 'datetime-local' | 'textarea' | 'select' | 'combobox';
  options?: CrudFieldOption[] | ((values: CrudFormValues) => CrudFieldOption[]);
  required?: boolean;
  step?: string;
  placeholder?: string;
  readOnly?: boolean;
  /** Valor calculado a partir dos demais campos (sempre somente leitura). */
  compute?: (values: CrudFormValues) => string;
  /** Validação adicional; retorna a mensagem de erro ou undefined. */
  validate?: (values: CrudFormValues) => string | undefined;
  fullWidth?: boolean;
  hidden?: (values: CrudFormValues) => boolean;
  /** Campos dependentes limpos quando este campo muda (comboboxes em cascata). */
  clears?: string[];
}

interface CrudService<T> {
  getAll: () => Promise<T[]>;
  create: (payload: Omit<T, 'id'>) => Promise<T>;
  update: (id: string, payload: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
}

export interface CrudColumn<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
}

interface Props<T extends { id: string }> {
  title: string;
  description: string;
  singular: string;
  queryKey: string;
  /** Queries adicionais invalidadas após criar/editar/excluir. */
  relatedQueryKeys?: string[];
  service: CrudService<T>;
  data: T[];
  isLoading: boolean;
  columns: CrudColumn<T>[];
  fields: CrudField[];
  searchKeys?: string[];
  /** Valores iniciais para novo registro. */
  defaultValues?: CrudFormValues;
  /** Converte o registro da API nos valores do formulário. */
  toFormValues?: (item: T) => CrudFormValues;
  /** Ajusta o payload enviado à API. */
  buildPayload?: (values: CrudFormValues) => Record<string, unknown>;
  /** Campos numéricos (enviados como número). */
  numericFields?: string[];
  /** Confirmação antes de salvar (operações críticas). */
  confirmOnSave?: boolean;
  extraActions?: (item: T) => ReactNode;
  headerActions?: ReactNode;
  allowDelete?: boolean;
}

const asNumber = (v: string) => {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export function CrudResourcePage<T extends { id: string }>({
  title,
  description,
  singular,
  queryKey,
  relatedQueryKeys = [],
  service,
  data,
  isLoading,
  columns,
  fields,
  searchKeys = [],
  defaultValues = {},
  toFormValues,
  buildPayload,
  numericFields = [],
  confirmOnSave = false,
  extraActions,
  headerActions,
  allowDelete = true,
}: Props<T>) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [viewItem, setViewItem] = useState<T | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [values, setValues] = useState<CrudFormValues>(defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);

  const visibleFields = useMemo(
    () => fields.filter((f) => !f.hidden?.(values)),
    [fields, values],
  );

  const invalidate = () => {
    [queryKey, ...relatedQueryKeys].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key] }),
    );
  };

  const openNew = () => {
    setEditItem(null);
    setValues(defaultValues);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (item: T) => {
    setEditItem(item);
    const base: CrudFormValues = {};
    fields.forEach((f) => {
      const raw = (item as Record<string, unknown>)[f.name];
      base[f.name] = raw === null || raw === undefined ? '' : String(raw);
    });
    setValues(toFormValues ? { ...base, ...toFormValues(item) } : base);
    setErrors({});
    setShowForm(true);
  };

  const setField = (name: string, value: string) => {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      if (prev[name] !== value) {
        fields
          .find((f) => f.name === name)
          ?.clears?.forEach((child) => {
            next[child] = '';
          });
      }
      fields.forEach((f) => {
        if (f.compute) next[f.name] = f.compute(next);
      });
      return next;
    });
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    visibleFields.forEach((f) => {
      const value = values[f.name] ?? '';
      if (f.required && String(value).trim() === '') {
        next[f.name] = 'Campo obrigatório';
        return;
      }
      if (f.type === 'number' && value !== '' && !Number.isFinite(asNumber(value))) {
        next[f.name] = 'Informe um número válido';
        return;
      }
      const custom = f.validate?.(values);
      if (custom) next[f.name] = custom;
    });
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error('Verifique os campos destacados.');
      return false;
    }
    return true;
  };

  const persist = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = buildPayload
        ? buildPayload(values)
        : Object.fromEntries(
            fields.map((f) => [
              f.name,
              numericFields.includes(f.name) || f.type === 'number'
                ? asNumber(values[f.name] ?? '')
                : values[f.name] ?? '',
            ]),
          );

      if (editItem) {
        await service.update(editItem.id, payload as Partial<T>);
        toast.success(`${singular} atualizado com sucesso!`);
      } else {
        await service.create(payload as Omit<T, 'id'>);
        toast.success(`${singular} criado com sucesso!`);
      }
      invalidate();
      setShowForm(false);
      setEditItem(null);
    } catch (error) {
      const apiErrors = getApiValidationErrors(error);
      if (apiErrors) {
        const mapped: Record<string, string> = {};
        Object.entries(apiErrors).forEach(([field, message]) => {
          mapped[field] = Array.isArray(message) ? message.join(' ') : String(message);
        });
        setErrors(mapped);
      }
      applyApiErrors(error, undefined, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (confirmOnSave) setShowConfirmSave(true);
    else persist();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await service.delete(deleteId);
      toast.success('Registro excluído!');
      invalidate();
    } catch (error) {
      applyApiErrors(error, undefined, { fallbackMessage: 'Erro ao excluir registro.' });
    }
    setDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const labelOf = (f: CrudField) => (typeof f.label === 'function' ? f.label(values) : f.label);
  const optionsOf = (f: CrudField) => (typeof f.options === 'function' ? f.options(values) : f.options ?? []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Novo</Button>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        searchKeys={searchKeys}
        searchPlaceholder={`Buscar ${title.toLowerCase()}...`}
        exportTitle={title}
        actions={(item) => (
          <div className="flex items-center gap-1">
            {extraActions?.(item)}
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Visualizar" onClick={() => setViewItem(item)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => openEdit(item)}>
              <Pencil className="h-4 w-4" />
            </Button>
            {allowDelete && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Excluir" onClick={() => setDeleteId(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      />

      {/* Formulário */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditItem(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? `Editar ${singular}` : `Novo ${singular}`}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleFields.map((f) => (
                <div key={f.name} className={`space-y-2 ${f.fullWidth ? 'sm:col-span-2' : ''}`}>
                  <Label>{labelOf(f)}</Label>
                  {f.type === 'select' && (
                    <Select value={values[f.name] ?? ''} onValueChange={(v) => setField(f.name, v)}>
                      <SelectTrigger><SelectValue placeholder={f.placeholder || 'Selecione'} /></SelectTrigger>
                      <SelectContent>
                        {optionsOf(f).map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {f.type === 'combobox' && (
                    <Combobox
                      options={optionsOf(f)}
                      value={values[f.name] ?? ''}
                      onValueChange={(v) => setField(f.name, v)}
                      placeholder={f.placeholder || 'Selecione'}
                    />
                  )}
                  {f.type === 'textarea' && (
                    <Textarea
                      value={values[f.name] ?? ''}
                      onChange={(e) => setField(f.name, e.target.value)}
                      placeholder={f.placeholder}
                      rows={3}
                    />
                  )}
                  {['text', 'number', 'date', 'datetime-local'].includes(f.type) && (
                    <Input
                      type={f.type}
                      step={f.step}
                      value={values[f.name] ?? ''}
                      readOnly={f.readOnly || !!f.compute}
                      className={f.readOnly || f.compute ? 'bg-muted' : undefined}
                      onChange={(e) => setField(f.name, e.target.value)}
                      placeholder={f.placeholder}
                    />
                  )}
                  {errors[f.name] && <p className="text-sm text-destructive">{errors[f.name]}</p>}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editItem ? 'Salvar' : 'Criar')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detalhes */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3">
              {columns.map((c) => (
                <div key={c.key}>
                  <span className="text-sm text-muted-foreground">{c.label}:</span>
                  <div className="font-medium">
                    {c.render ? c.render(viewItem) : String((viewItem as Record<string, unknown>)[c.key] ?? '-')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showConfirmSave}
        onOpenChange={setShowConfirmSave}
        title="Confirmar operação"
        description="Deseja confirmar esta operação? O estoque e os históricos serão atualizados pelo sistema."
        confirmLabel="Confirmar"
        confirmVariant="success"
        onConfirm={() => { setShowConfirmSave(false); persist(); }}
      />

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
