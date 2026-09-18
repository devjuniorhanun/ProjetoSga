import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Supplier, suppliersService, typeSuppliersService } from '@/lib/api-services';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { formatCpfCnpj } from '@/lib/format-helpers';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  corporate_reason: z.string().trim().min(1, 'Razão social obrigatória').max(200),
  fantasy_name: z.string().trim().min(1, 'Nome fantasia obrigatório').max(200),
  type: z.enum(['F', 'J'], { required_error: 'Tipo obrigatório' }),
  cpf_cnpj: z.string().trim().min(1, 'CPF/CNPJ obrigatório').max(20),
  rg_ie: z.string().trim().max(20).optional().or(z.literal('')),
  status: z.enum(['A', 'I']),
  typeSuppliers: z.array(z.string()).min(1, 'Selecione ao menos um tipo de fornecedor.'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: Supplier | null;
  onSave: () => void;
  onCancel: () => void;
}

export function SupplierForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [cpfCnpjDisplay, setCpfCnpjDisplay] = useState('');

  const { data: typeSuppliers = [], isLoading: loadingTypes } = useQuery({
    queryKey: ['type-suppliers'],
    queryFn: typeSuppliersService.getAll,
  });

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? {
          corporate_reason: item.corporate_reason,
          fantasy_name: item.fantasy_name,
          type: item.type,
          cpf_cnpj: item.cpf_cnpj,
          rg_ie: item.rg_ie || '',
          status: item.status,
          typeSuppliers: (item.typeSuppliers ?? []).map(String),
        }
      : { status: 'A', typeSuppliers: [] },
  });

  const selectedTypes = watch('typeSuppliers') ?? [];
  const currentType = watch('type');

  // Initialize CPF/CNPJ display with mask
  useEffect(() => {
    if (item?.cpf_cnpj) {
      setCpfCnpjDisplay(formatCpfCnpj(item.cpf_cnpj, item.type));
    }
  }, [item]);

  const handleTypeChange = (v: 'F' | 'J') => {
    setValue('type', v);
    // Re-apply mask when type changes
    const raw = watch('cpf_cnpj');
    if (raw) {
      const masked = formatCpfCnpj(raw, v);
      setCpfCnpjDisplay(masked);
    }
  };

  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setValue('cpf_cnpj', raw);
    setCpfCnpjDisplay(formatCpfCnpj(raw, currentType));
  };

  const toggleType = (id: string | number) => {
    const normalizedId = String(id);
    const updated = selectedTypes.includes(normalizedId)
      ? selectedTypes.filter((typeId) => typeId !== normalizedId)
      : [...selectedTypes, normalizedId];
    setValue('typeSuppliers', updated, { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const payload = { ...data, cpf_cnpj: formatCpfCnpj(data.cpf_cnpj, data.type) };
    try {
      if (item) {
        await suppliersService.update(item.id, payload);
        toast.success('Fornecedor atualizado!');
      } else {
        await suppliersService.create(payload as Omit<Supplier, 'id'>);
        toast.success('Fornecedor criado!');
      }
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Tabs defaultValue="supplier" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="supplier" className="flex-1">Fornecedor</TabsTrigger>
          <TabsTrigger value="types" className="flex-1">Tipos</TabsTrigger>
        </TabsList>

        <TabsContent value="supplier" className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Razão Social</Label>
            <Input {...register('corporate_reason')} placeholder="Ex: Empresa XYZ Ltda" />
            {errors.corporate_reason && <p className="text-sm text-destructive">{errors.corporate_reason.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Nome Fantasia</Label>
            <Input {...register('fantasy_name')} placeholder="Ex: Empresa XYZ" />
            {errors.fantasy_name && <p className="text-sm text-destructive">{errors.fantasy_name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={currentType} onValueChange={(v) => handleTypeChange(v as 'F' | 'J')}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="F">Físico</SelectItem>
                  <SelectItem value="J">Jurídico</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>CPF/CNPJ</Label>
              <Input
                value={cpfCnpjDisplay}
                onChange={handleCpfCnpjChange}
                placeholder={currentType === 'F' ? '000.000.000-00' : '00.000.000/0000-00'}
              />
              {errors.cpf_cnpj && <p className="text-sm text-destructive">{errors.cpf_cnpj.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>RG/IE</Label>
              <Input {...register('rg_ie')} placeholder="Ex: 000.000.000-0" />
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
        </TabsContent>

        <TabsContent value="types" className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Tipos de Fornecedor</Label>
            <p className="text-sm text-muted-foreground">Selecione um ou mais tipos para este fornecedor.</p>
            {loadingTypes ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
            ) : typeSuppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum tipo cadastrado.</p>
            ) : (
              <div className="space-y-2 rounded-md border p-3 max-h-60 overflow-y-auto">
                {typeSuppliers.map((ts) => (
                  <label key={ts.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1.5 transition-colors">
                    <Checkbox checked={selectedTypes.includes(String(ts.id))} onCheckedChange={() => toggleType(ts.id)} />
                    <span className="text-sm">{ts.name}</span>
                  </label>
                ))}
              </div>
            )}
            {errors.typeSuppliers && <p className="text-sm text-destructive">{errors.typeSuppliers.message}</p>}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (item ? 'Salvar' : 'Criar')}
        </Button>
      </div>
    </form>
  );
}