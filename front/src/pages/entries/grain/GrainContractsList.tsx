import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { DataTable } from '@/components/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Pencil, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { applyApiErrors } from '@/lib/form-errors';
import { farmStateRegistrationsService, grainContractsService, grainSupportService } from '@/lib/api-services-grain';
import { GrainStatusBadge } from '@/components/grain/GrainStatusBadge';
import { AuthorizationFlowDialog } from '@/components/grain/AuthorizationFlowDialog';
import { WeightInput } from '@/components/grain/WeightInput';
import { PercentageInput } from '@/components/grain/PercentageInput';
import { formatDateBR, formatWeightKg } from '@/lib/grain-format';
import { OWNERSHIP_TYPE_LABELS, labelOr } from '@/lib/grain-labels';
import type { GrainContract, GrainContractPayload, OwnershipType } from '@/types/grain';

const emptyForm = {
  contract_number: '',
  buyer_id: '',
  producer_id: '',
  farm_state_registration_id: '',
  crop_id: '',
  culture_id: '',
  ownership_type: 'OW' as OwnershipType,
  contract_date: '',
  start_date: '',
  expiration_date: '',
  contracted_weight: 0,
  tolerance_percentage: 0,
  status: 'DRAFT' as 'DRAFT' | 'OPEN',
  notes: '',
};

export default function GrainContractsList() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GrainContract | null>(null);
  const [values, setValues] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editAuthOpen, setEditAuthOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{ contract: GrainContract; status: 'OPEN' | 'SUSPENDED' | 'CANCELED' } | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ['grain-contracts'],
    queryFn: () => grainContractsService.getAll({ per_page: 25 }),
  });
  const { data: buyers = [] } = useQuery({ queryKey: ['grain-buyers'], queryFn: grainSupportService.buyers });
  const { data: producers = [] } = useQuery({ queryKey: ['grain-support-producers'], queryFn: grainSupportService.producers });
  const { data: crops = [] } = useQuery({ queryKey: ['grain-support-crops'], queryFn: grainSupportService.crops });
  const { data: cultures = [] } = useQuery({
    queryKey: ['grain-support-cultures', values.crop_id],
    queryFn: () => grainSupportService.culturesByCrop(values.crop_id),
    enabled: !!values.crop_id,
  });
  const { data: registrations = [] } = useQuery({
    queryKey: ['farm-state-registrations', values.producer_id, values.culture_id],
    queryFn: () =>
      farmStateRegistrationsService.getAll({
        producer_id: values.producer_id,
        culture_id: values.culture_id,
        status: 'A',
      }),
    enabled: !!values.producer_id && !!values.culture_id,
  });

  useEffect(() => {
    if (!formOpen) {
      setEditing(null);
      setValues(emptyForm);
    }
  }, [formOpen]);

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const payload: GrainContractPayload = useMemo(
    () => ({
      contract_number: values.contract_number,
      buyer_id: values.buyer_id,
      producer_id: values.producer_id,
      farm_state_registration_id: values.farm_state_registration_id,
      crop_id: values.crop_id,
      culture_id: values.culture_id,
      ownership_type: values.ownership_type,
      contract_date: values.contract_date || null,
      start_date: values.start_date || null,
      expiration_date: values.expiration_date || null,
      contracted_weight: values.contracted_weight,
      tolerance_percentage: values.tolerance_percentage,
      status: values.status,
      notes: values.notes || null,
    }),
    [values],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['grain-contracts'] });

  const createContract = async () => {
    if (!values.contract_number || !values.buyer_id || !values.producer_id || !values.farm_state_registration_id) {
      toast.error('Preencha os campos obrigatórios do contrato.');
      return;
    }
    setSaving(true);
    try {
      await grainContractsService.create(payload);
      toast.success('Contrato criado.');
      setFormOpen(false);
      invalidate();
    } catch (error) {
      applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível criar o contrato.' });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (contract: GrainContract) => {
    setEditing(contract);
    setValues({
      contract_number: contract.contract_number,
      buyer_id: contract.buyer_id,
      producer_id: contract.producer_id,
      farm_state_registration_id: contract.farm_state_registration_id,
      crop_id: contract.crop_id,
      culture_id: contract.culture_id,
      ownership_type: contract.ownership_type,
      contract_date: contract.contract_date ?? '',
      start_date: contract.start_date ?? '',
      expiration_date: contract.expiration_date ?? '',
      contracted_weight: contract.contracted_weight,
      tolerance_percentage: contract.tolerance_percentage,
      status: contract.status === 'OPEN' ? 'OPEN' : 'DRAFT',
      notes: contract.notes ?? '',
    });
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Contratos de Venda</h1>
          <p className="mt-1 text-muted-foreground">Contratos por comprador, inscrição estadual e cultura</p>
        </div>
        <Button onClick={() => setFormOpen(true)}><Plus className="mr-2 h-4 w-4" /> Novo contrato</Button>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable<GrainContract>
          data={data}
          exportTitle="Contratos de Venda"
          searchKeys={['contract_number', 'buyer_name', 'producer_name', 'culture_name']}
          columns={[
            { key: 'contract_number', label: 'Contrato' },
            { key: 'buyer_name', label: 'Comprador', render: (c) => c.buyer_name ?? '-' },
            { key: 'producer_name', label: 'Produtor', render: (c) => c.producer_name ?? '-' },
            { key: 'culture_name', label: 'Cultura', render: (c) => c.culture_name ?? '-' },
            { key: 'ownership_type', label: 'Titularidade', render: (c) => labelOr(OWNERSHIP_TYPE_LABELS, c.ownership_type) },
            { key: 'contracted_weight', label: 'Contratado', render: (c) => formatWeightKg(c.contracted_weight) },
            { key: 'transferred_weight', label: 'Transferido', render: (c) => formatWeightKg(c.transferred_weight ?? 0) },
            { key: 'shipped_weight', label: 'Expedido', render: (c) => formatWeightKg(c.shipped_weight ?? 0) },
            {
              key: 'expiration_date',
              label: 'Vencimento',
              render: (c) => (c.expiration_date ? formatDateBR(c.expiration_date) : '-'),
            },
            { key: 'status', label: 'Situação', render: (c) => <GrainStatusBadge kind="contract" status={c.status} /> },
          ]}
          actions={(c) => (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => openEdit(c)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Alterar situação"
                onClick={() => setStatusTarget({ contract: c, status: c.status === 'OPEN' ? 'SUSPENDED' : 'OPEN' })}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar contrato' : 'Novo contrato'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Número do contrato</Label>
              <Input value={values.contract_number} onChange={(e) => set('contract_number', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Comprador</Label>
              <Combobox
                options={buyers.map((b) => ({ value: b.id, label: b.name }))}
                value={values.buyer_id}
                onValueChange={(v) => set('buyer_id', v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Produtor</Label>
              <Combobox
                options={producers.map((p) => ({ value: p.id, label: p.name }))}
                value={values.producer_id}
                onValueChange={(v) => {
                  set('producer_id', v);
                  set('farm_state_registration_id', '');
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Safra</Label>
              <Combobox
                options={crops.map((c) => ({ value: c.id, label: c.name }))}
                value={values.crop_id}
                onValueChange={(v) => {
                  set('crop_id', v);
                  set('culture_id', '');
                  set('farm_state_registration_id', '');
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Cultura</Label>
              <Combobox
                options={cultures.map((c) => ({ value: c.id, label: c.name }))}
                value={values.culture_id}
                onValueChange={(v) => {
                  set('culture_id', v);
                  set('farm_state_registration_id', '');
                }}
                disabled={!values.crop_id}
              />
            </div>
            <div className="space-y-2">
              <Label>Inscrição estadual</Label>
              <Combobox
                options={registrations.map((r) => ({ value: r.id, label: r.state_registration }))}
                value={values.farm_state_registration_id}
                onValueChange={(v) => set('farm_state_registration_id', v)}
                disabled={!values.producer_id || !values.culture_id}
              />
            </div>
            <div className="space-y-2">
              <Label>Titularidade</Label>
              <Select value={values.ownership_type} onValueChange={(v) => set('ownership_type', v as OwnershipType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(OWNERSHIP_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Situação</Label>
              <Select value={values.status} onValueChange={(v) => set('status', v as 'DRAFT' | 'OPEN')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Rascunho</SelectItem>
                  <SelectItem value="OPEN">Aberto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data do contrato</Label>
              <Input type="date" value={values.contract_date} onChange={(e) => set('contract_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Início</Label>
              <Input type="date" value={values.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input type="date" value={values.expiration_date} onChange={(e) => set('expiration_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Peso contratado (kg)</Label>
              <WeightInput value={values.contracted_weight} onChange={(v) => set('contracted_weight', v)} />
            </div>
            <div className="space-y-2">
              <Label>Tolerância (%)</Label>
              <PercentageInput value={values.tolerance_percentage} onChange={(v) => set('tolerance_percentage', v)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Observações</Label>
              <Input value={values.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            {editing ? (
              <Button onClick={() => setEditAuthOpen(true)}>Solicitar autorização e salvar</Button>
            ) : (
              <Button onClick={createContract} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Criar contrato
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AuthorizationFlowDialog
        open={editAuthOpen}
        onOpenChange={setEditAuthOpen}
        operationType="CHANGE_CONTRACT"
        resourceType="grain_contract"
        resourceId={editing?.id ?? null}
        payloadBefore={editing ? ({ ...editing } as unknown as Record<string, unknown>) : null}
        payloadRequested={payload as unknown as Record<string, unknown>}
        description="A alteração de contrato exige aprovação administrativa."
        onApproved={async (authorizationId) => {
          if (!editing) return;
          try {
            await grainContractsService.update(editing.id, { ...payload, authorization_request_id: authorizationId });
            toast.success('Contrato atualizado.');
            setEditAuthOpen(false);
            setFormOpen(false);
            invalidate();
          } catch (error) {
            applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível atualizar o contrato.' });
          }
        }}
      />

      <AuthorizationFlowDialog
        open={!!statusTarget}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        operationType="CHANGE_CONTRACT_STATUS"
        resourceType="grain_contract"
        resourceId={statusTarget?.contract.id ?? null}
        payloadRequested={{ status: statusTarget?.status }}
        description="A alteração de situação do contrato exige aprovação administrativa."
        onApproved={async (authorizationId) => {
          if (!statusTarget) return;
          try {
            await grainContractsService.changeStatus(statusTarget.contract.id, {
              status: statusTarget.status,
              authorization_request_id: authorizationId,
            });
            toast.success('Situação do contrato atualizada.');
            setStatusTarget(null);
            invalidate();
          } catch (error) {
            applyApiErrors(error, undefined, { fallbackMessage: 'Não foi possível alterar a situação.' });
          }
        }}
      />
    </div>
  );
}
