import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/DataTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { applyApiErrors } from '@/lib/form-errors';
import { grainAuthorizationsService } from '@/lib/api-services-grain';
import { GrainStatusBadge } from '@/components/grain/GrainStatusBadge';
import { useGrainPermissions } from '@/hooks/use-grain-permissions';
import { formatDateTimeBR } from '@/lib/grain-format';
import { AUTHORIZATION_OPERATION_LABELS, AUTHORIZATION_STATUS_LABELS, labelOr } from '@/lib/grain-labels';
import type { GrainAuthorization } from '@/types/grain';

const ALL = 'ALL';

export default function GrainAuthorizationsPage() {
  const queryClient = useQueryClient();
  const { isSuper, isAdmin, userId } = useGrainPermissions();
  const canReview = isSuper || isAdmin;
  const [status, setStatus] = useState('PENDING');
  const [target, setTarget] = useState<{ item: GrainAuthorization; action: 'approve' | 'reject' } | null>(null);
  const [reviewReason, setReviewReason] = useState('');

  const { data = [], isLoading } = useQuery({
    queryKey: ['grain-authorizations', status],
    queryFn: () => grainAuthorizationsService.getAll({ per_page: 25, ...(status !== ALL ? { status } : {}) }),
  });

  const submitReview = async () => {
    if (!target) return;
    if (target.action === 'reject' && !reviewReason.trim()) {
      toast.error('Informe o motivo da rejeição.');
      return;
    }
    try {
      if (target.action === 'approve') {
        await grainAuthorizationsService.approve(target.item.id, { reason: reviewReason.trim() || null });
        toast.success('Solicitação aprovada.');
      } else {
        await grainAuthorizationsService.reject(target.item.id, { reason: reviewReason.trim() });
        toast.success('Solicitação rejeitada.');
      }
      setTarget(null);
      setReviewReason('');
      queryClient.invalidateQueries({ queryKey: ['grain-authorizations'] });
    } catch (error) {
      applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível concluir a análise.' });
    }
  };

  const isOwnRequest = (item: GrainAuthorization) =>
    !!userId && !!item.requested_by_id && String(item.requested_by_id) === String(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Autorizações</h1>
        <p className="mt-1 text-muted-foreground">Solicitações que dependem de aprovação administrativa</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="max-w-xs space-y-2">
            <Label>Situação</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {Object.entries(AUTHORIZATION_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="py-6 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable<GrainAuthorization>
          data={data}
          exportTitle="Autorizações"
          searchKeys={['operation_type', 'reason', 'requested_by_name']}
          columns={[
            { key: 'created_at', label: 'Solicitada em', render: (a) => (a.created_at ? formatDateTimeBR(a.created_at) : '-') },
            { key: 'operation_type', label: 'Operação', render: (a) => labelOr(AUTHORIZATION_OPERATION_LABELS, a.operation_type) },
            { key: 'resource_id', label: 'Registro', render: (a) => a.resource_id ?? '-' },
            { key: 'reason', label: 'Motivo' },
            { key: 'requested_by_name', label: 'Solicitante', render: (a) => a.requested_by_name ?? '-' },
            { key: 'reviewed_by_name', label: 'Analisada por', render: (a) => a.reviewed_by_name ?? '-' },
            { key: 'status', label: 'Situação', render: (a) => <GrainStatusBadge kind="authorization" status={a.status} /> },
          ]}
          actions={(a) => {
            const blocked = a.status !== 'PENDING' || !canReview || isOwnRequest(a);
            return (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-success"
                  title={isOwnRequest(a) ? 'Não é possível aprovar a própria solicitação' : 'Aprovar'}
                  disabled={blocked}
                  onClick={() => setTarget({ item: a, action: 'approve' })}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  title="Rejeitar"
                  disabled={blocked}
                  onClick={() => setTarget({ item: a, action: 'reject' })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          }}
        />
      )}

      <Dialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{target?.action === 'approve' ? 'Aprovar solicitação' : 'Rejeitar solicitação'}</DialogTitle>
            <DialogDescription>
              {target ? labelOr(AUTHORIZATION_OPERATION_LABELS, target.item.operation_type) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Observação{target?.action === 'reject' ? '' : ' (opcional)'}</Label>
            <Textarea rows={3} value={reviewReason} onChange={(e) => setReviewReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>Cancelar</Button>
            <Button onClick={submitReview}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
