import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { agriculturalServicesService } from '@/lib/api-services-agricultural-services';
import { useAgriculturalOptions } from '@/hooks/use-agricultural-options';
import {
  RATE_TYPE_LABELS,
  RATE_UNIT_LABELS,
  applicationProductIsValid,
  firebreakArea,
  fleetGroupMatchesFunction,
  hasTankerOperator,
  operatorIsValid,
  recommendedForItem,
  totalArea,
  totalRecommended,
} from '@/lib/agricultural-rules';
import type {
  AgriculturalService,
  AgriculturalServiceCategory,
  AgriculturalServiceItem,
  AgriculturalServiceLocation,
  AgriculturalServiceOperator,
  AgriculturalServicePayload,
  ApplicationRateType,
  ApplicationRateUnit,
} from '@/types/agricultural';

interface Props {
  category: AgriculturalServiceCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: AgriculturalService | null;
}

const num = (value: string) => Number(String(value).replace(',', '.')) || 0;

export function AgriculturalServiceFormDialog({ category, open, onOpenChange, service }: Props) {
  const queryClient = useQueryClient();
  const options = useAgriculturalOptions(category);
  const isFirebreak = category === 'FIREBREAK_MAINTENANCE';

  const [typeId, setTypeId] = useState('');
  const [cropId, setCropId] = useState('');
  const [cultureId, setCultureId] = useState('');
  const [farmId, setFarmId] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [description, setDescription] = useState('');
  const [productId, setProductId] = useState('');
  const [rateType, setRateType] = useState<ApplicationRateType | ''>('');
  const [rateUnit, setRateUnit] = useState<ApplicationRateUnit | ''>('');
  const [rateValue, setRateValue] = useState('');
  const [items, setItems] = useState<AgriculturalServiceItem[]>([]);
  const [operators, setOperators] = useState<AgriculturalServiceOperator[]>([]);
  const [locations, setLocations] = useState<AgriculturalServiceLocation[]>([]);
  const [newPlotField, setNewPlotField] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setFieldErrors({});
    setTypeId(service?.agricultural_service_type_id ? String(service.agricultural_service_type_id) : '');
    setCropId(service?.crop_id ? String(service.crop_id) : '');
    setCultureId(service?.culture_id ? String(service.culture_id) : '');
    setFarmId(service?.farm_id ? String(service.farm_id) : '');
    setServiceDate(service?.service_date?.slice(0, 10) ?? '');
    setDescription(service?.description ?? '');
    setProductId(service?.product_id ? String(service.product_id) : '');
    setRateType((service?.rate_type as ApplicationRateType) ?? '');
    setRateUnit((service?.rate_unit as ApplicationRateUnit) ?? '');
    setRateValue(service?.rate_value != null ? String(service.rate_value) : '');
    setItems(service?.items ?? []);
    setOperators(service?.operators ?? []);
    setLocations(service?.locations ?? []);
    setNewPlotField('');
  }, [open, service]);

  const selectedType = useMemo(
    () => options.serviceTypes.find((t) => String(t.id) === typeId) ?? null,
    [options.serviceTypes, typeId],
  );

  /** Frota de tração filtrada pela função: T → grupo Pulverizador; O → grupo Trator. */
  const fleetOptionsForFunction = (fn: string) =>
    options.fleets
      .filter((fleet) => !fn || fleetGroupMatchesFunction(fleet.fleet_group_name, fn))
      .map((fleet) => ({ value: String(fleet.id), label: fleet.name || fleet.plate }));

  /** Ao trocar a função, desfaz a tração se o veículo escolhido não pertencer ao grupo da nova função. */
  const changeOperatorFunction = (index: number, fn: string) =>
    setOperators((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const fleet = options.fleets.find((f) => String(f.id) === String(row.traction_fleet_id));
        const keepTraction = !fn || (fleet && fleetGroupMatchesFunction(fleet.fleet_group_name, fn));
        return { ...row, function: fn, traction_fleet_id: keepTraction ? row.traction_fleet_id : '' };
      }),
    );

  const plotFieldOptions = useMemo(
    () =>
      options
        .plotFieldsByCrop(cropId || undefined)
        .map((p) => ({ value: String(p.id), label: `${p.name} (${p.area} ha)` })),
    [options, cropId],
  );

  /** Talhão pode repetir: cada clique adiciona uma nova passada. */
  const addItem = () => {
    const plot = options.plotFields.find((p) => String(p.id) === newPlotField);
    if (!plot) return;
    const passNumber = items.filter((i) => String(i.plot_field_id) === String(plot.id)).length + 1;
    setItems((prev) => [
      ...prev,
      {
        plot_field_id: String(plot.id),
        plot_field_name: plot.name,
        area: Number(plot.area) || 0,
        pass_number: passNumber,
        rate_value: null,
      },
    ]);
    setNewPlotField('');
  };

  const addOperator = () =>
    setOperators((prev) => [
      ...prev,
      {
        agricultural_service_type_id: typeId || null,
        agricultural_operator_id: '',
        traction_fleet_id: '',
        implement_fleet_id: '',
        function: '',
      },
    ]);

  const addLocation = () =>
    setLocations((prev) => [...prev, { plot_field_id: '', description: '', length: 0, width: 0 }]);

  const recommendedTotal = totalRecommended(items, rateType || null, num(rateValue));

  const mutation = useMutation({
    mutationFn: async (payload: AgriculturalServicePayload) =>
      service ? agriculturalServicesService.update(service.id, payload) : agriculturalServicesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agricultural-services'] });
      toast.success(service ? 'Serviço atualizado.' : 'Serviço criado como rascunho.');
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const response = (error as { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } } }).response;
      if (response?.status === 422 && response.data?.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(response.data.errors).forEach(([key, messages]) => {
          mapped[key] = messages?.[0] ?? 'Campo inválido.';
        });
        setFieldErrors(mapped);
        toast.error('Verifique os campos destacados.');
        return;
      }
      toast.error(response?.data?.message ?? 'Não foi possível salvar o serviço.');
    },
  });

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!typeId) errors.agricultural_service_type_id = 'Selecione o tipo de serviço.';
    if (!cropId) errors.crop_id = 'Selecione a safra.';
    if (!serviceDate) errors.service_date = 'Informe a data do serviço.';
    if (!isFirebreak && items.length === 0) errors.items = 'Adicione ao menos um talhão.';
    if (isFirebreak && locations.length === 0) errors.locations = 'Adicione ao menos um local de aceiro.';
    if (!applicationProductIsValid({ product_id: productId, rate_type: rateType || null, rate_unit: rateUnit || null, rate_value: num(rateValue) }, selectedType)) {
      errors.product_id = 'Informe o produto e a taxa da aplicação.';
    }
    if (operators.length === 0) {
      errors.operators = 'Adicione ao menos um operador.';
    } else if (operators.some((op) => !operatorIsValid(op, selectedType))) {
      errors.operators = 'Preencha operador, frota, implemento e função.';
    } else if (!hasTankerOperator(operators)) {
      errors.operators = 'Inclua pelo menos um operador com a função Tanqueiro (T).';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload: AgriculturalServicePayload = {
      agricultural_service_type_id: typeId,
      category,
      crop_id: cropId,
      culture_id: cultureId || null,
      farm_id: farmId || null,
      service_date: serviceDate,
      description: description || null,
      product_id: selectedType?.requires_input ? productId : null,
      rate_type: selectedType?.requires_rate ? (rateType || null) : null,
      rate_unit: selectedType?.requires_rate ? (rateUnit || null) : null,
      rate_value: selectedType?.requires_rate && rateType === 'FIXED' ? num(rateValue) : null,
      items: isFirebreak ? [] : items,
      operators,
      locations: isFirebreak ? locations.map((l) => ({ ...l, area: firebreakArea(l) })) : [],
      stock_allocations: service?.stock_allocations ?? [],
    };
    mutation.mutate(payload);
  };

  const errorText = (key: string) =>
    fieldErrors[key] ? <p className="text-xs text-destructive mt-1">{fieldErrors[key]}</p> : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{service ? 'Editar serviço' : 'Novo serviço'}</DialogTitle>
          <DialogDescription>
            O planejamento não movimenta estoque; a baixa acontece somente na conclusão.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="main">
          <TabsList>
            <TabsTrigger value="main">Dados</TabsTrigger>
            {!isFirebreak && <TabsTrigger value="items">Talhões</TabsTrigger>}
            {isFirebreak && <TabsTrigger value="locations">Locais</TabsTrigger>}
            <TabsTrigger value="operators">Operadores</TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Tipo de serviço</Label>
                <Combobox options={options.serviceTypeOptions} value={typeId} onValueChange={setTypeId} placeholder="Selecione" />
                {errorText('agricultural_service_type_id')}
              </div>
              <div>
                <Label>Safra</Label>
                <Combobox
                  options={options.cropOptions}
                  value={cropId}
                  onValueChange={(value) => {
                    setCropId(value);
                    setItems([]);
                  }}
                  placeholder="Selecione"
                />
                {errorText('crop_id')}
              </div>
              <div>
                <Label>Cultura</Label>
                <Combobox options={options.cultureOptions} value={cultureId} onValueChange={setCultureId} placeholder="Opcional" />
              </div>
              <div>
                <Label>Fazenda</Label>
                <Combobox options={options.farmOptions} value={farmId} onValueChange={setFarmId} placeholder="Opcional" />
              </div>
              <div>
                <Label htmlFor="service_date">Data</Label>
                <Input id="service_date" type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
                {errorText('service_date')}
              </div>
            </div>

            {selectedType?.requires_input && (
              <div className="grid gap-4 md:grid-cols-4 border-t pt-4">
                <div className="md:col-span-2">
                  <Label>Produto aplicado</Label>
                  <Combobox options={options.productOptions} value={productId} onValueChange={setProductId} placeholder="Selecione o produto" />
                  {errorText('product_id')}
                </div>
                {selectedType.requires_rate && (
                  <>
                    <div>
                      <Label>Tipo de taxa</Label>
                      <Combobox
                        options={Object.entries(RATE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                        value={rateType}
                        onValueChange={(value) => setRateType(value as ApplicationRateType)}
                        placeholder="Selecione"
                      />
                    </div>
                    <div>
                      <Label>Unidade</Label>
                      <Combobox
                        options={Object.entries(RATE_UNIT_LABELS).map(([value, label]) => ({ value, label }))}
                        value={rateUnit}
                        onValueChange={(value) => setRateUnit(value as ApplicationRateUnit)}
                        placeholder="Selecione"
                      />
                    </div>
                    {rateType === 'FIXED' && (
                      <div>
                        <Label htmlFor="rate_value">Taxa</Label>
                        <Input id="rate_value" value={rateValue} onChange={(e) => setRateValue(e.target.value)} placeholder="0,00" />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="description">Observação</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </TabsContent>

          {!isFirebreak && (
            <TabsContent value="items" className="space-y-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>Talhão</Label>
                  <Combobox options={plotFieldOptions} value={newPlotField} onValueChange={setNewPlotField} placeholder="Selecione o talhão" />
                </div>
                <Button type="button" onClick={addItem} disabled={!newPlotField}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar passada
                </Button>
              </div>
              {errorText('items')}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Talhão</TableHead>
                    <TableHead>Passada</TableHead>
                    <TableHead>Área (ha)</TableHead>
                    {selectedType?.requires_rate && rateType === 'VARIABLE' && <TableHead>Taxa</TableHead>}
                    {selectedType?.requires_input && <TableHead>Recomendado</TableHead>}
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={`${item.plot_field_id}-${index}`}>
                      <TableCell>{item.plot_field_name}</TableCell>
                      <TableCell>{item.pass_number}</TableCell>
                      <TableCell>
                        <Input value={item.area} readOnly disabled aria-label="Área do talhão" />
                      </TableCell>
                      {selectedType?.requires_rate && rateType === 'VARIABLE' && (
                        <TableCell>
                          <Input
                            value={item.rate_value ?? ''}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((row, i) => (i === index ? { ...row, rate_value: num(e.target.value) } : row)),
                              )
                            }
                            placeholder="0,00"
                          />
                        </TableCell>
                      )}
                      {selectedType?.requires_input && (
                        <TableCell>{recommendedForItem(item, rateType || null, num(rateValue))}</TableCell>
                      )}
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end gap-6 text-sm">
                <span>Área total: <strong>{totalArea(items)} ha</strong></span>
                {selectedType?.requires_input && (
                  <span>Total recomendado: <strong>{recommendedTotal}</strong></span>
                )}
              </div>
            </TabsContent>
          )}

          {isFirebreak && (
            <TabsContent value="locations" className="space-y-4">
              <Button type="button" variant="outline" onClick={addLocation}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar local
              </Button>
              {errorText('locations')}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Talhão (opcional)</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Comprimento (m)</TableHead>
                    <TableHead>Largura (m)</TableHead>
                    <TableHead>Área (ha)</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location, index) => (
                    <TableRow key={index}>
                      <TableCell className="min-w-48">
                        <Combobox
                          options={options.plotFieldOptions}
                          value={location.plot_field_id ?? ''}
                          onValueChange={(value) =>
                            setLocations((prev) => prev.map((row, i) => (i === index ? { ...row, plot_field_id: value } : row)))
                          }
                          placeholder="Opcional"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={location.description}
                          onChange={(e) =>
                            setLocations((prev) => prev.map((row, i) => (i === index ? { ...row, description: e.target.value } : row)))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={location.length}
                          onChange={(e) =>
                            setLocations((prev) => prev.map((row, i) => (i === index ? { ...row, length: num(e.target.value) } : row)))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={location.width}
                          onChange={(e) =>
                            setLocations((prev) => prev.map((row, i) => (i === index ? { ...row, width: num(e.target.value) } : row)))
                          }
                        />
                      </TableCell>
                      <TableCell>{firebreakArea(location)}</TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setLocations((prev) => prev.filter((_, i) => i !== index))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          )}

          <TabsContent value="operators" className="space-y-4">
            <Button type="button" variant="outline" onClick={addOperator}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar operador
            </Button>
            {errorText('operators')}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operador</TableHead>
                  <TableHead>Frota de tração</TableHead>
                  <TableHead>Implemento</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {operators.map((operator, index) => (
                  <TableRow key={index}>
                    <TableCell className="min-w-48">
                      <Combobox
                        options={options.operatorOptions}
                        value={operator.agricultural_operator_id}
                        onValueChange={(value) =>
                          setOperators((prev) => prev.map((row, i) => (i === index ? { ...row, agricultural_operator_id: value } : row)))
                        }
                        placeholder="Selecione"
                      />
                    </TableCell>
                    <TableCell className="min-w-48">
                      <Combobox
                        options={fleetOptionsForFunction(operator.function)}
                        value={operator.traction_fleet_id}
                        onValueChange={(value) =>
                          setOperators((prev) => prev.map((row, i) => (i === index ? { ...row, traction_fleet_id: value } : row)))
                        }
                        placeholder={
                          operator.function === 'T'
                            ? 'Somente grupo Pulverizador'
                            : operator.function === 'O'
                              ? 'Somente grupo Trator'
                              : 'Selecione a função primeiro'
                        }
                      />
                    </TableCell>
                    <TableCell className="min-w-48">
                      <Combobox
                        options={options.fleetOptions}
                        value={operator.implement_fleet_id ?? ''}
                        onValueChange={(value) =>
                          setOperators((prev) => prev.map((row, i) => (i === index ? { ...row, implement_fleet_id: value } : row)))
                        }
                        placeholder={selectedType?.requires_implement ? 'Selecione' : 'Opcional'}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={operator.function}
                        onValueChange={(value) => changeOperatorFunction(index, value)}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="O">Operador</SelectItem>
                          <SelectItem value="T">Tanqueiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setOperators((prev) => prev.filter((_, i) => i !== index))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AgriculturalServiceFormDialog;
