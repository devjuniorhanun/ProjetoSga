import { ServiceContractBatchPage } from './ServiceContractBatchPage';

export default function TransportContractsGeneratePage() {
  return (
    <ServiceContractBatchPage
      contractType="TRANSPORT"
      title="Gerar contratos de transportadores"
      description="Gera um contrato por produtor da safra, incluindo automaticamente todos os motoristas ativos."
      supplierLabel="Transportador"
      participantsLabel="Motoristas incluídos (conferência)"
    />
  );
}
