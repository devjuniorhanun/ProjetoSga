import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BankSupplier, bankSuppliersService } from '@/lib/api-services-bank';
import { formatCPF, formatCNPJ } from '@/lib/format-helpers';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  supplier_name: z.string().trim().min(1, 'Nome do favorecido obrigatório').max(200),
  type: z.enum(['F', 'J', '']).optional(),
  cpf_cnpj: z.string().trim().max(20).optional().or(z.literal('')),
  bank_name: z.string().trim().max(100).optional().or(z.literal('')),
  agency_number: z.string().trim().max(20).optional().or(z.literal('')),
  account_number: z.string().trim().max(20).optional().or(z.literal('')),
  operation_number: z.string().trim().max(10).optional().or(z.literal('')),
  pix_key: z.string().trim().max(100).optional().or(z.literal('')),
  account_type: z.string().trim().max(50).optional().or(z.literal('')),
  status: z.enum(['A', 'I']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  supplierId: string;
  supplierLabel?: string;
  item?: BankSupplier | null;
  onSave: () => void;
  onCancel: () => void;
}

export function BankSupplierForm({ supplierId, supplierLabel, item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? {
          supplier_name: item.supplier_name || '',
          type: item.type || '',
          cpf_cnpj: item.cpf_cnpj || '',
          bank_name: item.bank_name || '',
          agency_number: item.agency_number || '',
          account_number: item.account_number || '',
          operation_number: item.operation_number || '',
          pix_key: item.pix_key || '',
          account_type: item.account_type || '',
          status: item.status ?? 'A',
        }
      : { status: 'A', type: '' },
  });

  const cpfCnpjValue = watch('cpf_cnpj') || '';
  const typeValue = watch('type') || '';

  const handleTypeChange = (v: 'F' | 'J') => {
    setValue('type', v, { shouldValidate: true });
    // Reaplica a máscara conforme o novo tipo
    const raw = cpfCnpjValue.replace(/\D/g, '');
    if (raw) {
      const formatted = (v === 'F' ? formatCPF(raw) : formatCNPJ(raw)).slice(0, 20);
      setValue('cpf_cnpj', formatted, { shouldValidate: true });
    }
  };

  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    let formatted: string;
    if (typeValue === 'F') {
      formatted = formatCPF(raw);
    } else if (typeValue === 'J') {
      formatted = formatCNPJ(raw);
    } else {
      formatted = raw.length <= 11 ? formatCPF(raw) : formatCNPJ(raw);
    }
    setValue('cpf_cnpj', formatted.slice(0, 20), { shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const payload = { ...data, supplier_id: supplierId };
    try {
      if (item) {
        await bankSuppliersService.update(item.id, payload);
        toast.success('Dados bancários atualizados!');
      } else {
        await bankSuppliersService.create(payload as Omit<BankSupplier, 'id'>);
        toast.success('Dados bancários criados!');
      }
      queryClient.invalidateQueries({ queryKey: ['bank-suppliers', supplierId] });
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
        <Label>Fornecedor</Label>
        <Input value={supplierLabel || supplierId} readOnly disabled />
      </div>
      <div className="space-y-2">
        <Label>Nome do Favorecido</Label>
        <Input {...register('supplier_name')} placeholder="Ex: João da Silva" />
        {errors.supplier_name && <p className="text-sm text-destructive">{errors.supplier_name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={typeValue} onValueChange={(v) => handleTypeChange(v as 'F' | 'J')}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="F">Física</SelectItem>
              <SelectItem value="J">Jurídica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>CPF/CNPJ</Label>
          <Input
            value={cpfCnpjValue}
            onChange={handleCpfCnpjChange}
            placeholder={typeValue === 'J' ? 'Ex: 00.000.000/0000-00' : 'Ex: 000.000.000-00'}
          />
          {errors.cpf_cnpj && <p className="text-sm text-destructive">{errors.cpf_cnpj.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Nome do Banco</Label>
        <Input {...register('bank_name')} placeholder="Ex: Banco do Brasil" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Agência</Label>
          <Input {...register('agency_number')} placeholder="Ex: 0001" />
        </div>
        <div className="space-y-2">
          <Label>Conta</Label>
          <Input {...register('account_number')} placeholder="Ex: 12345-6" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Operação</Label>
          <Input {...register('operation_number')} placeholder="Ex: 013" />
        </div>
        <div className="space-y-2">
          <Label>Tipo de Conta</Label>
          <Select value={watch('account_type') || ''} onValueChange={(v) => setValue('account_type', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="P">Poupança</SelectItem>
              <SelectItem value="C">Corrente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Chave PIX</Label>
          <Input {...register('pix_key')} placeholder="Ex: email@exemplo.com" />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={watch('status')} onValueChange={(v) => setValue('status', v as 'A' | 'I')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Ativo</SelectItem>
              <SelectItem value="I">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : (item ? 'Salvar' : 'Criar')}</Button>
      </div>
    </form>
  );
}
