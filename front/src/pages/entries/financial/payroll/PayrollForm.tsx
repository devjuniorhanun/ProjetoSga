import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import {
  PayAccount,
  PayAccountStatus,
  PAY_ACCOUNT_STATUS_LABELS,
  payAccountsService,
  PayrollPayload,
  typePayAccountsService,
  payAccountAdministrativeCenterName,
} from '@/lib/api-services-financial-entries';
import { getAdministrativeCentersByProducer } from '@/lib/api-services-financial';
import { suppliersService, producersService, agriculturalYearsService, cropsService } from '@/lib/api-services';
import { formatCurrencyBRL, handleCurrencyMaskChange } from '@/lib/format-helpers';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState, useMemo, useEffect } from 'react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  producer_id: z.string().min(1, 'Produtor obrigatório'),
  administrative_center_id: z.string().min(1, 'Centro administrativo obrigatório'),
  supplier_id: z.string().min(1, 'Funcionário/beneficiário obrigatório'),
  type_pay_account_id: z.string().min(1, 'Tipo de pagamento obrigatório'),
  document_number: z.string().min(1, 'Nº do documento obrigatório'),
  document_date: z.string().min(1, 'Data do documento obrigatória'),
  description: z.string().min(1, 'Descrição obrigatória'),
  value: z.number().gt(0, 'Valor deve ser maior que zero'),
  accounted_for: z.enum(['S', 'N']),
  status: z.enum(['CA', 'CO', 'RI', 'FA']),
  // O ano agrícola apenas auxilia a escolha da safra; a safra é obrigatória.
  agricultural_year_id: z.string().optional(),
  crop_id: z.string().min(1, 'Safra obrigatória'),

});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: PayAccount | null;
  onSave: () => void;
  onCancel: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function PayrollForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [valueDisplay, setValueDisplay] = useState(item ? formatCurrencyBRL(item.value) : '');

  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers', 'active-options'], queryFn: () => suppliersService.getAll({ status: 'A' }) });
  const { data: producers = [] } = useQuery({ queryKey: ['producers', 'active-options'], queryFn: () => producersService.getAll({ status: 'A' }) });
  const { data: typeAccounts = [] } = useQuery({ queryKey: ['type-pay-accounts', 'active-options'], queryFn: () => typePayAccountsService.getAll({ status: 'A' }) });
  const { data: agriculturalYears = [] } = useQuery({ queryKey: ['agricultural-years', 'active-options'], queryFn: () => agriculturalYearsService.getAll({ status: 'A' }) });
  const { data: crops = [] } = useQuery({ queryKey: ['crops', 'active-options'], queryFn: () => cropsService.getAll({ status: 'A' }) });

  const { handleSubmit, setValue, watch, register, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? {
          producer_id: String(item.producer_id ?? ''),
          administrative_center_id: String(item.administrative_center_id ?? ''),
          supplier_id: String(item.supplier_id ?? ''),
          type_pay_account_id: String(item.type_pay_account_id ?? ''),
          document_number: item.document_number,
          document_date: item.document_date?.slice(0, 10),
          description: item.description ?? '',
          value: Number(item.value) || 0,
          accounted_for: item.accounted_for ?? 'N',
          status: item.status,
          agricultural_year_id: item.agricultural_year_id ? String(item.agricultural_year_id) : '',
          crop_id: item.crop_id ? String(item.crop_id) : '',
        }
      : {
          producer_id: '',
          administrative_center_id: '',
          document_date: today(),
          accounted_for: 'N',
          status: 'RI' as PayAccountStatus,
          value: 0,
          description: '',
          agricultural_year_id: '',
          crop_id: '',
        },
  });

  const selectedProducerId = watch('producer_id');
  const selectedYearId = watch('agricultural_year_id');
  const selectedCropId = watch('crop_id');

  const yearOptions = useMemo(
    () => [
      { value: '', label: 'Todos os anos' },
      ...agriculturalYears
        .filter((y: any) => y.status === 'A' || String(y.id) === String(item?.agricultural_year_id))
        .map((y: any) => ({ value: String(y.id), label: y.name || String(y.id) })),
    ],
    [agriculturalYears, item?.agricultural_year_id],
  );

  // A safra depende do ano agrícola escolhido e é obrigatória.
  const cropOptions = useMemo(
    () =>
      crops
        .filter((c) => !selectedYearId || String(c.agricultural_year_id) === String(selectedYearId))
        .filter((c) => c.status === 'A' || String(c.id) === String(item?.crop_id))
        .map((c) => ({ value: String(c.id), label: c.name })),
    [crops, selectedYearId, item?.crop_id],
  );

  // Ao trocar o ano agrícola, a safra anterior só permanece se pertencer ao novo ano.
  useEffect(() => {
    if (selectedCropId && !cropOptions.some((o) => o.value === selectedCropId)) {
      setValue('crop_id', '', { shouldValidate: true });
    }
  }, [cropOptions, selectedCropId, setValue]);

  // Sem registro em edição, a safra ativa é a seleção inicial.
  useEffect(() => {
    if (item || selectedCropId) return;
    const activeCrop = crops.find((c) => c.status === 'A');
    if (activeCrop) setValue('crop_id', String(activeCrop.id), { shouldValidate: true });
  }, [crops, item, selectedCropId, setValue]);


  const { data: administrativeCenters = [], isFetching: loadingCenters } = useQuery({
    queryKey: ['administrative-centers', selectedProducerId],
    queryFn: () => getAdministrativeCentersByProducer(selectedProducerId),
    enabled: !!selectedProducerId,
  });

  const administrativeCenterOptions = useMemo(() => {
    const options = administrativeCenters
      .filter((c) => c.status === 'A')
      .map((c) => ({
        value: String(c.id),
        label: c.farm_name && c.producer_name ? `${c.farm_name} - ${c.producer_name}` : (c.farm_name || c.cei || String(c.id)),
        keywords: [c.cei, c.farm_name, c.producer_name].filter(Boolean) as string[],
      }));
    if (item?.administrative_center_id && !options.some((o) => o.value === String(item.administrative_center_id))) {
      options.unshift({
        value: String(item.administrative_center_id),
        label: payAccountAdministrativeCenterName(item),
        keywords: [],
      });
    }
    return options;
  }, [administrativeCenters, item]);

  const supplierOptions = useMemo(
    () => suppliers
      .filter((s) => s.status === 'A' || String(s.id) === String(item?.supplier_id))
      .map((s) => ({
        value: String(s.id),
        label: s.corporate_reason || s.fantasy_name || s.supplier_name,
        keywords: [s.fantasy_name, s.supplier_name, s.cpf_cnpj].filter(Boolean) as string[],
      })),
    [suppliers, item?.supplier_id]
  );

  const producerOptions = useMemo(
    () => producers
      .filter((p: any) => p.status === 'A' || String(p.id) === String(item?.producer_id))
      .map((p: any) => ({ value: String(p.id), label: p.owner_name || String(p.id) })),
    [producers, item?.producer_id]
  );

  const typeAccountOptions = useMemo(
    () => typeAccounts
      .filter((t) => t.status === 'A' || String(t.id) === String(item?.type_pay_account_id))
      .map((t) => ({ value: String(t.id), label: t.name, keywords: [t.abbreviation].filter(Boolean) })),
    [typeAccounts, item?.type_pay_account_id]
  );

  const handleProducerChange = (value: string) => {
    setValue('producer_id', value, { shouldValidate: true, shouldDirty: true });
    setValue('administrative_center_id', '', { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (data: FormData) => {
    if (!administrativeCenterOptions.some((o) => o.value === data.administrative_center_id)) {
      setError('administrative_center_id', { message: 'Centro administrativo inválido para o produtor selecionado.' });
      return;
    }
    // entry_type, cost_center_id e due_date são definidos pelo backend.
    const payload: PayrollPayload = {
      ...data,
      agricultural_year_id: data.agricultural_year_id || null,
      crop_id: data.crop_id,

    } as PayrollPayload;
    setLoading(true);
    try {
      if (item) {
        await payAccountsService.patch(item.id, payload);
        toast.success('Folha de pagamento atualizada!');
      } else {
        await payAccountsService.createPayroll(payload);
        toast.success('Folha de pagamento criada!');
      }
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['pay-accounts'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally {
      setLoading(false);
    }
  };

  const noCenters = !!selectedProducerId && !loadingCenters && administrativeCenterOptions.length === 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Produtor</Label>
          <Combobox
            options={producerOptions}
            value={watch('producer_id')}
            onValueChange={handleProducerChange}
            placeholder="Selecione o produtor"
            searchPlaceholder="Buscar produtor..."
          />
          {errors.producer_id && <p className="text-sm text-destructive">{errors.producer_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Centro Administrativo</Label>
          <Combobox
            options={administrativeCenterOptions}
            value={watch('administrative_center_id')}
            onValueChange={(v) => setValue('administrative_center_id', v, { shouldValidate: true })}
            placeholder={selectedProducerId ? 'Selecione o centro administrativo' : 'Selecione o produtor primeiro'}
            searchPlaceholder="Buscar centro administrativo..."
            disabled={!selectedProducerId}
          />
          {noCenters && (
            <p className="text-sm text-destructive">Nenhum centro administrativo ativo foi encontrado para este produtor.</p>
          )}
          {errors.administrative_center_id && <p className="text-sm text-destructive">{errors.administrative_center_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Ano Agrícola (opcional)</Label>
          <Combobox
            options={yearOptions}
            value={watch('agricultural_year_id') ?? ''}
            onValueChange={(v) => {
              setValue('agricultural_year_id', v, { shouldValidate: true });
              setValue('crop_id', '', { shouldValidate: true });
            }}
            placeholder="Sem vínculo"
            searchPlaceholder="Buscar ano agrícola..."
          />
        </div>

        <div className="space-y-2">
          <Label>Safra</Label>
          <Combobox
            options={cropOptions}
            value={watch('crop_id') ?? ''}
            onValueChange={(v) => setValue('crop_id', v, { shouldValidate: true })}
            placeholder="Selecione a safra"
            searchPlaceholder="Buscar safra..."
          />
          {errors.crop_id && <p className="text-sm text-destructive">{errors.crop_id.message}</p>}
        </div>


        <div className="space-y-2">
          <Label>Funcionário / Beneficiário</Label>
          <Combobox
            options={supplierOptions}
            value={watch('supplier_id')}
            onValueChange={(v) => setValue('supplier_id', v, { shouldValidate: true })}
            placeholder="Selecione o beneficiário"
            searchPlaceholder="Buscar beneficiário..."
          />
          {errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Tipo de Pagamento</Label>
          <Combobox
            options={typeAccountOptions}
            value={watch('type_pay_account_id')}
            onValueChange={(v) => setValue('type_pay_account_id', v, { shouldValidate: true })}
            placeholder="Selecione o tipo"
            searchPlaceholder="Buscar tipo..."
          />
          {errors.type_pay_account_id && <p className="text-sm text-destructive">{errors.type_pay_account_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Nº do Documento</Label>
          <Input {...register('document_number')} placeholder="Número do documento" />
          {errors.document_number && <p className="text-sm text-destructive">{errors.document_number.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Data do Documento</Label>
          <Input type="date" {...register('document_date')} />
          {errors.document_date && <p className="text-sm text-destructive">{errors.document_date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Valor</Label>
          <Input
            inputMode="decimal"
            value={valueDisplay}
            onChange={(e) => handleCurrencyMaskChange(
              e,
              setValueDisplay,
              (v) => setValue('value', v, { shouldValidate: true })
            )}
            placeholder="R$ 0,00"
          />
          {errors.value && <p className="text-sm text-destructive">{errors.value.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Contabilizado</Label>
          <Select value={watch('accounted_for')} onValueChange={(v) => setValue('accounted_for', v as 'S' | 'N')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="S">Contabilizado</SelectItem>
              <SelectItem value="N">Não contabilizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Unidade</Label>
          <Select value={watch('status')} onValueChange={(v) => setValue('status', v as PayAccountStatus)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {(Object.keys(PAY_ACCOUNT_STATUS_LABELS) as PayAccountStatus[]).map((k) => (
                <SelectItem key={k} value={k}>{PAY_ACCOUNT_STATUS_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea {...register('description')} placeholder="Descrição" rows={3} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : (item ? 'Salvar' : 'Criar')}</Button>
      </div>
    </form>
  );
}
