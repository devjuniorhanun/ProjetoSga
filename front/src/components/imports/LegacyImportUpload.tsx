import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import {
  formatFileSize,
  validateImportSelection,
  MAX_IMPORT_FILES,
} from '@/lib/api-services-imports';

interface LegacyImportUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function LegacyImportUpload({
  files,
  onFilesChange,
  onSubmit,
  isSubmitting = false,
}: LegacyImportUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = '';
  };

  const addFiles = (incoming: FileList | null | undefined) => {
    const list = Array.from(incoming ?? []);
    resetInput();
    if (!list.length) return;

    const existing = new Set(files.map((file) => file.name.toLowerCase()));
    const merged = [...files];
    for (const file of list) {
      if (existing.has(file.name.toLowerCase())) {
        setError(`Arquivo duplicado na seleção: ${file.name}.`);
        return;
      }
      existing.add(file.name.toLowerCase());
      merged.push(file);
    }

    const problem = validateImportSelection(merged);
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    onFilesChange(merged);
  };

  const removeAt = (index: number) => {
    setError(null);
    onFilesChange(files.filter((_, position) => position !== index));
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!isSubmitting) addFiles(e.dataTransfer.files);
          }}
          className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragging ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          <Upload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="font-medium">Arraste os arquivos aqui</p>
            <p className="text-sm text-muted-foreground">
              Formatos aceitos: .csv, .txt ou .zip (até 50 MB cada, no máximo {MAX_IMPORT_FILES} arquivos)
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt,.zip"
            multiple
            className="sr-only"
            aria-label="Selecionar arquivos de importação"
            disabled={isSubmitting}
            onChange={(e) => addFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => inputRef.current?.click()}
          >
            Selecionar arquivos
          </Button>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">{error}</p>
        )}

        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {files.length} arquivo{files.length > 1 ? 's' : ''} selecionado{files.length > 1 ? 's' : ''}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isSubmitting}
                onClick={() => { setError(null); onFilesChange([]); resetInput(); }}
              >
                Limpar seleção
              </Button>
            </div>

            <ul className="space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remover ${file.name}`}
                    title="Remover arquivo"
                    disabled={isSubmitting}
                    onClick={() => removeAt(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>

            <div className="flex justify-end">
              <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Enviando e processando...' : 'Enviar arquivos'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
