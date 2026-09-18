import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { applyApiErrors, getApiValidationErrors } from '@/lib/form-errors';
import { grainDiscountTypesService, grainTicketsService } from '@/lib/api-services-grain';
import { formatWeightKg } from '@/lib/grain-format';
import { WeightInput } from './WeightInput';
import { PercentageInput } from './PercentageInput';
import type { GrainTicket } from '@/types/grain';

interface Props {
  ticket: GrainTicket;
  onSaved: () => void;
  readOnly?: boolean;
}

interface Row {
  grain_discount_type_id: string;
  name: string;
  percentage: number;
  discount_weight: number | null;
  justification: string;
  affects_commercial_weight: boolean;
}

/** Todos os tipos de desconto ativos da cultura, na ordem de exibição. */
export function DiscountGrid({ ticket, onSaved, readOnly = false }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['grain-discount-types', ticket.culture_id],
    queryFn: () =>
      grainDiscountTypesService.getAll({ culture_id: ticket.culture_id, status: 'A', per_page: 100 }),
    enabled: !!ticket.culture_id,
  });

  useEffect(() => {
    if (!types.length) return;
    const existing = new Map((ticket.discounts ?? []).map((d) => [String(d.grain_discount_type_id), d]));
    setRows(
      [...types]
        .sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0))
        .map((t) => {
          const current = existing.get(t.id);
          return {
            grain_discount_type_id: t.id,
            name: t.name,
            percentage: Number(current?.percentage ?? 0),
            discount_weight: current?.discount_weight ?? null,
            justification: current?.justification ?? '',
            affects_commercial_weight: !!t.affects_commercial_weight,
          };
        }),
    );
  }, [types, ticket.discounts]);

  const totalWeight = useMemo(
    () => rows.reduce((sum, r) => sum + (r.affects_commercial_weight ? Number(r.discount_weight ?? 0) : 0), 0),
    [rows],
  );

  const update = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.grain_discount_type_id === id ? { ...r, ...patch } : r)));
    setErrors({});
  };

  const save = async () => {
    const next: Record<string, string> = {};
    rows.forEach((r, index) => {
      if (r.percentage > 0 && (r.discount_weight === null || r.discount_weight <= 0)) {
        next[`discounts.${index}.discount_weight`] = 'Informe o peso descontado.';
      }
      if (r.percentage < 0 || r.percentage > 100) {
        next[`discounts.${index}.percentage`] = 'O percentual deve estar entre 0 e 100.';
      }
    });
    const net = Number(ticket.net_weight ?? 0);
    if (net > 0 && totalWeight >= net) {
      toast.error('O total de descontos deve ser menor que o peso líquido.');
      return;
    }
    if (Object.keys(next).length) {
      setErrors(next);
      toast.error('Verifique os campos destacados.');
      return;
    }

    setSaving(true);
    try {
      await grainTicketsService.saveDiscounts(ticket.id, {
        discounts: rows.map((r) => ({
          grain_discount_type_id: r.grain_discount_type_id,
          percentage: Number(r.percentage ?? 0),
          discount_weight: r.discount_weight ?? null,
          justification: r.justification.trim() || null,
        })),
        authorization_request_id: null,
      });
      toast.success('Descontos salvos.');
      onSaved();
    } catch (error) {
      const apiErrors = getApiValidationErrors(error);
      if (apiErrors) {
        const mapped: Record<string, string> = {};
        Object.entries(apiErrors).forEach(([field, message]) => {
          mapped[field] = Array.isArray(message) ? message.join(' ') : String(message);
        });
        setErrors(mapped);
      }
      applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível salvar os descontos.' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!rows.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum tipo de desconto ativo configurado para esta cultura.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo de desconto</TableHead>
            <TableHead className="w-40">Percentual</TableHead>
            <TableHead className="w-48">Peso descontado (kg)</TableHead>
            <TableHead>Justificativa</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.grain_discount_type_id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>
                <PercentageInput
                  aria-label={`Percentual ${row.name}`}
                  value={row.percentage}
                  disabled={readOnly}
                  onChange={(v) => update(row.grain_discount_type_id, { percentage: v })}
                />
                {errors[`discounts.${index}.percentage`] && (
                  <p className="mt-1 text-xs text-destructive">{errors[`discounts.${index}.percentage`]}</p>
                )}
              </TableCell>
              <TableCell>
                <WeightInput
                  aria-label={`Peso descontado ${row.name}`}
                  value={row.discount_weight ?? 0}
                  disabled={readOnly}
                  onChange={(v) => update(row.grain_discount_type_id, { discount_weight: v })}
                />
                {errors[`discounts.${index}.discount_weight`] && (
                  <p className="mt-1 text-xs text-destructive">{errors[`discounts.${index}.discount_weight`]}</p>
                )}
              </TableCell>
              <TableCell>
                <Input
                  value={row.justification}
                  disabled={readOnly}
                  onChange={(e) => update(row.grain_discount_type_id, { justification: e.target.value })}
                  placeholder="Opcional"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <Label className="text-muted-foreground">Total descontado do peso comercial</Label>
          <p className="text-lg font-semibold">{formatWeightKg(totalWeight)}</p>
        </div>
        {!readOnly && (
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar descontos
          </Button>
        )}
      </div>
    </div>
  );
}
