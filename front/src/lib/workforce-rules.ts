import type {
  LocalWorkforceOperation,
  WorkforceEmployee,
  WorkforceHistoryAction,
  WorkforceOperation,
  WorkforceServiceSuggestion,
  WorkforceWorkspacePayload,
} from '@/types/workforce';

export const WORKFORCE_ACTION_LABELS: Record<WorkforceHistoryAction, string> = {
  ALLOCATED: 'Alocado',
  MOVED: 'Movido',
  REMOVED: 'Removido',
  REORDERED: 'Reordenado',
};

export const WORKFORCE_BOARD_STATUS_LABELS: Record<string, string> = {
  A: 'Ativo',
  F: 'Finalizado',
  C: 'Cancelado',
};

export const WORKFORCE_SOURCE_LABELS: Record<string, string> = {
  MANUAL: 'Manual',
  GENERAL: 'Serviço agrícola',
  DEFENSIVE: 'Ordem de defensivo',
};

/** Identificador local estável da coluna de disponíveis. */
export const AVAILABLE_KEY = 'available';

let keyCounter = 0;
export const nextOperationKey = (): string => `op-local-${++keyCounter}`;

/** Converte operações da API em operações locais com chave estável. */
export function toLocalOperations(operations: WorkforceOperation[]): LocalWorkforceOperation[] {
  return [...operations]
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((op, index) => ({
      ...op,
      employee_ids: [...(op.employee_ids ?? [])].map(String),
      display_order: index,
      key: op.id ? `op-${op.id}` : nextOperationKey(),
    }));
}

/** Funcionários que não estão em nenhuma operação. */
export function availableEmployees(
  all: WorkforceEmployee[],
  operations: LocalWorkforceOperation[],
): WorkforceEmployee[] {
  const used = new Set(operations.flatMap((op) => op.employee_ids));
  return all.filter((employee) => !used.has(String(employee.id)));
}

/**
 * Move um funcionário para uma operação (ou de volta para disponíveis quando
 * targetKey é nulo). Garante que ele fique em apenas uma operação.
 */
export function assignEmployee(
  operations: LocalWorkforceOperation[],
  employeeId: string,
  targetKey: string | null,
): LocalWorkforceOperation[] {
  const id = String(employeeId);
  return operations.map((op) => {
    const withoutEmployee = op.employee_ids.filter((current) => current !== id);
    if (op.key === targetKey) {
      return { ...op, employee_ids: [...withoutEmployee, id] };
    }
    return withoutEmployee.length === op.employee_ids.length
      ? op
      : { ...op, employee_ids: withoutEmployee };
  });
}

/** Reordena a operação uma posição para trás/frente, reescrevendo display_order. */
export function moveOperation(
  operations: LocalWorkforceOperation[],
  key: string,
  direction: -1 | 1,
): LocalWorkforceOperation[] {
  const index = operations.findIndex((op) => op.key === key);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= operations.length) return operations;
  const next = [...operations];
  [next[index], next[target]] = [next[target], next[index]];
  return next.map((op, order) => ({ ...op, display_order: order }));
}

/** Reordena movendo a operação `fromKey` para a posição de `toKey`. */
export function reorderOperations(
  operations: LocalWorkforceOperation[],
  fromKey: string,
  toKey: string,
): LocalWorkforceOperation[] {
  const from = operations.findIndex((op) => op.key === fromKey);
  const to = operations.findIndex((op) => op.key === toKey);
  if (from < 0 || to < 0 || from === to) return operations;
  const next = [...operations];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((op, order) => ({ ...op, display_order: order }));
}

/** Indica se a sugestão já está no quadro (source_type + source_id). */
export function isSuggestionAdded(
  operations: LocalWorkforceOperation[],
  suggestion: WorkforceServiceSuggestion,
): boolean {
  return operations.some(
    (op) =>
      op.source_type === suggestion.source_type &&
      op.source_id !== null &&
      String(op.source_id) === String(suggestion.source_id),
  );
}

export function suggestionToOperation(
  suggestion: WorkforceServiceSuggestion,
  displayOrder: number,
): LocalWorkforceOperation {
  return {
    key: nextOperationKey(),
    id: null,
    source_type: suggestion.source_type,
    source_id: String(suggestion.source_id),
    agricultural_service_type_id: suggestion.agricultural_service_type_id ?? null,
    title: suggestion.title,
    description: suggestion.description ?? null,
    required_employees: suggestion.required_employees ?? null,
    display_order: displayOrder,
    employee_ids: [],
  };
}

export function createManualOperation(
  values: { title: string; description?: string | null; required_employees?: number | null },
  displayOrder: number,
): LocalWorkforceOperation {
  return {
    key: nextOperationKey(),
    id: null,
    source_type: 'MANUAL',
    source_id: null,
    agricultural_service_type_id: null,
    title: values.title.trim(),
    description: values.description?.trim() ? values.description.trim() : null,
    required_employees:
      values.required_employees === undefined || values.required_employees === null
        ? null
        : Number(values.required_employees),
    display_order: displayOrder,
    employee_ids: [],
  };
}

/** Cor do indicador de cobertura — apenas recomendação, nunca bloqueio. */
export function coverageVariant(
  allocated: number,
  required?: number | null,
): 'neutral' | 'below' | 'ok' {
  if (required === null || required === undefined || Number(required) <= 0) return 'neutral';
  return allocated < Number(required) ? 'below' : 'ok';
}

export function buildWorkspacePayload(
  version: number,
  notes: string | null,
  operations: LocalWorkforceOperation[],
): WorkforceWorkspacePayload {
  return {
    version,
    notes: notes && notes.trim() ? notes.trim() : null,
    operations: operations.map((op, index) => ({
      id: op.id ?? null,
      source_type: op.source_type,
      source_id: op.source_type === 'MANUAL' ? null : (op.source_id ?? null),
      agricultural_service_type_id: op.agricultural_service_type_id ?? null,
      title: op.title,
      description: op.description ?? null,
      required_employees:
        op.required_employees === null || op.required_employees === undefined
          ? null
          : Number(op.required_employees),
      display_order: index,
      employee_ids: [...op.employee_ids],
    })),
  };
}

/** Assinatura usada para detectar alterações não salvas. */
export function workspaceSignature(
  notes: string | null,
  operations: LocalWorkforceOperation[],
): string {
  return JSON.stringify(buildWorkspacePayload(0, notes, operations));
}
