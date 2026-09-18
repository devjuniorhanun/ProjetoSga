import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ImageOff, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Config,
  configsService,
  LOGO_ACCEPTED_TYPES,
  LOGO_MAX_BYTES,
} from '@/lib/api-services-admin';

interface Props {
  config: Config;
}

/** Logomarca usada no cabeçalho dos documentos (contratos e recibos). */
export function ConfigLogoCard({ config }: Props) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-configs'] });

  const handleFile = async (file?: File | null) => {
    if (!file || uploading) return;
    if (!LOGO_ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Envie um arquivo PNG, JPG/JPEG ou WEBP.');
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast.error('A logomarca deve ter no máximo 2 MB.');
      return;
    }
    setUploading(true);
    try {
      await configsService.uploadLogo(config.id, file);
      await refresh();
      toast.success('Logomarca atualizada!');
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      toast.error(response?.data?.message ?? 'Não foi possível enviar a logomarca.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    try {
      await configsService.deleteLogo(config.id);
      await refresh();
      toast.success('Logomarca removida.');
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      toast.error(response?.data?.message ?? 'Não foi possível remover a logomarca.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Logomarca dos documentos</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-6">
        <div className="flex h-24 w-40 items-center justify-center rounded-md border bg-muted/40">
          {config.logo_url ? (
            <img
              src={config.logo_url}
              alt="Logomarca configurada para os documentos"
              className="max-h-20 max-w-36 object-contain"
            />
          ) : (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageOff className="h-4 w-4" /> Sem logomarca
            </span>
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {config.logo_url ? 'Substituir logomarca' : 'Enviar logomarca'}
            </Button>
            {config.logo_url && (
              <Button type="button" variant="outline" onClick={handleRemove} disabled={removing}>
                {removing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Remover
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">PNG, JPG/JPEG ou WEBP, até 2 MB.</p>
        </div>
      </CardContent>
    </Card>
  );
}
