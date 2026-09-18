import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

interface Props {
  value: number | null | undefined;
  onChange: (value: number) => void;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
}

const toDisplay = (value: number | null | undefined) =>
  value === null || value === undefined || Number.isNaN(value)
    ? ''
    : value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 5 });

/** Campo de percentual pt-BR (até 5 casas decimais), enviado sem o símbolo %. */
export function PercentageInput({ value, onChange, disabled, id, ...rest }: Props) {
  const [display, setDisplay] = useState(() => toDisplay(value));

  useEffect(() => {
    const parsed = parseFloat(display.replace(',', '.'));
    if ((value ?? 0) !== (Number.isFinite(parsed) ? parsed : 0)) setDisplay(toDisplay(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Input
      id={id}
      inputMode="decimal"
      disabled={disabled}
      placeholder="0"
      value={display}
      aria-label={rest['aria-label']}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d,]/g, '');
        const [int, ...decimals] = raw.split(',');
        const normalized = decimals.length ? `${int},${decimals.join('').slice(0, 5)}` : int;
        setDisplay(normalized);
        const parsed = parseFloat(normalized.replace(',', '.'));
        onChange(Number.isFinite(parsed) ? parsed : 0);
      }}
    />
  );
}
