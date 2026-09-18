import { useDroppable } from '@dnd-kit/core';
import { ArrowLeft, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmployeeChip } from './EmployeeChip';
import { coverageVariant, WORKFORCE_SOURCE_LABELS } from '@/lib/workforce-rules';
import { cn } from '@/lib/utils';
import type { LocalWorkforceOperation, WorkforceEmployee } from '@/types/workforce';

interface Props {
  operation: LocalWorkforceOperation;
  employees: WorkforceEmployee[];
  targets: { key: string | null; label: string }[];
  error?: string;
  disabled?: boolean;
  onMoveEmployee: (employeeId: string, targetKey: string | null) => void;
  onMoveOperation: (direction: -1 | 1) => void;
  onEdit: () => void;
  onRemove: () => void;
}

export function OperationCard({
  operation,
  employees,
  targets,
  error,
  disabled,
  onMoveEmployee,
  onMoveOperation,
  onEdit,
  onRemove,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `operation:${operation.key}` });
  const allocated = operation.employee_ids.length;
  const variant = coverageVariant(allocated, operation.required_employees);

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        'flex w-full min-w-[260px] flex-col sm:w-[280px]',
        isOver && 'ring-2 ring-primary',
        error && 'border-destructive',
      )}
    >
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">{operation.title}</p>
            <p className="text-xs text-muted-foreground">
              {WORKFORCE_SOURCE_LABELS[operation.source_type] ?? operation.source_type}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              variant === 'below' && 'border-yellow-500 text-yellow-600',
              variant === 'ok' && 'border-green-600 text-green-700',
            )}
          >
            {allocated}
            {operation.required_employees ? `/${operation.required_employees}` : ''} funcionários
          </Badge>
        </div>
        {operation.description && (
          <p className="text-xs text-muted-foreground">{operation.description}</p>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Mover operação para a esquerda"
            disabled={disabled}
            onClick={() => onMoveOperation(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Mover operação para a direita"
            disabled={disabled}
            onClick={() => onMoveOperation(1)}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          {operation.source_type === 'MANUAL' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Editar operação manual"
              disabled={disabled}
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            aria-label="Remover operação do quadro"
            disabled={disabled}
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        {employees.length === 0 ? (
          <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
            Arraste funcionários para cá
          </p>
        ) : (
          employees.map((employee) => (
            <EmployeeChip
              key={employee.id}
              employee={employee}
              containerKey={operation.key}
              targets={targets}
              onMove={onMoveEmployee}
              disabled={disabled}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
