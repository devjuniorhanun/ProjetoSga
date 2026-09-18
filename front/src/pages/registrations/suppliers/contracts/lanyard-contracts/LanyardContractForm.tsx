import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { suppliersService, typeSuppliersService } from '@/lib/api-services';
import { Contract, LanyardContract, contractLanyardsService, lanyardContractsService } from '@/lib/api-services-contracts';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  lanyard_contract_id: z.string().min(1, 'Contrato obrigatório'),
  supplier_id: z.string().min(1, 'Fornecedor obrigatório'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: LanyardContract | null;
  onSave: () => void;
  onCancel: () => void;
}

const formatDate = (value?: string) =>
  value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '';

const normalize = (str?: string) =>
  (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function LanyardContractForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ['contract-lanyards'],
    queryFn: contractLanyardsService.getAll,
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: suppliersService.getAll,
  });
  const { data: typeSuppliers = [] } = useQuery({
    queryKey: ['type-suppliers'],
    queryFn: typeSuppliersService.getAll,
  });

  const colhedorTypeId = typeSuppliers.find(
    (ts) => normalize(ts.name) === 'colhedor' && ts.status === 'A',
  )?.id;

  const contractOptions = contracts.map((c) => ({
    value: c.id,
    label: `${c.crop_name || 'Contrato'} — ${formatDate(c.opening_date)} a ${formatDate(c.closing_date)}`,
  }));

  const supplierOptions = suppliers
    .filter((s) => {
      const isActive = s.status === 'A';
      const isColhedor = colhedorTypeId
        ? (s.type_supplier_ids || []).includes(colhedorTypeId)
        : true;
      return (isActive && isColhedor) || s.id === item?.supplier_id;
    })
    .map((s) => ({ value: s.id, label: s.fantasy_name || s.corporate_reason || s.supplier_name || '-' }));

  const { handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      lanyard_contract_id: item?.lanyard_contract_id ?? '',
      supplier_id: item?.supplier_id ?? '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (item) {
        await lanyardContractsService.update(item.id, data);
        toast.success('Registro atualizado!');
      } else {
        await lanyardContractsService.create(data as Omit<LanyardContract, 'id'>);
        toast.success('Registro criado!');
      }
      queryClient.invalidateQueries({ queryKey: ['lanyard-contracts'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Contrato de Colhedor</Label>
        <Combobox
          options={contractOptions}
          value={watch('lanyard_contract_id')}
          onValueChange={(v) => setValue('lanyard_contract_id', v, { shouldValidate: true })}
          placeholder="Selecione o contrato"
          searchPlaceholder="Buscar contrato..."
        />
        {errors.lanyard_contract_id && <p className="text-sm text-destructive">{errors.lanyard_contract_id.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Fornecedor</Label>
        <Combobox
          options={supplierOptions}
          value={watch('supplier_id')}
          onValueChange={(v) => setValue('supplier_id', v, { shouldValidate: true })}
          placeholder="Selecione o fornecedor"
          searchPlaceholder="Buscar fornecedor..."
        />
        {errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (item ? 'Salvar' : 'Criar')}
        </Button>
      </div>
    </form>
  );
}
