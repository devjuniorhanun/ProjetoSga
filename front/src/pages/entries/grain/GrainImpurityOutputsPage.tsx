import GrainOperationPage from './GrainOperationPage';

export default function GrainImpurityOutputsPage() {
  return (
    <GrainOperationPage
      operationType="IMPURITY_OUTPUT"
      title="Saídas de Impurezas"
      description="Retirada de impurezas geradas na limpeza, vinculadas aos tickets de entrada"
    />
  );
}
