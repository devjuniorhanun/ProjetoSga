import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { formatWeight, parseWeightBR } from '@/lib/grain-format';

interface Props {
  value: number | null | undefined;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  /** Permite valores negativos (usado em ajustes de estoque). */
  allowNegative?: boolean;
  'aria-label'?: string;
}

/** Campo de peso com máscara pt-BR (milhar e até 3 decimais). */
export function WeightInput({
  value,
  onChange,
  placeholder = '0,000',
  disabled,
  id,
  allowNegative = false,
  ...rest
}: Props) {
  const [display, setDisplay] = useState(() => (value ? formatWeight(value) : ''));

  useEffect(() => {
    const current = parseWeightBR(display);
    if ((value ?? 0) !== current) setDisplay(value ? formatWeight(value) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Input
      id={id}
      inputMode="decimal"
      disabled={disabled}
      placeholder={placeholder}
      value={display}
      aria-label={rest['aria-label']}
      onChange={(e) => {
        const input = e.target.value;
        const negative = allowNegative && input.trim().startsWith('-');
        const raw = input.replace(/[^\d]/g, '');
        if (!raw) {
          setDisplay(negative ? '-' : '');
          onChange(0);
          return;
        }
        const numeric = (negative ? -1 : 1) * (parseInt(raw, 10) / 1000);
        setDisplay(numeric.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }));
        onChange(numeric);
      }}
    />
  );
}
