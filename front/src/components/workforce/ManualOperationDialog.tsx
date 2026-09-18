import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface ManualOperationValues {
  title: string;
  description: string;
  required_employees: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: ManualOperationValues;
  onSubmit: (values: ManualOperationValues) => void;
}

const EMPTY: ManualOperationValues = { title: '', description: '', required_employees: '' };

export function ManualOperationDialog({ open, onOpenChange, initialValues, onSubmit }: Props) {
  const [values, setValues] = useState<ManualOperationValues>(initialValues ?? EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues(initialValues ?? EMPTY);
      setError(null);
    }
  }, [open, initialValues]);

  const handleSubmit = () => {
    const title = values.title.trim();
    if (!title) return setError('Título obrigatório.');
    if (title.length > 255) return setError('Título deve ter no máximo 255 caracteres.');
    if (values.required_employees !== '') {
      const required = Number(values.required_employees);
      if (!Number.isInteger(required) || required < 0) {
        return setError('Quantidade recomendada deve ser um número inteiro igual ou maior que zero.');
      }
    }
    onSubmit({ ...values, title });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialValues ? 'Editar operação manual' : 'Adicionar operação manual'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manual-title">Título *</Label>
            <Input
              id="manual-title"
              maxLength={255}
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-description">Descrição</Label>
            <Textarea
              id="manual-description"
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-required">Quantidade recomendada de funcionários</Label>
            <Input
              id="manual-required"
              type="number"
              min={0}
              step={1}
              value={values.required_employees}
              onChange={(e) => setValues((v) => ({ ...v, required_employees: e.target.value }))}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Salvar operação</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
