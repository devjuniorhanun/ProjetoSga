import { useDraggable } from '@dnd-kit/core';
import { GripVertical, MoveRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { WorkforceEmployee } from '@/types/workforce';

interface MoveTarget {
  key: string | null;
  label: string;
}

interface Props {
  employee: WorkforceEmployee;
  containerKey: string;
  targets: MoveTarget[];
  onMove: (employeeId: string, targetKey: string | null) => void;
  disabled?: boolean;
}

export function EmployeeChip({ employee, containerKey, targets, onMove, disabled }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `employee:${employee.id}`,
    data: { employeeId: String(employee.id), from: containerKey },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex items-center gap-2 rounded-md border bg-card px-2 py-1.5 text-sm',
        isDragging && 'opacity-50',
      )}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground disabled:cursor-not-allowed"
        aria-label={`Arrastar ${employee.name}`}
        disabled={disabled}
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium leading-tight">{employee.name}</p>
        {employee.fantasy_name && (
          <p className="truncate text-xs text-muted-foreground">{employee.fantasy_name}</p>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={disabled}
            aria-label={`Mover ${employee.name} para...`}
          >
            <MoveRight className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-72 w-56 overflow-y-auto bg-popover">
          <DropdownMenuLabel>Mover para...</DropdownMenuLabel>
          {targets
            .filter((target) => target.key !== containerKey)
            .map((target) => (
              <DropdownMenuItem
                key={target.key ?? 'available'}
                onSelect={() => onMove(String(employee.id), target.key)}
              >
                {target.label}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
