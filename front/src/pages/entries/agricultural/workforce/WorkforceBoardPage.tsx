import { useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, KeyboardSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { History, Loader2, Plus, RotateCcw, Save } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmployeeChip } from '@/components/workforce/EmployeeChip';
import { OperationCard } from '@/components/workforce/OperationCard';
import { WorkforceHistoryDialog } from '@/components/workforce/WorkforceHistoryDialog';
import {
  ManualOperationDialog,
  type ManualOperationValues,
} from '@/components/workforce/ManualOperationDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { workforceBoardsService } from '@/lib/api-services-workforce';
import {
  assignEmployee,
  availableEmployees,
  buildWorkspacePayload,
  createManualOperation,
  isSuggestionAdded,
  moveOperation,
  suggestionToOperation,
  toLocalOperations,
  WORKFORCE_BOARD_STATUS_LABELS,
  workspaceSignature,
} from '@/lib/workforce-rules';
import { getApiValidationErrors } from '@/lib/form-errors';
import { cn } from '@/lib/utils';
import type {
  LocalWorkforceOperation,
  WorkforceBoard,
  WorkforceEmployee,
  WorkforceServiceSuggestion,
  WorkforceWorkspace,
} from '@/types/workforce';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function WorkforceBoardPage() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayISO);
  const [board, setBoard] = useState<WorkforceBoard | null>(null);
  const [employees, setEmployees] = useState<WorkforceEmployee[]>([]);
  const [suggestions, setSuggestions] = useState<WorkforceServiceSuggestion[]>([]);
  const [operations, setOperations] = useState<LocalWorkforceOperation[]>([]);
  const [notes, setNotes] = useState('');
  const [baseline, setBaseline] = useState('');
  const [search, setSearch] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [removeKey, setRemoveKey] = useState<string | null>(null);
  const [operationErrors, setOperationErrors] = useState<Record<number, string>>({});
  const loadedSignature = useRef('');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['workforce-board', date],
    queryFn: () => workforceBoardsService.byDate(date),
  });

  const applyWorkspace = (workspace: WorkforceWorkspace) => {
    const ops = toLocalOperations(workspace.operations ?? []);
    const nextNotes = workspace.board?.notes ?? '';
    setBoard(workspace.board ?? null);
    setEmployees(workspace.available_employees ?? []);
    setSuggestions(workspace.service_suggestions ?? []);
    setOperations(ops);
    setNotes(nextNotes);
    const signature = workspaceSignature(nextNotes, ops);
    setBaseline(signature);
    loadedSignature.current = signature;
    setOperationErrors({});
  };

  useEffect(() => {
    if (data) applyWorkspace(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const allEmployees = useMemo(() => {
    // available_employees traz os funcionários livres; os alocados estão nas operações.
    const map = new Map<string, WorkforceEmployee>();
    employees.forEach((e) => map.set(String(e.id), { ...e, id: String(e.id) }));
    return map;
  }, [employees]);

  const employeeById = (id: string): WorkforceEmployee =>
    allEmployees.get(String(id)) ?? { id: String(id), name: `Funcionário ${id}` };

  const available = useMemo(
    () => availableEmployees(Array.from(allEmployees.values()), operations),
    [allEmployees, operations],
  );

  const filteredAvailable = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return available;
    return available.filter(
      (e) =>
        e.name.toLowerCase().includes(term) ||
        (e.fantasy_name ?? '').toLowerCase().includes(term),
    );
  }, [available, search]);

  const isDirty = workspaceSignature(notes, operations) !== baseline;
  const isCancelled = board?.status === 'C';

  const moveTargets = useMemo(
    () => [
      { key: null as string | null, label: 'Disponíveis' },
      ...operations.map((op) => ({ key: op.key as string | null, label: op.title })),
    ],
    [operations],
  );

  const { setNodeRef: setAvailableRef, isOver: isOverAvailable } = useDroppable({ id: 'available' });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor));

  const handleMove = (employeeId: string, targetKey: string | null) => {
    setOperations((prev) => assignEmployee(prev, employeeId, targetKey));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const employeeId = event.active.data.current?.employeeId as string | undefined;
    const overId = event.over?.id;
    if (!employeeId || !overId) return;
    const target = String(overId);
    handleMove(employeeId, target === 'available' ? null : target.replace('operation:', ''));
  };

  const resolveBoard = useMutation({
    mutationFn: () => workforceBoardsService.resolve(date),
    onSuccess: (workspace) => {
      const ops = toLocalOperations(workspace.operations ?? []);
      setBoard(workspace.board ?? null);
      setEmployees(workspace.available_employees ?? []);
      setSuggestions(workspace.service_suggestions ?? []);
      if (operations.length === 0) {
        setOperations(ops);
        const signature = workspaceSignature(workspace.board?.notes ?? '', ops);
        setBaseline(signature);
        setNotes(workspace.board?.notes ?? '');
      }
      queryClient.invalidateQueries({ queryKey: ['workforce-boards'] });
    },
    onError: (error: unknown) => {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      toast.error(response?.data?.message ?? 'Não foi possível criar o quadro desta data.');
    },
  });

  const saveBoard = useMutation({
    mutationFn: async () => {
      let currentBoard = board;
      if (!currentBoard) {
        const workspace = await workforceBoardsService.resolve(date);
        currentBoard = workspace.board;
        setBoard(workspace.board ?? null);
      }
      if (!currentBoard) throw new Error('Quadro não disponível.');
      return workforceBoardsService.saveWorkspace(
        currentBoard.id,
        buildWorkspacePayload(currentBoard.version, notes, operations),
      );
    },
    onSuccess: (workspace) => {
      applyWorkspace(workspace);
      queryClient.invalidateQueries({ queryKey: ['workforce-board', date] });
      queryClient.invalidateQueries({ queryKey: ['workforce-board-history'] });
      toast.success('Quadro salvo com sucesso.');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      if (err.response?.status === 409) {
        setConflictOpen(true);
        return;
      }
      const validation = getApiValidationErrors(error);
      if (validation) {
        const perOperation: Record<number, string> = {};
        const extras: string[] = [];
        Object.entries(validation).forEach(([field, value]) => {
          const message = Array.isArray(value) ? value.join(' ') : String(value);
          const match = /^operations\.(\d+)/.exec(field);
          if (match) {
            const index = Number(match[1]);
            perOperation[index] = [perOperation[index], message].filter(Boolean).join(' ');
          } else {
            extras.push(message);
          }
        });
        setOperationErrors(perOperation);
        toast.error(
          err.response?.data?.message ?? 'Não foi possível salvar o quadro. Verifique as operações destacadas.',
          { description: extras.length ? extras.join(' • ') : undefined },
        );
        return;
      }
      toast.error(err.response?.data?.message ?? 'Não foi possível salvar o quadro.');
    },
  });

  // Aviso ao recarregar/sair com alterações locais.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const requestDateChange = (value: string) => {
    if (!value) return;
    if (isDirty) {
      setPendingDate(value);
      return;
    }
    setDate(value);
  };

  const discardChanges = () => {
    if (data) applyWorkspace(data);
    setDiscardOpen(false);
  };

  const handleManualSubmit = (values: ManualOperationValues) => {
    const required = values.required_employees === '' ? null : Number(values.required_employees);
    if (editingKey) {
      setOperations((prev) =>
        prev.map((op) =>
          op.key === editingKey
            ? {
                ...op,
                title: values.title.trim(),
                description: values.description.trim() || null,
                required_employees: required,
              }
            : op,
        ),
      );
      setEditingKey(null);
      return;
    }
    setOperations((prev) => [
      ...prev,
      createManualOperation(
        { title: values.title, description: values.description, required_employees: required },
        prev.length,
      ),
    ]);
  };

  const editingValues = useMemo<ManualOperationValues | undefined>(() => {
    if (!editingKey) return undefined;
    const op = operations.find((o) => o.key === editingKey);
    if (!op) return undefined;
    return {
      title: op.title,
      description: op.description ?? '',
      required_employees: op.required_employees === null || op.required_employees === undefined ? '' : String(op.required_employees),
    };
  }, [editingKey, operations]);

  const addSuggestion = (suggestion: WorkforceServiceSuggestion) => {
    setOperations((prev) =>
      isSuggestionAdded(prev, suggestion) ? prev : [...prev, suggestionToOperation(suggestion, prev.length)],
    );
  };

  const saving = saveBoard.isPending || resolveBoard.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quadro diário de funcionários</h1>
          <p className="text-sm text-muted-foreground">
            Divisão diária da equipe entre as operações agrícolas.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="work-date">Data</Label>
            <Input
              id="work-date"
              type="date"
              className="w-[170px]"
              value={date}
              onChange={(e) => requestDateChange(e.target.value)}
            />
          </div>
          <Button variant="outline" disabled={!board} onClick={() => setHistoryOpen(true)}>
            <History className="mr-2 h-4 w-4" />
            Histórico
          </Button>
          <Button variant="outline" disabled={!isDirty || saving} onClick={() => setDiscardOpen(true)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Descartar alterações
          </Button>
          <Button onClick={() => saveBoard.mutate()} disabled={saving || isCancelled || !isDirty}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar quadro
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Versão:</span>
            <Badge variant="outline">{board?.version ?? '-'}</Badge>
            <span className="text-muted-foreground">Situação:</span>
            <Badge variant="outline">
              {board ? (WORKFORCE_BOARD_STATUS_LABELS[board.status] ?? board.status) : 'Sem quadro'}
            </Badge>
            {isDirty && <Badge className="bg-yellow-500 text-yellow-950">Alterações não salvas</Badge>}
          </div>
          {!board && (
            <Button
              variant="secondary"
              size="sm"
              disabled={resolveBoard.isPending}
              onClick={() => resolveBoard.mutate()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar quadro desta data
            </Button>
          )}
          <div className="min-w-[240px] flex-1 space-y-1">
            <Label htmlFor="board-notes">Observações</Label>
            <Textarea
              id="board-notes"
              rows={2}
              value={notes}
              disabled={isCancelled}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {isCancelled && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Este quadro está cancelado e não pode ser salvo.
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            <Card ref={setAvailableRef} className={cn(isOverAvailable && 'ring-2 ring-primary')}>
              <CardHeader className="space-y-2 pb-3">
                <CardTitle className="text-base">
                  Funcionários disponíveis ({available.length})
                </CardTitle>
                <Input
                  placeholder="Pesquisar funcionário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </CardHeader>
              <CardContent className="max-h-[60vh] space-y-2 overflow-y-auto">
                {filteredAvailable.length === 0 ? (
                  <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                    Nenhum funcionário disponível.
                  </p>
                ) : (
                  filteredAvailable.map((employee) => (
                    <EmployeeChip
                      key={employee.id}
                      employee={employee}
                      containerKey="available"
                      targets={moveTargets}
                      onMove={handleMove}
                      disabled={isCancelled}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-base">Operações previstas</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isCancelled}
                    onClick={() => {
                      setEditingKey(null);
                      setManualOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar operação manual
                  </Button>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {suggestions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Nenhum serviço previsto para esta data.
                    </p>
                  ) : (
                    suggestions.map((suggestion) => {
                      const added = isSuggestionAdded(operations, suggestion);
                      return (
                        <Button
                          key={`${suggestion.source_type}-${suggestion.source_id}`}
                          size="sm"
                          variant={added ? 'ghost' : 'secondary'}
                          disabled={added || isCancelled}
                          onClick={() => addSuggestion(suggestion)}
                        >
                          {added ? '✓ ' : <Plus className="mr-2 h-4 w-4" />}
                          {suggestion.title}
                        </Button>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {operations.length === 0 ? (
                <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Nenhuma operação no quadro. Adicione um serviço previsto ou uma operação manual.
                </p>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {operations.map((operation, index) => (
                    <OperationCard
                      key={operation.key}
                      operation={operation}
                      employees={operation.employee_ids.map(employeeById)}
                      targets={moveTargets}
                      error={operationErrors[index]}
                      disabled={isCancelled}
                      onMoveEmployee={handleMove}
                      onMoveOperation={(direction) =>
                        setOperations((prev) => moveOperation(prev, operation.key, direction))
                      }
                      onEdit={() => {
                        setEditingKey(operation.key);
                        setManualOpen(true);
                      }}
                      onRemove={() => setRemoveKey(operation.key)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </DndContext>
      )}

      {isFetching && !isLoading && (
        <p className="text-xs text-muted-foreground">Atualizando dados do quadro...</p>
      )}

      <ManualOperationDialog
        open={manualOpen}
        onOpenChange={(open) => {
          setManualOpen(open);
          if (!open) setEditingKey(null);
        }}
        initialValues={editingValues}
        onSubmit={handleManualSubmit}
      />

      <WorkforceHistoryDialog boardId={board?.id ?? null} open={historyOpen} onOpenChange={setHistoryOpen} />

      <ConfirmDialog
        open={!!removeKey}
        onOpenChange={(open) => !open && setRemoveKey(null)}
        title="Remover operação"
        description="Os funcionários desta operação voltarão para a lista de disponíveis. A remoção só será efetivada ao salvar o quadro."
        confirmLabel="Remover"
        onConfirm={() => {
          setOperations((prev) =>
            prev.filter((op) => op.key !== removeKey).map((op, order) => ({ ...op, display_order: order })),
          );
          setRemoveKey(null);
        }}
      />

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              As movimentações feitas nesta tela e ainda não salvas serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={discardChanges}>Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingDate} onOpenChange={(open) => !open && setPendingDate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Ao trocar a data, as movimentações ainda não salvas serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar no quadro</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDate) setDate(pendingDate);
                setPendingDate(null);
              }}
            >
              Trocar data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={conflictOpen} onOpenChange={setConflictOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Este quadro foi alterado por outro usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Recarregar o quadro trará a versão mais recente e descartará as suas alterações locais.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar revisando</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setConflictOpen(false);
                const result = await refetch();
                if (result.data) applyWorkspace(result.data);
              }}
            >
              Recarregar quadro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
