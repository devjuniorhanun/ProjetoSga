import GrainOperationPage from './GrainOperationPage';

export default function GrainShippingPage() {
  return (
    <GrainOperationPage
      operationType="EXIT"
      title="Expedição de Grãos"
      description="Saída de grãos: 1ª pesagem (tara), 2ª pesagem (bruto) e alocação em contratos"
    />
  );
}
