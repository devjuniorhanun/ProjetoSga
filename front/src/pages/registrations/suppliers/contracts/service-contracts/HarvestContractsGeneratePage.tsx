import { ServiceContractBatchPage } from './ServiceContractBatchPage';

export default function HarvestContractsGeneratePage() {
  return (
    <ServiceContractBatchPage
      contractType="HARVEST"
      title="Gerar contratos de colhedores"
      description="Gera um contrato por produtor da safra, incluindo automaticamente todas as frentes de colheita ativas."
      supplierLabel="Colhedor"
      participantsLabel="Frentes/colhedores incluídos (conferência)"
    />
  );
}
