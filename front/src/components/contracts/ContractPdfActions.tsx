import { useState } from 'react';
import { toast } from 'sonner';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  MAX_CONTRACT_PDF_BYTES,
  serviceContractsService,
} from '@/lib/api-services-service-contracts';
import { buildServiceContractPdf, contractPdfFileName } from '@/lib/contract-pdf';
import { openPdfBlob } from '@/lib/report-download';
import type { ServiceContractType } from '@/types/service-contracts';

interface Props {
  contractId: string;
  contractNumber: string;
  contractType: ServiceContractType;
  hasPdf?: boolean;
  onGenerated?: () => void;
}

function apiMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { status?: number; data?: { message?: string } } })
    .response;
  if (response?.status === 404) return 'Registro não encontrado.';
  if (response?.status === 403) return 'Você não tem permissão para esta ação.';
  return response?.data?.message ?? fallback;
}

/** Gera o PDF a partir do snapshot da API, envia ao backend e permite baixar. */
export function ContractPdfActions({
  contractId,
  contractNumber,
  contractType,
  hasPdf,
  onGenerated,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const data = await serviceContractsService.getPdfData(contractType, contractId);
      const blob = await buildServiceContractPdf(contractType, data);
      if (blob.size > MAX_CONTRACT_PDF_BYTES) {
        toast.error('O PDF gerado ultrapassa o limite de 10 MB.');
        return;
      }
      const fileName = contractPdfFileName(contractNumber || contractId, contractType);
      await serviceContractsService.uploadPdf(contractType, contractId, blob, fileName);
      openPdfBlob(blob, fileName);
      toast.success('PDF gerado e enviado.');
      onGenerated?.();
    } catch (error) {
      toast.error(apiMessage(error, 'Não foi possível gerar o PDF do contrato.'));
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await serviceContractsService.downloadPdf(contractType, contractId);
      openPdfBlob(blob, contractPdfFileName(contractNumber || contractId, contractType));
    } catch (error) {
      toast.error(apiMessage(error, 'Não foi possível baixar o PDF do contrato.'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleGenerate}
        disabled={generating}
        title={hasPdf ? 'Gerar PDF novamente' : 'Gerar PDF'}
      >
        {generating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        {hasPdf ? 'Gerar novamente' : 'Gerar PDF'}
      </Button>
      {hasPdf && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
          title="Baixar PDF"
        >
          {downloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Baixar
        </Button>
      )}
    </div>
  );
}
