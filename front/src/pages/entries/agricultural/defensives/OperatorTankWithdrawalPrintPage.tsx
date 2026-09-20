import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { agriculturalServicesDefensiveService } from '@/lib/api-services/agricultural-services-defensive';
import { formatQuantity } from '@/lib/tank-withdrawal-rules';
import { formatDate } from '@/lib/utils';

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? formatDate(value) : parsed.toLocaleString('pt-BR');
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border-b border-dashed border-slate-300 py-1.5">
      <span className="text-slate-600">{label}: </span>
      <strong>{value || '-'}</strong>
    </div>
  );
}

export default function OperatorTankWithdrawalPrintPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: withdrawal, isLoading, isError } = useQuery({
    queryKey: ['tank-withdrawal', id],
    queryFn: () => agriculturalServicesDefensiveService.getTankWithdrawal(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !withdrawal) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">Não foi possível carregar a retirada para impressão.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="tank-withdrawal-print-page space-y-4">
      <div className="tank-withdrawal-print-actions flex items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir
        </Button>
      </div>

      <article className="tank-withdrawal-print-document mx-auto max-w-[210mm] bg-white p-8 text-slate-950 shadow-sm print:shadow-none">
        <header className="mb-6 border-b-2 border-slate-900 pb-4 text-center">
          <h1 className="text-xl font-bold uppercase">Retirada do Tanque do Operador</h1>
          <p className="mt-1 text-sm">Comprovante nº {withdrawal.withdrawal_number}</p>
        </header>

        <section className="grid grid-cols-2 gap-x-8 text-sm">
          <Info label="Safra" value={withdrawal.crop_name} />
          <Info label="Tanqueiro" value={withdrawal.operator_name} />
          <Info label="Data de corte" value={withdrawal.cutoff_date ? formatDate(withdrawal.cutoff_date) : '-'} />
          <Info label="Data/hora da retirada" value={formatDateTime(withdrawal.occurred_at)} />
          <Info label="Responsável" value={withdrawal.created_by_name} />
          <Info label="Status" value={withdrawal.status} />
        </section>

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold uppercase">Produtos retirados</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border border-slate-900 p-1.5 text-left">Produto</th>
                <th className="border border-slate-900 p-1.5 text-left">Unidade</th>
                <th className="border border-slate-900 p-1.5 text-right">Quantidade</th>
                <th className="border border-slate-900 p-1.5 text-right">Estoque antes</th>
                <th className="border border-slate-900 p-1.5 text-right">Estoque depois</th>
                <th className="border border-slate-900 p-1.5 text-right">Tanque antes</th>
                <th className="border border-slate-900 p-1.5 text-right">Tanque depois</th>
              </tr>
            </thead>
            <tbody>
              {(withdrawal.items ?? []).map((item) => (
                <tr key={String(item.id)}>
                  <td className="border border-slate-900 p-1.5">{item.product_name}</td>
                  <td className="border border-slate-900 p-1.5">{item.unit ?? '-'}</td>
                  <td className="border border-slate-900 p-1.5 text-right">{formatQuantity(item.quantity)}</td>
                  <td className="border border-slate-900 p-1.5 text-right">{formatQuantity(item.stock_before)}</td>
                  <td className="border border-slate-900 p-1.5 text-right">{formatQuantity(item.stock_after)}</td>
                  <td className="border border-slate-900 p-1.5 text-right">{formatQuantity(item.tank_balance_before)}</td>
                  <td className="border border-slate-900 p-1.5 text-right">{formatQuantity(item.tank_balance_after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-6 text-sm">
          <p className="font-bold">Observações</p>
          <div className="mt-1 min-h-16 rounded border border-slate-900 p-2">
            {withdrawal.observation || 'Sem observações.'}
          </div>
        </section>

        <section className="mt-16 grid grid-cols-2 gap-16 text-center text-xs">
          <div className="border-t border-slate-900 pt-2">Responsável pela retirada</div>
          <div className="border-t border-slate-900 pt-2">Tanqueiro</div>
        </section>
      </article>
    </div>
  );
}
