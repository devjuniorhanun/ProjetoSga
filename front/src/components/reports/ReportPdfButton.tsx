import { useState } from 'react';
import { toast } from 'sonner';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onDownload: () => Promise<void>;
  disabled?: boolean;
  label?: string;
}

/** O PDF é sempre gerado pelo backend e baixado como blob autenticado. */
export function ReportPdfButton({ onDownload, disabled, label = 'Gerar PDF' }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onDownload();
    } catch (error: unknown) {
      const response = (error as { response?: { status?: number; data?: { message?: string } } })
        .response;
      if (response?.status === 403) {
        toast.error('Você não tem permissão para gerar este relatório.');
      } else {
        toast.error(response?.data?.message ?? 'Não foi possível gerar o PDF.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="outline" onClick={handleClick} disabled={disabled || loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  );
}
