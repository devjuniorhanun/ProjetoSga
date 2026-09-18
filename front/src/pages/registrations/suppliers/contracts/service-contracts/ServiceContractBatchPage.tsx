import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cropsService } from '@/lib/api-services';
import { serviceContractsService } from '@/lib/api-services-service-contracts';
import { ContractPdfActions } from '@/components/contracts/ContractPdfActions';
import { formatCurrencyBRL, handleCurrencyMaskChange } from '@/lib/format-helpers';
import {
  FUEL_SUPPLIED_BY_LABELS,
  type FuelSuppliedBy,
  type ServiceContract,
  type ServiceContractBankAccount,
  type ServiceContractPayload,
  type ServiceContractPreview,
  type ServiceContractType,
} from '@/types/service-contracts';

interface Props {
  contractType: ServiceContractType;
  title: string;
  description: string;
  supplierLabel: string;
  participantsLabel: string;
}

const bankLabel = (account: ServiceContractBankAccount) =>
  [
    account.bank_name,
    account.agency_number ? `Ag. ${account.agency_number}` : '',
    account.account_number ? `C/C ${account.account_number}` : '',
    account.pix_key ? `PIX ${account.pix_key}` : '',
  ]
    .filter(Boolean)
    .join(' · ') || 'Conta bancária';

const bankValue = (account: ServiceContractBankAccount) =>
  String(account.bank_supplier_id ?? account.id ?? '');

function apiMessage(error: unknown, fallback: string): string {
  const response = (error as {
    response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } };
  }).response;
  if (response?.status === 404) return 'Registro não encontrado.';
  if (response?.status === 403) return 'Você não tem permissão para esta ação.';
  const errors = response?.data?.errors;
  if (errors) {
    const first = Object.values(errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return response?.data?.message ?? fallback;
}

export function ServiceContractBatchPage({
  contractType,
  title,
  description,
  supplierLabel,
  participantsLabel,
}: Props) {
  const queryClient = useQueryClient();
  const isTransport = contractType === 'TRANSPORT';

  const [cropId, setCropId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [bankSupplierId, setBankSupplierId] = useState('');
  const [openingDate, setOpeningDate] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingCostDisplay, setShippingCostDisplay] = useState('');
  const [serviceHours, setServiceHours] = useState('');
  const [extraServiceDescription, setExtraServiceDescription] = useState('');
  const [remunerationPercentage, setRemunerationPercentage] = useState('');
  const [fuelSuppliedBy, setFuelSuppliedBy] = useState<FuelSuppliedBy>('CONTRACTING_PARTY');
  const [mealAllowanceDescription, setMealAllowanceDescription] = useState('');
  const [observations, setObservations] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<ServiceContractPreview | null>(null);
  const [generated, setGenerated] = useState<ServiceContract[]>([]);

  const { data: crops = [] } = useQuery({ queryKey: ['crops'], queryFn: cropsService.getAll });
  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ['service-contract-suppliers', contractType],
    queryFn: () => serviceContractsService.getSuppliers(contractType),
  });
  const { data: participantsData, isFetching: loadingParticipants } = useQuery({
    queryKey: ['service-contract-participants', contractType, supplierId],
    queryFn: () => serviceContractsService.getParticipants(contractType, supplierId),
    enabled: !!supplierId,
  });

  const bankAccounts = useMemo(
    () => preview?.bank_accounts?.length ? preview.bank_accounts : participantsData?.bank_accounts ?? [],
    [preview, participantsData],
  );
  const participants = useMemo(
    () => (preview?.participants?.length ? preview.participants : participantsData?.participants ?? []),
    [preview, participantsData],
  );
  const bankSelectionRequired =
    preview?.bank_selection_required ?? participantsData?.bank_selection_required ?? bankAccounts.length > 1;

  // Conta única: seleção automática. Várias contas: exigir escolha explícita.
  useEffect(() => {
    if (bankAccounts.length === 1) {
      setBankSupplierId(bankValue(bankAccounts[0]));
    } else if (bankAccounts.length === 0) {
      setBankSupplierId('');
    }
  }, [bankAccounts]);

  const cropOptions = useMemo(
    () => crops.filter((c) => c.status === 'A').map((c) => ({ value: String(c.id), label: c.name })),
    [crops],
  );
  const supplierOptions = useMemo(
    () =>
      suppliers.map((s) => ({
        value: String(s.supplier_id),
        label: s.supplier_name,
        keywords: [s.cpf_cnpj].filter(Boolean) as string[],
      })),
    [suppliers],
  );

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!cropId) next.crop_id = 'Safra obrigatória';
    if (!supplierId) next.supplier_id = `${supplierLabel} obrigatório`;
    if (!openingDate) next.opening_date = 'Data inicial obrigatória';
    if (!closingDate) next.closing_date = 'Data final obrigatória';
    if (openingDate && closingDate && closingDate < openingDate) {
      next.closing_date = 'Data final deve ser maior ou igual à inicial';
    }
    if (isTransport) {
      if (!(shippingCost > 0)) next.shipping_cost = 'Valor do frete deve ser maior que zero';
    } else {
      const percentage = Number(String(remunerationPercentage).replace(',', '.'));
      if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
        next.remuneration_percentage = 'Percentual deve ser maior que zero e no máximo 100';
      } else if (!/^\d{1,3}([.,]\d{1,4})?$/.test(String(remunerationPercentage).trim())) {
        next.remuneration_percentage = 'Informe no máximo quatro casas decimais';
      }
    }
    if (bankSelectionRequired && bankAccounts.length > 1 && !bankSupplierId) {
      next.bank_supplier_id = 'Selecione a conta bancária';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = (): ServiceContractPayload => {
    const base = {
      crop_id: cropId,
      supplier_id: supplierId,
      bank_supplier_id: bankSupplierId || null,
      opening_date: openingDate,
      closing_date: closingDate,
      observations: observations || undefined,
    };
    if (isTransport) {
      return {
        ...base,
        shipping_cost: shippingCost,
        service_hours: serviceHours || undefined,
        extra_service_description: extraServiceDescription || undefined,
      };
    }
    return {
      ...base,
      remuneration_percentage: Number(String(remunerationPercentage).replace(',', '.')),
      fuel_supplied_by: fuelSuppliedBy,
      meal_allowance_description: mealAllowanceDescription || undefined,
    };
  };

  const previewMutation = useMutation({
    mutationFn: () => serviceContractsService.previewBatch(contractType, buildPayload()),
    onSuccess: (result) => {
      setPreview(result);
      setGenerated([]);
      if (result.bank_accounts.length === 1) setBankSupplierId(bankValue(result.bank_accounts[0]));
      if (!result.can_generate) {
        toast.error(result.errors[0] ?? 'Não é possível gerar contratos com os dados informados.');
      }
    },
    onError: (error) => toast.error(apiMessage(error, 'Não foi possível carregar a prévia.')),
  });

  const generateMutation = useMutation({
    mutationFn: () => serviceContractsService.generateBatch(contractType, buildPayload()),
    onSuccess: (contracts) => {
      setGenerated(contracts);
      queryClient.invalidateQueries({ queryKey: ['service-contracts'] });
      toast.success(`${contracts.length} contrato(s) gerado(s).`);
    },
    onError: (error) => toast.error(apiMessage(error, 'Não foi possível gerar os contratos.')),
  });

  const handlePreview = () => {
    if (!validate()) return;
    previewMutation.mutate();
  };

  const handleGenerate = () => {
    if (!validate() || !preview?.can_generate) return;
    generateMutation.mutate();
  };

  const busy = previewMutation.isPending || generateMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados do contrato</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Safra</Label>
            <Combobox
              options={cropOptions}
              value={cropId}
              onValueChange={(v) => {
                setCropId(v);
                setPreview(null);
              }}
              placeholder="Selecione a safra"
              searchPlaceholder="Buscar safra..."
            />
            {errors.crop_id && <p className="text-sm text-destructive">{errors.crop_id}</p>}
          </div>

          <div className="space-y-2">
            <Label>{supplierLabel}</Label>
            <Combobox
              options={supplierOptions}
              value={supplierId}
              onValueChange={(v) => {
                setSupplierId(v);
                setBankSupplierId('');
                setPreview(null);
              }}
              placeholder={loadingSuppliers ? 'Carregando...' : `Selecione o ${supplierLabel.toLowerCase()}`}
              searchPlaceholder="Buscar fornecedor..."
            />
            {errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id}</p>}
          </div>

          <div className="space-y-2">
            <Label>Conta bancária</Label>
            <Select
              value={bankSupplierId}
              onValueChange={(v) => setBankSupplierId(v)}
              disabled={!supplierId || bankAccounts.length === 0}
            >
              <SelectTrigger
                className={bankSelectionRequired && !bankSupplierId ? 'border-destructive' : undefined}
              >
                <SelectValue
                  placeholder={
                    bankAccounts.length === 0 ? 'Sem contas bancárias' : 'Selecione a conta bancária'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((account) => (
                  <SelectItem key={bankValue(account)} value={bankValue(account)}>
                    {bankLabel(account)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bank_supplier_id && (
              <p className="text-sm text-destructive">{errors.bank_supplier_id}</p>
            )}
            {supplierId && !loadingParticipants && bankAccounts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma conta bancária ativa. O contrato será gerado sem dados bancários.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="opening_date">Data inicial</Label>
            <Input
              id="opening_date"
              type="date"
              value={openingDate}
              onChange={(e) => setOpeningDate(e.target.value)}
            />
            {errors.opening_date && <p className="text-sm text-destructive">{errors.opening_date}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="closing_date">Data final</Label>
            <Input
              id="closing_date"
              type="date"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
            />
            {errors.closing_date && <p className="text-sm text-destructive">{errors.closing_date}</p>}
          </div>

          {isTransport ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="shipping_cost">Valor do frete por saca bruta</Label>
                <Input
                  id="shipping_cost"
                  value={shippingCostDisplay}
                  onChange={(e) =>
                    handleCurrencyMaskChange(e, setShippingCostDisplay, setShippingCost)
                  }
                  onBlur={() => setShippingCostDisplay(formatCurrencyBRL(shippingCost))}
                  placeholder="R$ 0,00"
                  inputMode="numeric"
                />
                {errors.shipping_cost && (
                  <p className="text-sm text-destructive">{errors.shipping_cost}</p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="service_hours">Horários de serviço</Label>
                <Textarea
                  id="service_hours"
                  value={serviceHours}
                  onChange={(e) => setServiceHours(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="extra_service_description">Descrição de serviços extras</Label>
                <Textarea
                  id="extra_service_description"
                  value={extraServiceDescription}
                  onChange={(e) => setExtraServiceDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="remuneration_percentage">Percentual de remuneração (%)</Label>
                <Input
                  id="remuneration_percentage"
                  value={remunerationPercentage}
                  onChange={(e) => setRemunerationPercentage(e.target.value)}
                  placeholder="8,5000"
                  inputMode="decimal"
                />
                {errors.remuneration_percentage && (
                  <p className="text-sm text-destructive">{errors.remuneration_percentage}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Combustível fornecido por</Label>
                <Select
                  value={fuelSuppliedBy}
                  onValueChange={(v) => setFuelSuppliedBy(v as FuelSuppliedBy)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FUEL_SUPPLIED_BY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="meal_allowance_description">Descrição da alimentação/diárias</Label>
                <Textarea
                  id="meal_allowance_description"
                  value={mealAllowanceDescription}
                  onChange={(e) => setMealAllowanceDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}

          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-end gap-2 md:col-span-2 lg:col-span-3">
            <Button type="button" onClick={handlePreview} disabled={busy}>
              {previewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ver prévia
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleGenerate}
              disabled={busy || !preview?.can_generate}
            >
              {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gerar contratos
            </Button>
          </div>
        </CardContent>
      </Card>

      {!!participants.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{participantsLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Complemento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant, index) => (
                  <TableRow key={participant.id ?? index}>
                    <TableCell>
                      {participant.name || participant.participant_name || participant.description || '-'}
                    </TableCell>
                    <TableCell>{participant.cpf || participant.cpf_cnpj || '-'}</TableCell>
                    <TableCell>
                      {participant.plate || participant.vehicle || participant.cnh || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prévia da geração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{preview.contracts_count} contrato(s)</Badge>
              <Badge variant={preview.can_generate ? 'outline' : 'destructive'}>
                {preview.can_generate ? 'Pronto para gerar' : 'Geração bloqueada'}
              </Badge>
            </div>

            {preview.errors.map((message) => (
              <Alert key={message} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            ))}
            {preview.warnings.map((message) => (
              <Alert key={message}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            ))}
            {preview.bank_selection_required && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Este fornecedor possui mais de uma conta bancária. Selecione a conta desejada.
                </AlertDescription>
              </Alert>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produtor</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Fazenda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.producers.map((producer, index) => (
                  <TableRow key={producer.producer_id ?? producer.id ?? index}>
                    <TableCell>{producer.producer_name || producer.name || '-'}</TableCell>
                    <TableCell>{producer.cpf_cnpj || '-'}</TableCell>
                    <TableCell>{producer.farm_name || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!!generated.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contratos gerados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Produtor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generated.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>{contract.contract_number}</TableCell>
                    <TableCell>{contract.producer_name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <ContractPdfActions
                          contractId={contract.id}
                          contractNumber={contract.contract_number}
                          contractType={contractType}
                          hasPdf={contract.has_pdf}
                          onGenerated={() =>
                            queryClient.invalidateQueries({ queryKey: ['service-contracts'] })
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
