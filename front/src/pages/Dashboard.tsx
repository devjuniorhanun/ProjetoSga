import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wheat, Sprout, Layers, Calendar, Loader2 } from 'lucide-react';
import { agriculturalYearsService, culturesService, cropsService, varietiesService } from '@/lib/api-services';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = [
  'hsl(142, 60%, 32%)',
  'hsl(42, 80%, 55%)',
  'hsl(35, 50%, 45%)',
  'hsl(180, 40%, 40%)',
  'hsl(20, 60%, 50%)',
];

export default function Dashboard() {
  const { data: crops = [], isLoading: l1 } = useQuery({ queryKey: ['crops'], queryFn: cropsService.getAll });
  const { data: cultures = [], isLoading: l2 } = useQuery({ queryKey: ['cultures'], queryFn: culturesService.getAll });
  const { data: varieties = [], isLoading: l3 } = useQuery({ queryKey: ['varieties'], queryFn: varietiesService.getAll });
  const { data: years = [], isLoading: l4 } = useQuery({ queryKey: ['agricultural-years'], queryFn: agriculturalYearsService.getAll });

  const isLoading = l1 || l2 || l3 || l4;

  const stats = [
    { label: 'Anos Agrícolas', value: years.length, icon: Calendar, color: 'text-primary' },
    { label: 'Safras', value: crops.length, icon: Wheat, color: 'text-primary' },
    { label: 'Culturas', value: cultures.length, icon: Sprout, color: 'text-primary' },
    { label: 'Variedades', value: varieties.length, icon: Layers, color: 'text-primary' },
  ];

  const varietiesByCulture = cultures.map(c => ({
    name: c.name,
    variedades: varieties.filter(v => v.culture_id === c.id).length,
  }));

  const cultureDistribution = cultures.map(c => ({
    name: c.name,
    value: varieties.filter(v => v.culture_id === c.id).length,
  }));

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do sistema agrícola</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="animate-slide-up">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Variedades por Cultura</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={varietiesByCulture}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar dataKey="variedades" fill="hsl(142, 60%, 32%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Culturas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cultureDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {cultureDistribution.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos Registros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {crops.slice(0, 3).map(crop => (
              <div key={crop.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Wheat className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{crop.name}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${crop.status === 'A' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {crop.status === 'A' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
