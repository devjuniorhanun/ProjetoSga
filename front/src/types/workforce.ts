/** Quadro diário de funcionários por operação agrícola. */

export type WorkforceBoardStatus = 'A' | 'F' | 'C';

export type WorkforceOperationSource = 'MANUAL' | 'GENERAL' | 'DEFENSIVE';

export type WorkforceHistoryAction = 'ALLOCATED' | 'MOVED' | 'REMOVED' | 'REORDERED';

export interface WorkforceBoard {
  id: string;
  work_date: string;
  version: number;
  notes?: string | null;
  status: WorkforceBoardStatus;
}

export interface WorkforceEmployee {
  id: string;
  name: string;
  fantasy_name?: string | null;
}

export interface WorkforceOperation {
  id: string | null;
  source_type: WorkforceOperationSource;
  source_id: string | null;
  agricultural_service_type_id?: string | null;
  title: string;
  description?: string | null;
  required_employees?: number | null;
  display_order: number;
  employee_ids: string[];
}

export interface WorkforceServiceSuggestion {
  source_type: 'GENERAL' | 'DEFENSIVE';
  source_id: string;
  title: string;
  description?: string | null;
  agricultural_service_type_id?: string | null;
  required_employees?: number | null;
}

export interface WorkforceWorkspace {
  board: WorkforceBoard | null;
  available_employees: WorkforceEmployee[];
  operations: WorkforceOperation[];
  service_suggestions: WorkforceServiceSuggestion[];
}

export interface WorkforceHistoryEntry {
  id: string;
  employee_id?: string | null;
  employee_name?: string | null;
  action: WorkforceHistoryAction;
  from_operation_title?: string | null;
  to_operation_title?: string | null;
  user_name?: string | null;
  created_at: string;
  version?: number | null;
}

export interface WorkforceOperationPayload {
  id: string | null;
  source_type: WorkforceOperationSource;
  source_id: string | null;
  agricultural_service_type_id: string | null;
  title: string;
  description: string | null;
  required_employees: number | null;
  display_order: number;
  employee_ids: string[];
}

export interface WorkforceWorkspacePayload {
  version: number;
  notes: string | null;
  operations: WorkforceOperationPayload[];
}

/** Operação no estado local: recebe uma chave estável independente do id da API. */
export interface LocalWorkforceOperation extends WorkforceOperation {
  key: string;
}
