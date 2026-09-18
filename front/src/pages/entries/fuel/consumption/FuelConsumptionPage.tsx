import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { DataTable } from '@/components/DataTable';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FuelConsumptionRow, fuelConsumptionService } from '@/lib/api-services-fuel-phase6';
import { useFuelOptions } from '../useFuelOptions';
import { consumptionIndex } from '@/lib/fuel-rules';

const num = (v?: number) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt = (v?: number) => num(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function FuelConsumptionPage() {
  const { stationOptions, productOptions, fleetOptions } = useFuelOptions();
  const [filters, setFilters] = useState({ station_id: '', product_id: '', fleet_id: '', start_date: '', end_date: '' });
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));

  const { data = [], isLoading } = useQuery({
    queryKey: ['fuel-consumption', params],
    queryFn: () => fuelConsumptionService.get(params),
  });

  const set = (key: keyof typeof filters, value: string) => setFilters((f) => ({ ...f, [key]: value }));

  const totals = useMemo(() => ({
    liters: data.reduce((acc, r) => acc + num(r.liters), 0),
    hours: data.reduce((acc, r) => acc + num(r.worked_hours), 0),
    km: data.reduce((acc, r) => acc + num(r.traveled_km), 0),
  }), [data]);

  const chartData = data
    .filter((r) => r.fleet_name)
    .map((r) => ({ name: r.fleet_name as string, litros: num(r.liters) }))
    .slice(0, 15);

  const rows = data.map((row, index) => ({ ...row, id: String(index) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Consumo</h1>
        <p className="text-muted-foreground mt-1">Consumo de combustível por frota, com médias por hora e por quilômetro</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Filtros</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>Posto</Label>
            <Combobox options={[{ value: '', label: 'Todos' }, ...stationOptions]} value={filters.station_id} onValueChange={(v) => set('station_id', v)} placeholder="Todos" />
          </div>
          <div className="space-y-2">
            <Label>Produto</Label>
            <Combobox options={[{ value: '', label: 'Todos' }, ...productOptions]} value={filters.product_id} onValueChange={(v) => set('product_id', v)} placeholder="Todos" />
          </div>
          <div className="space-y-2">
            <Label>Frota</Label>
            <Combobox options={[{ value: '', label: 'Todas' }, ...fleetOptions]} value={filters.fleet_id} onValueChange={(v) => set('fleet_id', v)} placeholder="Todas" />
          </div>
          <div className="space-y-2">
            <Label>Data inicial</Label>
            <Input type="date" value={filters.start_date} onChange={(e) => set('start_date', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data final</Label>
            <Input type="date" value={filters.end_date} onChange={(e) => set('end_date', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Litros consumidos</CardTitle></CardHeader>
              <CardContent className="text-2xl font-bold">{fmt(totals.liters)}</CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Horas trabalhadas</CardTitle></CardHeader>
              <CardContent className="text-2xl font-bold">{fmt(totals.hours)}</CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Quilômetros percorridos</CardTitle></CardHeader>
              <CardContent className="text-2xl font-bold">{fmt(totals.km)}</CardContent></Card>
          </div>

          {chartData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Litros por frota</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="litros" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <DataTable
            data={rows}
            columns={[
              { key: 'fleet_name', label: 'Frota' },
              { key: 'product_name', label: 'Produto' },
              { key: 'liters', label: 'Litros', render: (i: FuelConsumptionRow) => fmt(i.liters) },
              { key: 'worked_hours', label: 'Horas', render: (i: FuelConsumptionRow) => fmt(i.worked_hours) },
              { key: 'traveled_km', label: 'KM', render: (i: FuelConsumptionRow) => fmt(i.traveled_km) },
              { key: 'liters_per_hour', label: 'L/h', render: (i: FuelConsumptionRow) => {
                if (String(i.marking_type ?? '').toUpperCase() !== 'H') return '-';
                const index = consumptionIndex('H', i.liters, i.worked_hours, i.traveled_km);
                if (!index) return '-';
                return fmt(num(i.liters_per_hour) || index.value);
              } },
              { key: 'liters_per_km', label: 'L/km', render: (i: FuelConsumptionRow) => {
                if (String(i.marking_type ?? '').toUpperCase() !== 'K') return '-';
                const index = consumptionIndex('K', i.liters, i.worked_hours, i.traveled_km);
                if (!index) return '-';
                return fmt(num(i.liters_per_km) || index.value);
              } },
              { key: 'expected_consumption', label: 'Esperado', render: (i: FuelConsumptionRow) => fmt(i.expected_consumption) },
              { key: 'actual_consumption', label: 'Realizado', render: (i: FuelConsumptionRow) => fmt(i.actual_consumption) },
              { key: 'difference', label: 'Diferença', render: (i: FuelConsumptionRow) => fmt(i.difference) },
            ]}
            searchKeys={['fleet_name', 'product_name']}
            searchPlaceholder="Buscar consumo..."
            exportTitle="Consumo de Combustível"
          />
        </>
      )}
    </div>
  );
}
