import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer } from 'lucide-react';
import { defensiveReportsService } from '@/lib/api-services-reports-defensive';

const number = (value: number | null | undefined) => value == null ? '-' : Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 3 });

export default function DefensiveCropProductsConferencePage() {
  const [cropId, setCropId] = useState('');
  const { data: options } = useQuery({
    queryKey: ['defensive-report-options'],
    queryFn: () => defensiveReportsService.options(),
  });
  const { data: report, isFetching } = useQuery({
    queryKey: ['defensive-crop-products-conference', cropId],
    queryFn: () => defensiveReportsService.totalProducts(cropId),
    enabled: !!cropId,
  });

  return <div className="space-y-6">
    <style>{`@page { size: A4 landscape; margin: 10mm; } @media print { html, body { width: 297mm; min-height: 210mm; } body * { visibility: hidden !important; } .defensive-crop-products-print, .defensive-crop-products-print * { visibility: visible !important; } .defensive-crop-products-print { position: absolute; inset: 0; width: 100%; } .print-hide { display: none !important; } }`}</style>
    <div className="print-hide flex items-center justify-between">
      <div><h1 className="text-2xl font-bold">Conferência Total de Produtos por Safra</h1><p className="text-muted-foreground">Consolide todos os produtos defensivos utilizados em uma safra.</p></div>
      <Button variant="outline" disabled={!report} onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
    </div>
    <Card className="print-hide"><CardContent className="pt-6"><Select value={cropId} onValueChange={setCropId}><SelectTrigger className="max-w-xl"><SelectValue placeholder="Selecione a safra" /></SelectTrigger><SelectContent>{options?.crops.map((item) => <SelectItem key={String(item.id)} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select></CardContent></Card>
    {isFetching && <p className="text-muted-foreground">Carregando relatório...</p>}
    {report && <div className="defensive-crop-products-print space-y-5">
      <div className="text-center"><h2 className="text-xl font-bold">Conferência Total de Produtos por Safra</h2><p>{report.crop.name}</p><p>{report.order_count} ordem(ns) • {report.operation_count} operação(ões) • {report.field_count} talhão(ões) • Área considerada: {number(report.considered_area)} ha</p></div>
      <Card><CardHeader><CardTitle>Total de produtos utilizados</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Quantidade recomendada</TableHead><TableHead>Quantidade usada</TableHead><TableHead>Quantidade usada / área</TableHead></TableRow></TableHeader><TableBody>{report.products.map((product) => <TableRow key={String(product.product_id)}><TableCell>{product.product_name}</TableCell><TableCell>{number(product.recommended_quantity)}</TableCell><TableCell>{number(product.used_quantity)}</TableCell><TableCell>{number(product.used_per_area)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      <div className="pt-16 text-center"><div className="mx-auto w-80 border-t border-black pt-2">Assinatura do responsável</div></div>
    </div>}
  </div>;
}
