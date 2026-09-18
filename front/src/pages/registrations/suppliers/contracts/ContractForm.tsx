import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/RichTextEditor';
import { cropsService } from '@/lib/api-services';
import { Contract } from '@/lib/api-services-contracts';
import { formatCurrencyBRL, handleCurrencyMaskChange } from '@/lib/format-helpers';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  crop_id: z.string().min(1, 'Safra obrigatória'),
  opening_date: z.string().min(1, 'Data de abertura obrigatória'),
  closing_date: z.string().min(1, 'Data de fechamento obrigatória'),
  shipping_cost: z.coerce.number().min(0, 'Valor inválido').default(0),
  body: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: Contract | null;
  service: {
    create: (payload: Omit<Contract, 'id'>) => Promise<Contract>;
    update: (id: string, payload: Partial<Contract>) => Promise<Contract>;
  };
  queryKey: string;
  label: string;
  showShippingCost?: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function ContractForm({ item, service, queryKey, label, showShippingCost = true, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [costDisplay, setCostDisplay] = useState(item?.shipping_cost ? formatCurrencyBRL(item.shipping_cost) : '');
  const { data: crops = [], isLoading: loadingCrops } = useQuery({ queryKey: ['crops'], queryFn: cropsService.getAll });

  const activeCrops = crops.filter((c) => c.status === 'A' || c.id === item?.crop_id);

  const { handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? {
          crop_id: item.crop_id,
          opening_date: item.opening_date?.slice(0, 10) ?? '',
          closing_date: item.closing_date?.slice(0, 10) ?? '',
          shipping_cost: item.shipping_cost ?? 0,
          body: item.body ?? '',
        }
      : { crop_id: '', opening_date: '', closing_date: '', shipping_cost: 0, body: '' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (item) { await service.update(item.id, data); toast.success(`${label} atualizado!`); }
      else { await service.create(data as Omit<Contract, 'id'>); toast.success(`${label} criado!`); }
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Safra</Label>
        {loadingCrops ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
        ) : (
          <Select value={watch('crop_id')} onValueChange={(v) => setValue('crop_id', v, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Selecione a safra" /></SelectTrigger>
            <SelectContent>{activeCrops.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        )}
        {errors.crop_id && <p className="text-sm text-destructive">{errors.crop_id.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Data de Abertura</Label>
          <Input type="date" value={watch('opening_date') || ''} onChange={(e) => setValue('opening_date', e.target.value, { shouldValidate: true })} />
          {errors.opening_date && <p className="text-sm text-destructive">{errors.opening_date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Data de Fechamento</Label>
          <Input type="date" value={watch('closing_date') || ''} onChange={(e) => setValue('closing_date', e.target.value, { shouldValidate: true })} />
          {errors.closing_date && <p className="text-sm text-destructive">{errors.closing_date.message}</p>}
        </div>
        {showShippingCost && (
          <div className="space-y-2">
            <Label>Valor do Frete</Label>
            <Input
              value={costDisplay}
              onChange={(e) => handleCurrencyMaskChange(e, setCostDisplay, (v) => setValue('shipping_cost', v, { shouldValidate: true }))}
              placeholder="R$ 0,00"
              inputMode="numeric"
            />
            {errors.shipping_cost && <p className="text-sm text-destructive">{errors.shipping_cost.message}</p>}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Corpo do Contrato</Label>
        <RichTextEditor value={watch('body') || ''} onChange={(v) => setValue('body', v)} placeholder="Digite o conteúdo do contrato..." />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (item ? 'Salvar' : 'Criar')}</Button>
      </div>
    </form>
  );
}
