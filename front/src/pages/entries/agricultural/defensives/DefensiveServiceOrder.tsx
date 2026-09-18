import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AgriculturalDefensiveOrder, defensiveOrdersService } from '@/lib/api-services-entries';
import { configsService } from '@/lib/api-services-admin';
import { exportDefensiveServiceOrderPdf } from '@/lib/defensive-service-order-pdf';
import { buildDefensiveServiceOrderDocument } from '@/lib/defensive-service-order-document';
import { DefensiveServiceOrderDocument } from '@/components/agricultural/defensive/DefensiveServiceOrderDocument';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, ArrowLeft, FileDown, CheckSquare } from 'lucide-react';
import { DefensiveOrderClosingDialog } from './DefensiveOrderClosingDialog';

export default function DefensiveServiceOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showClosing, setShowClosing] = useState(false);
  const generatedAt = useMemo(() => new Date(), [id]);

  const { data: item, isLoading } = useQuery<AgriculturalDefensiveOrder>({
    queryKey: ['defensive-orders', id],
    queryFn: () => defensiveOrdersService.getById(String(id)),
    enabled: !!id,
  });
  const { data: configs } = useQuery({ queryKey: ['configs'], queryFn: configsService.getAll });
  const config = configs?.[0];
  const model = useMemo(
    () => item ? buildDefensiveServiceOrderDocument(item, config, generatedAt) : null,
    [item, config, generatedAt],
  );

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!item || !model) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Ordem de serviço não encontrada.</p>
        <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
      </div>
    );
  }

  return (
    <div className="defensive-order-page space-y-4">
      <div className="defensive-order-actions flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowClosing(true)}><CheckSquare className="mr-2 h-4 w-4" /> Fechar O.S.</Button>
          <Button variant="outline" onClick={() => exportDefensiveServiceOrderPdf(model)}><FileDown className="mr-2 h-4 w-4" /> Gerar PDF</Button>
          <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
        </div>
      </div>

      <div className="defensive-order-sheet-viewport" aria-label="Visualização da ordem de serviço">
        <DefensiveServiceOrderDocument model={model} />
      </div>

      <DefensiveOrderClosingDialog orderId={id ?? null} open={showClosing} onOpenChange={setShowClosing} />
    </div>
  );
}
