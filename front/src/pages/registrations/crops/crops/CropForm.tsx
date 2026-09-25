import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crop, cropsService, agriculturalYearsService, culturesService } from '@/lib/api-services';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  agricultural_year_id: z.string().min(1, 'Ano agrícola obrigatório'),
  name: z.string().trim().min(1, 'Nome obrigatório').max(100),
  opening_date: z.string().min(1, 'Data obrigatória'),
  closing_date: z.string().min(1, 'Data obrigatória'),
  status: z.enum(['A', 'I']),
  culture_ids: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: Crop | null;
  onSave: () => void;
  onCancel: () => void;
}

export function CropForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data: agriculturalYears = [], isLoading: loadingYears } = useQuery({
    queryKey: ['agricultural-years'],
    queryFn: () => agriculturalYearsService.getAll({ status: 'A' }),
  });

  const { data: cultures = [], isLoading: loadingCultures } = useQuery({
    queryKey: ['cultures'],
    queryFn: () => culturesService.getAll({ status: 'A' }),
  });

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? {
          agricultural_year_id: item.agricultural_year_id,
          name: item.name,
          opening_date: item.opening_date,
          closing_date: item.closing_date,
          status: item.status,
          culture_ids: item.culture_ids ?? [],
        }
      : { status: 'A', culture_ids: [] },
  });

  const selectedCultures = watch('culture_ids') ?? [];

  const toggleCulture = (cultureId: string) => {
    const current = selectedCultures;
    const updated = current.includes(cultureId)
      ? current.filter((id) => id !== cultureId)
      : [...current, cultureId];
    setValue('culture_ids', updated);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (item) {
        await cropsService.update(item.id, data);
        toast.success('Safra atualizada!');
      } else {
        await cropsService.create(data as Omit<Crop, 'id'>);
        toast.success('Safra criada!');
      }
      queryClient.invalidateQueries({ queryKey: ['crops'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar registro.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="general" className="flex-1">Dados Gerais</TabsTrigger>
          <TabsTrigger value="cultures" className="flex-1">Culturas</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Ano Agrícola</Label>
            {loadingYears ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : (
              <Combobox
                options={agriculturalYears
                  .filter((year) => year.status === 'A')
                  .map((year) => ({ value: year.id, label: year.name }))}
                value={watch('agricultural_year_id')}
                onValueChange={(v) => setValue('agricultural_year_id', v, { shouldValidate: true })}
                placeholder="Selecione o ano agrícola"
                searchPlaceholder="Buscar ano agrícola..."
                emptyText="Nenhum ano agrícola encontrado."
              />
            )}
            {errors.agricultural_year_id && <p className="text-sm text-destructive">{errors.agricultural_year_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Nome</Label>
            <Input {...register('name')} placeholder="Ex: Safra Verão 2024/2025" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Abertura</Label>
              <Input type="date" {...register('opening_date')} />
              {errors.opening_date && <p className="text-sm text-destructive">{errors.opening_date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Data Fechamento</Label>
              <Input type="date" {...register('closing_date')} />
              {errors.closing_date && <p className="text-sm text-destructive">{errors.closing_date.message}</p>}
            </div>
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
        </TabsContent>

        <TabsContent value="cultures" className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Culturas</Label>
            <p className="text-sm text-muted-foreground">Selecione uma ou mais culturas para esta safra.</p>
            {loadingCultures ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : cultures.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma cultura cadastrada.</p>
            ) : (
              <div className="space-y-2 rounded-md border p-3 max-h-60 overflow-y-auto">
                {cultures.map((culture) => (
                  <label key={culture.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1.5 transition-colors">
                    <Checkbox
                      checked={selectedCultures.includes(culture.id)}
                      onCheckedChange={() => toggleCulture(culture.id)}
                    />
                    <span className="text-sm">{culture.name}</span>
                  </label>
                ))}
              </div>
            )}
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
