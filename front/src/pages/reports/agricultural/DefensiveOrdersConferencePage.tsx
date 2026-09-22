import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer } from 'lucide-react';
import { defensiveReportsService } from '@/lib/api-services-reports-defensive';
import { formatDate } from '@/lib/utils';

const statusLabels: Record<string, string> = { A: 'Aberta', F: 'Finalizada', I: 'Inativa' };
const number = (value: number | null | undefined) => value == null ? '-' : Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 3 });

export default function DefensiveOrdersConferencePage() {
  const navigate = useNavigate();
  const [cropId, setCropId] = useState('');
  const [operationId, setOperationId] = useState('');
  const [fieldId, setFieldId] = useState('');

  const { data: baseOptions } = useQuery({ queryKey: ['defensive-report-options'], queryFn: () => defensiveReportsService.options() });
  const { data: operationOptions } = useQuery({
    queryKey: ['defensive-report-options', cropId],
    queryFn: () => defensiveReportsService.options(cropId),
    enabled: !!cropId,
  });
  const { data: fieldOptions } = useQuery({
    queryKey: ['defensive-report-options', cropId, operationId],
    queryFn: () => defensiveReportsService.options(cropId, operationId),
    enabled: !!cropId && !!operationId,
  });
  const { data: report, isFetching } = useQuery({
    queryKey: ['defensive-orders-conference', cropId, operationId, fieldId],
    queryFn: () => defensiveReportsService.orders(cropId, operationId, fieldId),
    enabled: !!cropId && !!operationId && !!fieldId,
  });

  return (
    <div className="space-y-6">
      <style>{`@media print { body * { visibility: hidden !important; } .defensive-print, .defensive-print * { visibility: visible !important; } .defensive-print { position: absolute; inset: 0; width: 100%; } .print-hide { display: none !important; } }`}</style>
      <div className="print-hide flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conferência de Ordens de Serviços Defensivos</h1>
          <p className="text-muted-foreground">Consulte todas as ordens realizadas no talhão para uma operação.</p>
        </div>
        <Button variant="outline" disabled={!report} onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
      </div>

      <Card className="print-hide"><CardContent className="grid grid-cols-3 gap-4 pt-6">
        <Select value={cropId} onValueChange={(value) => { setCropId(value); setOperationId(''); setFieldId(''); }}><SelectTrigger><SelectValue placeholder="Selecione a safra" /></SelectTrigger><SelectContent>{baseOptions?.crops.map((item) => <SelectItem key={String(item.id)} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select>
        <Select value={operationId} disabled={!cropId} onValueChange={(value) => { setOperationId(value); setFieldId(''); }}><SelectTrigger><SelectValue placeholder="Selecione o tipo de operação" /></SelectTrigger><SelectContent>{operationOptions?.operations.map((item) => <SelectItem key={String(item.id)} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select>
        <Select value={fieldId} disabled={!operationId} onValueChange={setFieldId}><SelectTrigger><SelectValue placeholder="Selecione o talhão" /></SelectTrigger><SelectContent>{fieldOptions?.fields.map((item) => <SelectItem key={String(item.id)} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select>
      </CardContent></Card>

      {isFetching && <p className="text-muted-foreground">Carregando relatório...</p>}
      {report && <div className="defensive-print space-y-5">
        <div className="text-center"><h2 className="text-xl font-bold">Conferência de Ordens de Serviços Defensivos</h2><p>{report.crop.name} • {report.operation.name} • {report.field.name}</p><p>Área real: {number(report.field.real_area)} ha • Área considerada: {number(report.considered_area)} ha</p></div>

        <Card><CardHeader><CardTitle>Ordens do talhão</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>O.S.</TableHead><TableHead>Data</TableHead><TableHead>Cultura</TableHead><TableHead>Área</TableHead><TableHead>Bombas recomendadas</TableHead><TableHead>Bombas utilizadas</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{report.orders.map((order) => <TableRow key={String(order.id)} className="cursor-pointer print:cursor-default" onClick={() => navigate(`/entries/agricultural/defensives/order/${order.id}`)}><TableCell className="font-medium">{order.os_number}</TableCell><TableCell>{formatDate(order.application_date)}</TableCell><TableCell>{order.culture_name || '-'}</TableCell><TableCell>{number(order.area)}</TableCell><TableCell>{number(order.recommended_pump)}</TableCell><TableCell>{number(order.used_bomb)}</TableCell><TableCell>{statusLabels[order.status] ?? order.status}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>

        {report.orders.map((order) => <Card key={String(order.id)}><CardHeader><CardTitle>O.S. {order.os_number} — {formatDate(order.application_date)}</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-3 gap-2 text-sm"><span>Safra: {order.crop_name}</span><span>Cultura: {order.culture_name || '-'}</span><span>Talhão: {order.field_name}</span><span>Operação: {order.operation_name}</span><span>Área: {number(order.area)} ha</span><span>Status: {statusLabels[order.status] ?? order.status}</span><span>Bombas recomendadas: {number(order.recommended_pump)}</span><span>Bombas utilizadas: {number(order.used_bomb)}</span><span>Operadores: {order.operators.map((operator) => operator.name).filter(Boolean).join(', ') || '-'}</span><span>Frotas: {order.operators.map((operator) => operator.fleet).filter(Boolean).join(', ') || '-'}</span></div><Table><TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Quantidade recomendada</TableHead><TableHead>Quantidade usada</TableHead><TableHead>Usado por área</TableHead></TableRow></TableHeader><TableBody>{order.products.map((product) => <TableRow key={String(product.product_id)}><TableCell>{product.product_name}</TableCell><TableCell>{number(product.recommended_quantity)}</TableCell><TableCell>{number(product.used_quantity)}</TableCell><TableCell>{number(product.used_per_area)}</TableCell></TableRow>)}</TableBody></Table>{order.observation && <p className="text-sm">Observações: {order.observation}</p>}</CardContent></Card>)}

        <Card><CardHeader><CardTitle>Consolidado dos produtos</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Quantidade recomendada</TableHead><TableHead>Quantidade usada</TableHead><TableHead>Quantidade usada / área</TableHead></TableRow></TableHeader><TableBody>{report.products.map((product) => <TableRow key={String(product.product_id)}><TableCell>{product.product_name}</TableCell><TableCell>{number(product.recommended_quantity)}</TableCell><TableCell>{number(product.used_quantity)}</TableCell><TableCell>{number(product.used_per_area)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
        <div className="pt-16 text-center"><div className="mx-auto w-80 border-t border-black pt-2">Assinatura do responsável</div></div>
      </div>}
    </div>
  );
}
