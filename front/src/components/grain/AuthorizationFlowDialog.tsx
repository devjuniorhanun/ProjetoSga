import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { applyApiErrors } from '@/lib/form-errors';
import { grainAuthorizationsService } from '@/lib/api-services-grain';
import { AUTHORIZATION_OPERATION_LABELS } from '@/lib/grain-labels';
import { GrainStatusBadge } from './GrainStatusBadge';
import type { GrainAuthorization } from '@/types/grain';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operationType: string;
  resourceType?: string | null;
  resourceId?: string | null;
  payloadBefore?: Record<string, unknown> | null;
  payloadRequested: Record<string, unknown>;
  /** Chamado apenas quando a autorização estiver APPROVED. */
  onApproved: (authorizationRequestId: string) => void;
  description?: string;
}

/**
 * Fluxo padrão de autorização: cria a solicitação, acompanha o status e
 * devolve o id somente quando aprovada. A aprovação acontece na tela de
 * Autorizações, por usuário SUPER/ADM.
 */
export function AuthorizationFlowDialog({
  open,
  onOpenChange,
  operationType,
  resourceType = null,
  resourceId = null,
  payloadBefore = null,
  payloadRequested,
  onApproved,
  description,
}: Props) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [request, setRequest] = useState<GrainAuthorization | null>(null);

  useEffect(() => {
    if (!open) {
      setReason('');
      setRequest(null);
      setSaving(false);
      setChecking(false);
    }
  }, [open]);

  const createRequest = async () => {
    if (reason.trim().length < 3) {
      toast.error('Informe o motivo da solicitação.');
      return;
    }
    setSaving(true);
    try {
      const created = await grainAuthorizationsService.create({
        operation_type: operationType,
        resource_type: resourceType,
        resource_id: resourceId,
        reason: reason.trim(),
        payload_before: payloadBefore,
        payload_requested: payloadRequested,
        expires_at: null,
      });
      setRequest(created);
      queryClient.invalidateQueries({ queryKey: ['grain-authorizations'] });
      toast.success('Solicitação de autorização registrada.');
      if (created.status === 'APPROVED') onApproved(created.id);
    } catch (error) {
      applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível solicitar a autorização.' });
    } finally {
      setSaving(false);
    }
  };

  const refreshStatus = async () => {
    if (!request) return;
    setChecking(true);
    try {
      const list = await grainAuthorizationsService.getAll({ status: 'APPROVED' });
      const found = list.find((a) => a.id === request.id);
      if (found) {
        setRequest(found);
        onApproved(found.id);
        toast.success('Autorização aprovada. Você já pode concluir a operação.');
      } else {
        toast.info('A solicitação ainda não foi aprovada.');
      }
    } catch (error) {
      applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível consultar a autorização.' });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Autorização — {AUTHORIZATION_OPERATION_LABELS[operationType] ?? operationType}
          </DialogTitle>
          <DialogDescription>
            {description ?? 'Esta operação exige aprovação de um administrador antes de ser concluída.'}
          </DialogDescription>
        </DialogHeader>

        {!request ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="authorization-reason">Motivo</Label>
              <Textarea
                id="authorization-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Descreva o motivo da solicitação"
              />
            </div>
            <details className="rounded-md border p-3 text-sm">
              <summary className="cursor-pointer text-muted-foreground">Dados enviados na solicitação</summary>
              <pre className="mt-2 overflow-x-auto text-xs">{JSON.stringify(payloadRequested, null, 2)}</pre>
            </details>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Solicitação:</span>
              <span className="font-medium">#{request.id}</span>
              <GrainStatusBadge kind="authorization" status={request.status} />
            </div>
            <p className="text-muted-foreground">
              Aguarde a aprovação de um administrador na tela de Autorizações e depois atualize a situação.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {!request ? (
            <Button onClick={createRequest} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Solicitar autorização
            </Button>
          ) : (
            <Button onClick={refreshStatus} disabled={checking || request.status !== 'PENDING'}>
              {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Atualizar situação
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
