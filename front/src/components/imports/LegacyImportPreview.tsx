import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LegacyImportSummary } from './LegacyImportSummary';
import { LegacyImportFilesTable } from './LegacyImportFilesTable';
import { LegacyImportRelationships } from './LegacyImportRelationships';
import { LegacyImportWarnings } from './LegacyImportWarnings';
import type { LegacyImportPreview as Preview } from '@/lib/api-services-imports';

interface LegacyImportPreviewProps {
  preview: Preview;
}

export function LegacyImportPreview({ preview }: LegacyImportPreviewProps) {
  const hasFiles = !!preview.files?.length;
  const hasUnsupported = !!preview.unsupported_files?.length;

  return (
    <section className="space-y-4" aria-label="Pré-visualização da Importação">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pré-visualização da Importação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {preview.file_name && (
            <div>
              <p className="text-sm text-muted-foreground">Arquivo</p>
              <p className="font-medium">{preview.file_name}</p>
            </div>
          )}
          {preview.file_type && (
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{preview.file_type}</p>
            </div>
          )}
          {preview.message && (
            <p className="text-sm text-muted-foreground sm:col-span-2">{preview.message}</p>
          )}
        </CardContent>
      </Card>

      <LegacyImportSummary summary={preview.summary} />
      <LegacyImportFilesTable files={preview.files} />

      {!hasFiles && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum arquivo válido foi encontrado no envio.
          </CardContent>
        </Card>
      )}

      {hasUnsupported && (
        <LegacyImportFilesTable
          files={preview.unsupported_files}
          title="Arquivos não suportados"
          variant="unsupported"
        />
      )}

      <LegacyImportRelationships relationships={preview.relationships} />
      <LegacyImportWarnings warnings={preview.warnings} errors={preview.errors} />
    </section>
  );
}
