import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  isLoading?: boolean;
  error?: unknown;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
}

/** Estados de carregamento, erro recuperável e vazio das telas de relatório. */
export function ReportStateMessage({ isLoading, error, isEmpty, emptyMessage, onRetry }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Carregando...
      </div>
    );
  }

  if (error) {
    const response = (error as { response?: { status?: number; data?: { message?: string } } })
      .response;
    const message =
      response?.status === 403
        ? 'Você não tem permissão para consultar este relatório.'
        : response?.data?.message ?? 'Não foi possível carregar o relatório.';
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erro na consulta</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-2">
          <span>{message}</span>
          {onRetry && (
            <Button type="button" size="sm" variant="outline" onClick={onRetry}>
              Tentar novamente
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isEmpty) {
    return (
      <p className="py-10 text-center text-muted-foreground">
        {emptyMessage ?? 'Nenhum resultado para os filtros informados.'}
      </p>
    );
  }

  return null;
}
