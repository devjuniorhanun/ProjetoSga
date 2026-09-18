import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRoles } from '@/contexts/RolesContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LegacyImportUpload } from '@/components/imports/LegacyImportUpload';
import { LegacyImportSummary } from '@/components/imports/LegacyImportSummary';
import { LegacyImportHistory } from '@/components/imports/LegacyImportHistory';
import { LegacyImportDetails } from '@/components/imports/LegacyImportDetails';
import {
  legacyImportsService,
  LegacyImportBatch,
  validateImportSelection,
} from '@/lib/api-services-imports';
import { CheckCircle2 } from 'lucide-react';

interface ImportFailure {
  message: string;
  batchId?: string | number;
}

function errorPayload(error: unknown) {
  return (
    (error as {
      response?: {
        data?: {
          message?: string;
          batch_id?: string | number;
          report?: { message?: string; exception?: string };
          errors?: Record<string, string[]>;
        };
      };
    })?.response?.data ?? {}
  );
}

/** Prioridade: errors → report.message → message → texto padrão. */
function toFailure(error: unknown): ImportFailure {
  const data = errorPayload(error);
  const firstValidation = Object.values(data.errors ?? {}).flat()[0];
  return {
    message:
      firstValidation ||
      data.report?.message ||
      data.message ||
      'Não foi possível realizar a importação.',
    batchId: data.batch_id,
  };
}

export default function LegacyImportPage() {
  const { hasRole } = useRoles();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<LegacyImportBatch | null>(null);
  const [failure, setFailure] = useState<ImportFailure | null>(null);
  const [detailBatch, setDetailBatch] = useState<string | number | null>(null);

  const importMutation = useMutation({
    mutationFn: (selected: File[]) => legacyImportsService.run(selected),
    onSuccess: (data) => {
      setResult(data);
      setFailure(null);
      setFiles([]);
      toast.success(data.message || 'Importação concluída com sucesso');
      queryClient.invalidateQueries({ queryKey: ['legacy-imports'] });
    },
    onError: (error) => {
      const next = toFailure(error);
      setFailure(next);
      queryClient.invalidateQueries({ queryKey: ['legacy-imports'] });
      toast.error(next.message);
    },
  });

  if (!hasRole('SUPER', 'ADM')) return <Navigate to="/" replace />;

  const isProcessing = importMutation.isPending;
  const warningsCount = result?.summary?.warnings ?? 0;

  const handleSubmit = () => {
    if (isProcessing) return;
    const problem = validateImportSelection(files);
    if (problem) {
      setFailure({ message: problem });
      toast.error(problem);
      return;
    }
    setResult(null);
    setFailure(null);
    importMutation.mutate([...files]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Importação de Dados Legados</h1>
        <p className="mt-1 text-muted-foreground">
          Envie os arquivos do sistema anterior nos formatos ZIP, CSV ou TXT. A ordem dos arquivos
          não importa.
        </p>
      </div>

      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import">Nova importação</TabsTrigger>
          <TabsTrigger value="history">Histórico de Importações</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4 pt-4">
          <LegacyImportUpload
            files={files}
            onFilesChange={(next) => {
              setFiles(next);
              setFailure(null);
            }}
            onSubmit={handleSubmit}
            isSubmitting={isProcessing}
          />

          {isProcessing && (
            <Alert>
              <AlertTitle>Enviando e processando...</AlertTitle>
              <AlertDescription>
                Os dados estão sendo processados. Aguarde a conclusão.
              </AlertDescription>
            </Alert>
          )}

          {failure && !isProcessing && (
            <Alert variant="destructive">
              <AlertTitle>Importação não concluída</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{failure.message}</p>
                {failure.batchId !== undefined && failure.batchId !== null && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailBatch(failure.batchId!)}
                  >
                    Ver detalhes do lote
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {result && !isProcessing && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <AlertTitle>Importação concluída com sucesso</AlertTitle>
                <AlertDescription className="space-y-1">
                  {result.message && <p>{result.message}</p>}
                  {warningsCount > 0 && (
                    <p>
                      {warningsCount} aviso{warningsCount > 1 ? 's' : ''} registrado
                      {warningsCount > 1 ? 's' : ''} durante o processamento.
                    </p>
                  )}
                </AlertDescription>
              </Alert>
              <LegacyImportSummary summary={result.summary} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="pt-4">
          <LegacyImportHistory />
        </TabsContent>
      </Tabs>

      <LegacyImportDetails batch={detailBatch} onOpenChange={() => setDetailBatch(null)} />
    </div>
  );
}
