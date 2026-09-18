import { canPrintTicket } from '@/lib/grain-rules';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { grainTicketsService } from '@/lib/api-services-grain';
import { TicketPrintView } from '@/components/grain/TicketPrintView';

export default function GrainTicketPrintPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['grain-ticket', id],
    queryFn: () => grainTicketsService.getById(id),
    enabled: !!id,
  });

  const printable = canPrintTicket(ticket?.status);

  const { data: printData } = useQuery({
    queryKey: ['grain-ticket-print', id],
    queryFn: () => grainTicketsService.printData(id),
    enabled: !!id && printable,
  });

  useEffect(() => {
    if (ticket && !printable) {
      toast.error('A impressão fica disponível somente após o fechamento do ticket.');
    }
  }, [ticket, printable]);

  if (isLoading || !ticket) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button disabled={!printable} onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir
        </Button>
      </div>

      {printable ? (
        <TicketPrintView ticket={printData?.ticket ?? ticket} />
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          A impressão fica disponível somente após o fechamento do ticket.
        </p>
      )}
    </div>
  );
}
