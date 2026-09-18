const UNITS = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const TEENS = [
  'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove',
];
const TENS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const HUNDREDS = [
  '', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos',
  'seiscentos', 'setecentos', 'oitocentos', 'novecentos',
];

function belowThousand(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cem';
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) parts.push(HUNDREDS[h]);
  if (rest) {
    if (rest < 10) parts.push(UNITS[rest]);
    else if (rest < 20) parts.push(TEENS[rest - 10]);
    else {
      const t = Math.floor(rest / 10);
      const u = rest % 10;
      parts.push(u ? `${TENS[t]} e ${UNITS[u]}` : TENS[t]);
    }
  }
  return parts.join(' e ');
}

const SCALES: Array<[string, string]> = [
  ['mil', 'mil'],
  ['milhão', 'milhões'],
  ['bilhão', 'bilhões'],
  ['trilhão', 'trilhões'],
];

function integerToWords(value: number): string {
  if (value === 0) return 'zero';
  const groups: number[] = [];
  let rest = value;
  while (rest > 0) {
    groups.push(rest % 1000);
    rest = Math.floor(rest / 1000);
  }
  const chunks: string[] = [];
  for (let i = groups.length - 1; i >= 0; i -= 1) {
    const group = groups[i];
    if (!group) continue;
    if (i === 0) {
      chunks.push(belowThousand(group));
    } else if (i === 1) {
      chunks.push(group === 1 ? 'mil' : `${belowThousand(group)} mil`);
    } else {
      const [singular, plural] = SCALES[i - 1];
      chunks.push(`${belowThousand(group)} ${group === 1 ? singular : plural}`);
    }
  }
  if (chunks.length === 1) return chunks[0];
  const last = chunks[chunks.length - 1];
  const head = chunks.slice(0, -1).join(', ');
  const lastValue = groups[0];
  const joiner = lastValue && (lastValue < 100 || lastValue % 100 === 0) ? ' e ' : ', ';
  return `${head}${joiner}${last}`;
}

/** Converte um valor monetário em reais para extenso em português. */
export function numberToWordsPtBr(value: number): string {
  const safe = Number.isFinite(value) ? Math.abs(value) : 0;
  const totalCents = Math.round(safe * 100);
  const reais = Math.floor(totalCents / 100);
  const cents = totalCents % 100;

  const parts: string[] = [];
  if (reais > 0 || cents === 0) {
    parts.push(`${integerToWords(reais)} ${reais === 1 ? 'real' : 'reais'}`);
  }
  if (cents > 0) {
    parts.push(`${integerToWords(cents)} ${cents === 1 ? 'centavo' : 'centavos'}`);
  }
  return parts.join(' e ');
}
