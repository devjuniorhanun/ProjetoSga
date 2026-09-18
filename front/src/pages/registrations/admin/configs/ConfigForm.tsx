import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Config, configsService } from '@/lib/api-services-admin';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { applyApiErrors } from '@/lib/form-errors';

const schema = z.object({
  producer_name: z.string().trim().min(1, 'Nome do produtor obrigatório').max(150),
  property_name: z.string().trim().min(1, 'Nome da propriedade obrigatório').max(150),
  producer_color: z.string().min(1, 'Cor obrigatória'),
  property_color: z.string().min(1, 'Cor obrigatória'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: Config | null;
  onSave: () => void;
  onCancel: () => void;
}

export function ConfigForm({ item, onSave, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? {
          producer_name: item.producer_name,
          property_name: item.property_name,
          producer_color: item.producer_color || '#2E7D32',
          property_color: item.property_color || '#795548',
        }
      : { producer_name: '', property_name: '', producer_color: '#2E7D32', property_color: '#795548' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (item) {
        await configsService.update(item.id, data);
        toast.success('Configuração atualizada!');
      } else {
        await configsService.create(data as Omit<Config, 'id'>);
        toast.success('Configuração criada!');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-configs'] });
      onSave();
    } catch (error: any) {
      applyApiErrors(error, setError, { fallbackMessage: 'Erro ao salvar configuração.' });
    } finally {
      setLoading(false);
    }
  };

  const colorField = (name: 'producer_color' | 'property_color', label: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={watch(name)}
          onChange={(e) => setValue(name, e.target.value)}
          className="h-10 w-14 rounded-md border border-input bg-background p-1 cursor-pointer"
          aria-label={label}
        />
        <Input value={watch(name)} onChange={(e) => setValue(name, e.target.value)} placeholder="#000000" />
      </div>
      {errors[name] && <p className="text-sm text-destructive">{errors[name]?.message}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do Produtor</Label>
        <Input {...register('producer_name')} placeholder="Nome do produtor" />
        {errors.producer_name && <p className="text-sm text-destructive">{errors.producer_name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Nome da Propriedade</Label>
        <Input {...register('property_name')} placeholder="Nome da propriedade" />
        {errors.property_name && <p className="text-sm text-destructive">{errors.property_name.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {colorField('producer_color', 'Cor do Produtor')}
        {colorField('property_color', 'Cor da Propriedade')}
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
