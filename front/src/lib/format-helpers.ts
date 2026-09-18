// Area mask helpers (format: 00,00)
export function formatAreaDisplay(value: number | string | undefined): string {
  if (value === undefined || value === '' || value === null) return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseAreaValue(display: string): number {
  const cleaned = display.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function handleAreaMaskChange(
  e: React.ChangeEvent<HTMLInputElement>,
  setDisplay: (v: string) => void,
  setFormValue: (v: number) => void
) {
  const raw = e.target.value.replace(/[^\d]/g, '');
  if (!raw) {
    setDisplay('');
    setFormValue(0);
    return;
  }
  const cents = parseInt(raw);
  const value = cents / 100;
  const display = value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  setDisplay(display);
  setFormValue(value);
}

// Currency (BRL) mask helpers
export function formatCurrencyBRL(value: number | string | undefined): string {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function parseCurrencyBRL(display: string): number {
  const cleaned = display.replace(/[^\d,-]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function handleCurrencyMaskChange(
  e: React.ChangeEvent<HTMLInputElement>,
  setDisplay: (v: string) => void,
  setFormValue: (v: number) => void
) {
  const raw = e.target.value.replace(/[^\d]/g, '');
  if (!raw) {
    setDisplay('');
    setFormValue(0);
    return;
  }
  const value = parseInt(raw, 10) / 100;
  setDisplay(value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
  setFormValue(value);
}

// CPF/CNPJ mask helpers

export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function formatCpfCnpj(value: string, type: 'F' | 'J' | undefined): string {
  if (type === 'F') return formatCPF(value);
  if (type === 'J') return formatCNPJ(value);
  return value;
}

export function formatNumberBR(value: number | string | undefined): string {
  if (value === undefined || value === null || value === '') return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Thousand + 3-decimal mask helpers (format: 1.234,567)
export function formatThousandDecimal3(value: number | string | undefined): string {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

export function parseThousandDecimal3(display: string): number {
  const cleaned = display.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function handleThousandDecimal3MaskChange(
  e: React.ChangeEvent<HTMLInputElement>,
  setDisplay: (v: string) => void,
  setFormValue: (v: number) => void
) {
  const raw = e.target.value.replace(/[^\d]/g, '');
  if (!raw) {
    setDisplay('');
    setFormValue(0);
    return;
  }
  const value = parseInt(raw, 10) / 1000;
  setDisplay(value.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }));
  setFormValue(value);
}

// Thousand-only mask helpers (format: 1.234)
export function formatThousand(value: number | string | undefined): string {
  if (value === undefined || value === null || value === '') return '';
  let num: number;
  if (typeof value === 'string') {
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    num = parseFloat(cleaned);
  } else {
    num = value;
  }
  if (isNaN(num)) return '';
  return Math.trunc(num).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function parseThousand(display: string): number {
  const cleaned = display.replace(/\./g, '').replace(/,/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

export function handleThousandMaskChange(
  e: React.ChangeEvent<HTMLInputElement>,
  setDisplay: (v: string) => void,
  setFormValue: (v: number) => void
) {
  const raw = e.target.value.replace(/[^\d]/g, '');
  if (!raw) {
    setDisplay('');
    setFormValue(0);
    return;
  }
  const value = parseInt(raw, 10);
  setDisplay(value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
  setFormValue(value);
}

// Mercosul plate mask: ABC1D23
export function formatPlateMercosul(value: string): string {
  const raw = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7);
  if (raw.length <= 3) return raw.replace(/[^A-Z]/g, '');
  let result = raw.slice(0, 3).replace(/[^A-Z]/g, '');
  if (raw.length > 3) result += raw[3].replace(/[^0-9]/g, '');
  if (raw.length > 4) result += raw[4].replace(/[^A-Z0-9]/g, '');
  if (raw.length > 5) result += raw.slice(5, 7).replace(/[^0-9]/g, '');
  return result;
}
