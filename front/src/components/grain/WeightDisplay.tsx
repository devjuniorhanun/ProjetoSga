import { formatDateTimeBR, formatWeight, readingAgeSeconds, MAX_READING_AGE_SECONDS } from '@/lib/grain-format';
import type { GrainScaleReading } from '@/types/grain';
import { Wifi, WifiOff } from 'lucide-react';

interface Props {
  reading: GrainScaleReading | null;
  now?: number;
  compact?: boolean;
}

/** Peso atual em destaque, com estabilidade, horário e estado de comunicação. */
export function WeightDisplay({ reading, now = Date.now(), compact = false }: Props) {
  const age = readingAgeSeconds(reading?.read_at, now);
  const offline = !reading || age > MAX_READING_AGE_SECONDS;
  const stable = !!reading?.stable && !offline;

  return (
    <div className="rounded-xl border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">Peso atual</p>
      <p
        className={`font-mono font-bold tabular-nums ${compact ? 'text-5xl' : 'text-7xl'} ${
          offline ? 'text-muted-foreground' : 'text-foreground'
        }`}
        aria-live="polite"
      >
        {reading ? formatWeight(reading.weight) : '—'}
        <span className="ml-2 text-2xl font-medium text-muted-foreground">kg</span>
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
        {offline ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 font-medium text-destructive">
            <WifiOff className="h-4 w-4" /> Sem comunicação
          </span>
        ) : stable ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 font-medium text-success">
            <Wifi className="h-4 w-4" /> Estável
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1 font-medium text-warning">
            <Wifi className="h-4 w-4" /> Instável
          </span>
        )}
        <span className="text-muted-foreground">
          Leitura: {reading ? formatDateTimeBR(reading.read_at) : '-'}
        </span>
      </div>
    </div>
  );
}
