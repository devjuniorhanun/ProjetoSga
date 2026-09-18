import GrainOperationPage from './GrainOperationPage';

export default function GrainReceivingPage() {
  return (
    <GrainOperationPage
      operationType="ENTRY"
      title="Recebimento de Grãos"
      description="Entrada de grãos: 1ª pesagem (bruto), descontos, 2ª pesagem (tara) e fechamento"
    />
  );
}
