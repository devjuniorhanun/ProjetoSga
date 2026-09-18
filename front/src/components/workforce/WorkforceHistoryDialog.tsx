import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { workforceBoardsService } from '@/lib/api-services-workforce';
import { WORKFORCE_ACTION_LABELS } from '@/lib/workforce-rules';

interface Props {
  boardId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
};

export function WorkforceHistoryDialog({ boardId, open, onOpenChange }: Props) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['workforce-board-history', boardId],
    queryFn: () => workforceBoardsService.history(boardId as string),
    enabled: open && !!boardId,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Histórico do quadro</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma movimentação registrada para este quadro.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>De</TableHead>
                  <TableHead>Para</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Data/hora</TableHead>
                  <TableHead>Versão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.employee_name ?? '-'}</TableCell>
                    <TableCell>{WORKFORCE_ACTION_LABELS[entry.action] ?? entry.action}</TableCell>
                    <TableCell>{entry.from_operation_title ?? '-'}</TableCell>
                    <TableCell>{entry.to_operation_title ?? '-'}</TableCell>
                    <TableCell>{entry.user_name ?? '-'}</TableCell>
                    <TableCell>{formatDateTime(entry.created_at)}</TableCell>
                    <TableCell>{entry.version ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
