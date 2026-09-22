<?php

// Define o namespace do serviço de negócio das OS.
namespace App\Services\Releases\Agricultural\Services\Defensive;

// Importa o model da OS.
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrder;
// Importa o model do item de produto.
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrderProduct;
// Importa o model do operador.
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrderOperator;
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrderOperatorProduct;
// Importa o model da referência anterior.
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrderPreviousOrder;
// Importa o model do fechamento.
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrderClosing;
// Importa o model do tanque.
use App\Models\Releases\Agricultural\Services\Defensive\OperatorTank;
// Importa o model do produto no tanque.
use App\Models\Releases\Agricultural\Services\Defensive\OperatorTankProduct;
// Importa o model de movimento do tanque.
use App\Models\Releases\Agricultural\Services\Defensive\OperatorTankMovement;
use App\Models\Releases\Agricultural\Services\Defensive\OperatorTankWithdrawal;
use App\Models\Releases\Agricultural\Services\Defensive\OperatorTankWithdrawalItem;
// Importa o model de movimento de estoque.
use App\Models\Releases\Agricultural\Services\Defensive\ProductStockMovement;
// Importa o talhão.
use App\Models\Registrations\Property\Areas\Field;
// Importa o produto cadastrado.
use App\Models\Registrations\Product\Product;
use App\Models\Registrations\Vehicle\Fleet;
use App\Models\Registrations\Agricultural\Defensive\AgriculturalProduct;
use App\Models\Registrations\Agricultural\Defensive\AgriculturalOperator;
use App\Models\Registrations\Harvest\Crop;
// Importa o DB para transações e bloqueios.
use Illuminate\Support\Facades\DB;
// Importa o Carbon para datas.
use Carbon\Carbon;
// Importa exceção de regra de negócio.
use RuntimeException;

// Centraliza todas as regras da operação de lançamento, execução e estoque.
class AgriculturalDefensiveOrderService
{
    public function __construct(
        private AgriculturalDefensiveOrderProductSequenceService $productSequenceService
    ) {
    }

    /**
     * Lista as frotas ativas permitidas para a função informada na OS.
     *
     * O = Operador  -> grupo PULVERIZADOR
     * T = Tanqueiro -> grupo TRATOR
     */
    public function fleetsByFunction(string $function)
    {
        $groupName = match ($function) {
            'O' => 'PULVERIZADOR',
            'T' => 'TRATOR',
            default => throw new RuntimeException('A função deve ser O (Operador) ou T (Tanqueiro).'),
        };

        return Fleet::query()
            ->with(['group', 'brand', 'model'])
            ->where('status', 'A')
            ->whereHas('group', fn ($query) => $query
                ->where('status', 'A')
                ->whereRaw('UPPER(TRIM(name)) = ?', [$groupName]))
            ->orderBy('name')
            ->orderBy('id')
            ->get();
    }

    // Lista somente produtos que podem participar de uma OS de defensivos.
    public function eligibleProducts()
    {
        return AgriculturalProduct::query()
            ->with(['product', 'typeFormulation', 'activeIngredients'])
            ->where('status', 'A')
            ->whereHas('product', fn ($query) => $query->where('status', 'A'))
            ->whereHas('typeFormulation', fn ($query) => $query->where('status', 'A'))
            ->orderBy(
                Product::query()
                    ->select('name')
                    ->whereColumn('products.id', 'agricultural_products.product_id')
                    ->limit(1)
            )
            ->get();
    }

    // Lista as OS mais recentes com os relacionamentos principais.
    public function list()
    {
        // Consulta as OS em ordem decrescente.
        return AgriculturalDefensiveOrder::query()
            // Carrega os dados necessários para o frontend.
            ->with(['field', 'crop', 'culture', 'typeOperation', 'products.product', 'operators.operator.supplier', 'operators.fleet', 'operatorProducts.product', 'operatorProducts.order.products', 'operatorProducts.orderOperator.operator.supplier', 'closings.movements.product', 'closings', 'previousOrders.previousOrder'])
            // Ordena pelas mais recentes.
            ->orderByDesc('id')
            // Retorna os registros.
            ->get();
    }

    // Busca uma OS pelo ID.
    public function find(AgriculturalDefensiveOrder $order): AgriculturalDefensiveOrder
    {
        // Recarrega a OS com todas as relações úteis.
        return $order->load(['field', 'crop', 'culture', 'typeOperation', 'products.product', 'operators.operator.supplier', 'operators.fleet', 'operatorProducts.product', 'operatorProducts.order.products', 'operatorProducts.orderOperator.operator.supplier', 'closings.movements.product', 'closings', 'childOrders', 'previousOrders.previousOrder']);
    }

    // Cria uma OS para cada talhão recebido pelo frontend.
    public function create(array $data, ?int $userId = null): array
    {
        // Inicia uma transação para que todas as OS sejam criadas juntas.
        return DB::transaction(function () use ($data, $userId): array {
            // Cria a lista de OS geradas.
            $orders = [];
            // Percorre todos os talhões enviados pelo frontend.
            foreach ($data['fields'] as $fieldData) {
                // Cria uma OS individual para o talhão atual.
                $orders[] = $this->createSingleOrder($data, $fieldData, null);
            }
            // Retorna todas as OS criadas.
            return array_map(fn (AgriculturalDefensiveOrder $order) => $this->find($order), $orders);
        });
    }

    // Atualiza uma OS existente, preservando todo consumo já registrado nos fechamentos.
    public function update(AgriculturalDefensiveOrder $order, array $data): AgriculturalDefensiveOrder
    {
        return DB::transaction(function () use ($order, $data): AgriculturalDefensiveOrder {
            $order = AgriculturalDefensiveOrder::query()->lockForUpdate()->findOrFail($order->id);

            if ($order->status !== 'A') {
                throw new RuntimeException('Somente uma O.S. aberta pode ser alterada.');
            }

            if (count($data['fields']) !== 1) {
                throw new RuntimeException('A alteração de uma O.S. deve informar exatamente um talhão.');
            }

            $fieldData = $data['fields'][0];
            $field = Field::query()->lockForUpdate()->findOrFail($fieldData['field_id']);
            $requestedArea = round((float) $fieldData['area'], 3);
            $usedArea = (float) AgriculturalDefensiveOrder::query()
                ->where('field_id', $field->id)
                ->where('status', 'A')
                ->where('id', '<>', $order->id)
                ->sum('area');
            $availableArea = round((float) $field->area - $usedArea, 3);

            if ($requestedArea > $availableArea + 0.0000001) {
                throw new RuntimeException("A área solicitada para o talhão {$field->name} excede a área disponível de {$availableArea}.");
            }

            $recommendedPump = round($requestedArea / (float) $data['pump_capacity'], 3);
            $newTankOperatorIds = collect($data['operators'])
                ->where('function', 'T')
                ->pluck('operator_id')
                ->map(fn ($id) => (int) $id)
                ->unique();

            if ($newTankOperatorIds->isEmpty()) {
                throw new RuntimeException('A O.S. deve possuir pelo menos um operador com a função Tanqueiro.');
            }

            $closingOperatorIds = $order->closings()
                ->join('operator_tanks', 'operator_tanks.id', '=', 'agricultural_defensive_order_closings.operator_tank_id')
                ->pluck('operator_tanks.operator_id')
                ->map(fn ($id) => (int) $id)
                ->unique();

            if ($closingOperatorIds->diff($newTankOperatorIds)->isNotEmpty()) {
                throw new RuntimeException('Não é possível remover um tanqueiro que já possui fechamento registrado nesta O.S.');
            }

            $order->update([
                'field_id' => $field->id,
                'area' => $requestedArea,
                'crop_id' => $data['crop_id'],
                'culture_id' => $data['culture_id'],
                'type_operation_id' => $data['type_operation_id'],
                'application_date' => $data['application_date'],
                'pump_volume' => $data['pump_volume'],
                'recommended_pump' => $recommendedPump,
                'flow' => $data['flow'],
                'pump_capacity' => $data['pump_capacity'],
                'observation' => $data['observation'] ?? $order->observation,
                'status' => $data['status'] ?? $order->status,
            ]);

            $sortedProducts = collect($this->productSequenceService->sortForCreation($data['products']));
            $requestedProductIds = $sortedProducts->pluck('product_id')->map(fn ($id) => (int) $id);
            $existingProducts = $order->products()->lockForUpdate()->get()->keyBy('product_id');

            foreach ($sortedProducts as $productData) {
                $existingProduct = $existingProducts->get((int) $productData['product_id']);
                if ($existingProduct
                    && (float) $existingProduct->actual_quantity > 0
                    && abs((float) $existingProduct->pump - (float) $productData['pump']) > 0.0000001) {
                    throw new RuntimeException(
                        "Não é possível alterar a quantidade por bomba do produto {$existingProduct->product_id}, pois ele já possui consumo registrado."
                    );
                }
            }

            foreach ($existingProducts as $existingProduct) {
                if ($requestedProductIds->contains((int) $existingProduct->product_id)) {
                    continue;
                }
                if ((float) $existingProduct->actual_quantity > 0) {
                    throw new RuntimeException("Não é possível remover o produto {$existingProduct->product_id}, pois ele já possui consumo registrado.");
                }
                $existingProduct->delete();
            }

            foreach ($sortedProducts as $productData) {
                $product = $existingProducts->get((int) $productData['product_id']);
                $values = [
                    'sequence' => $productData['sequence'],
                    'dose' => $productData['dose'],
                    'pump' => $productData['pump'],
                    'recommended_quantity' => round((float) $productData['pump'] * $recommendedPump, 3),
                ];

                if ($product) {
                    $product->update($values);
                } else {
                    AgriculturalDefensiveOrderProduct::create(array_merge($values, [
                        'agricultural_defensive_order_id' => $order->id,
                        'product_id' => $productData['product_id'],
                        'used_bomb' => 0,
                        'actual_quantity' => 0,
                        'actual_dose' => null,
                    ]));
                }
            }

            // A associação operador/produto representa o planejamento atual e pode ser reconstruída.
            AgriculturalDefensiveOrderOperatorProduct::query()
                ->where('agricultural_defensive_order_id', $order->id)
                ->delete();
            $order->operators()->delete();

            foreach ($data['operators'] as $operatorData) {
                AgriculturalDefensiveOrderOperator::create([
                    'agricultural_defensive_order_id' => $order->id,
                    'operator_id' => $operatorData['operator_id'],
                    'fleet_id' => $operatorData['fleet_id'] ?? null,
                    'function' => $operatorData['function'],
                ]);
            }

            $tankOperators = $order->operators()->where('function', 'T')->get();
            $orderProducts = $order->products()->get();
            foreach ($tankOperators as $tankOperator) {
                foreach ($orderProducts as $orderProduct) {
                    AgriculturalDefensiveOrderOperatorProduct::create([
                        'agricultural_defensive_order_id' => $order->id,
                        'agricultural_defensive_order_operator_id' => $tankOperator->id,
                        'product_id' => $orderProduct->product_id,
                        'dose' => $orderProduct->dose,
                        'pump' => $orderProduct->pump,
                        'area' => $requestedArea,
                        'planned_quantity' => round((float) $orderProduct->pump * $recommendedPump, 3),
                    ]);
                }
            }

            return $this->find($order->refresh());
        });
    }

    // Cria uma única OS para um único talhão.
    private function createSingleOrder(
        array $data,
        array $fieldData,
        ?int $parentOrderId,
        bool $validateAvailableArea = true
    ): AgriculturalDefensiveOrder
    {
        // Bloqueia o talhão durante a validação da área para evitar corrida concorrente.
        $field = Field::query()->lockForUpdate()->findOrFail($fieldData['field_id']);
        // Converte a área informada para número decimal.
        $requestedArea = (float) $fieldData['area'];
        // Calcula as bombas recomendadas especificamente para a área desta OS.
        // O valor recebido do frontend não é reutilizado entre talhões.
        $recommendedPump = round($requestedArea / (float) $data['pump_capacity'], 3);
        // Calcula a área já comprometida por outras OS do mesmo talhão.
        $usedArea = (float) AgriculturalDefensiveOrder::query()->where('field_id', $field->id)->whereIn('status', ['A'])->sum('area');
        // Calcula a área que ainda está disponível.
        $availableArea = (float) $field->area - $usedArea;
        // Impede que o frontend ultrapasse a área disponível real.
        if ($validateAvailableArea && $requestedArea > $availableArea + 0.0000001) {
            throw new RuntimeException("A área solicitada para o talhão {$field->name} excede a área disponível de {$availableArea}.");
        }
        // Cria a OS sem número para que o ID possa definir o número de forma segura.
        $order = AgriculturalDefensiveOrder::create([
            // O número será definido imediatamente após a criação.
            'os_number' => null,
            // Guarda a OS pai quando existir.
            'parent_order_id' => $parentOrderId,
            // Guarda o único talhão.
            'field_id' => $field->id,
            // Guarda a área solicitada.
            'area' => $requestedArea,
            // Copia os dados gerais da solicitação.
            'crop_id' => $data['crop_id'],
            // Copia a cultura.
            'culture_id' => $data['culture_id'],
            // Copia a operação.
            'type_operation_id' => $data['type_operation_id'],
            // Copia a data.
            'application_date' => $data['application_date'],
            // Copia o volume.
            'pump_volume' => $data['pump_volume'],
            // Grava as bombas recomendadas calculadas para o talhão atual.
            'recommended_pump' => $recommendedPump,
            // Copia a vazão.
            'flow' => $data['flow'],
            // Copia a capacidade.
            'pump_capacity' => $data['pump_capacity'],
            // Inicia as bombas reais em zero.
            'used_bomb' => 0,
            // Guarda a observação informada ou gerada pela reemissão.
            'observation' => $data['observation'] ?? null,
            // Usa o status informado ou ativo.
            'status' => $data['status'] ?? 'A',
        ]);
        // Usa o ID auto incrementável como número público da OS, evitando colisões.
        $order->update(['os_number' => $order->id]);
        // Registra os operadores.
        foreach ($data['operators'] as $operator) {
            // Cria a participação do operador.
            AgriculturalDefensiveOrderOperator::create([
                // Liga à OS.
                'agricultural_defensive_order_id' => $order->id,
                // Liga ao operador.
                'operator_id' => $operator['operator_id'],
                // Liga à frota quando informada.
                'fleet_id' => $operator['fleet_id'] ?? null,
                // Guarda a função.
                'function' => $operator['function'],
            ]);
        }
        // Ordena por formulação e preserva a ordem manual entre formulações empatadas.
        $sortedProducts = $this->productSequenceService->sortForCreation($data['products']);
        // Registra os produtos planejados.
        foreach ($sortedProducts as $productData) {
            // Cria o item da OS.
            AgriculturalDefensiveOrderProduct::create([
                // Liga à OS.
                'agricultural_defensive_order_id' => $order->id,
                // Liga ao produto.
                'product_id' => $productData['product_id'],
                // Guarda a sequência canônica, compartilhada por todos os operadores T.
                'sequence' => $productData['sequence'],
                // Preserva a dose recomendada/histórica.
                'dose' => $productData['dose'],
                // Preserva a quantidade recomendada por bomba.
                'pump' => $productData['pump'],
                // Ainda não há bombas reais utilizadas.
                'used_bomb' => 0,
                // Calcula o total do produto: quantidade por bomba x bombas recomendadas da OS.
                'recommended_quantity' => round(
                    (float) $productData['pump'] * $recommendedPump,
                    3
                ),
                // Ainda não há consumo real.
                'actual_quantity' => 0,
                // Mantém a dose real vazia até a execução.
                'actual_dose' => null,
            ]);
        }
        // Cria a relação específica entre cada operador de tanque (T) e cada produto da OS.
        $tankOperators = AgriculturalDefensiveOrderOperator::query()
            ->where('agricultural_defensive_order_id', $order->id)
            ->where('function', 'T')
            ->get();
        $orderProducts = $order->products()->get();
        foreach ($tankOperators as $tankOperator) {
            foreach ($orderProducts as $orderProduct) {
                AgriculturalDefensiveOrderOperatorProduct::create([
                    'agricultural_defensive_order_id' => $order->id,
                    'agricultural_defensive_order_operator_id' => $tankOperator->id,
                    'product_id' => $orderProduct->product_id,
                    'dose' => $orderProduct->dose,
                    'pump' => $orderProduct->pump,
                    'area' => $requestedArea,
                    'planned_quantity' => round(
                        (float) $orderProduct->pump * $recommendedPump,
                        3
                    ),
                ]);
            }
        }
        // Retorna a OS criada.
        return $order->refresh();
    }

    // Altera a sequência manual dos produtos sem desrespeitar a formulação.
    public function reorderProducts(AgriculturalDefensiveOrder $order, array $productIds): AgriculturalDefensiveOrder
    {
        return DB::transaction(function () use ($order, $productIds): AgriculturalDefensiveOrder {
            $lockedOrder = AgriculturalDefensiveOrder::query()->lockForUpdate()->findOrFail($order->id);
            $this->productSequenceService->reorder($lockedOrder, $productIds);

            return $this->find($lockedOrder->refresh());
        });
    }

    // Cria ordens filhas a partir do fluxo de fechamento/reemissão.
    public function reissue(AgriculturalDefensiveOrder $parent, array $data): array
    {
        return DB::transaction(function () use ($parent, $data): array {
            $parent = AgriculturalDefensiveOrder::query()
                ->with('field')
                ->lockForUpdate()
                ->findOrFail($parent->id);

            if ($parent->status !== 'A') {
                throw new RuntimeException('Somente uma O.S. aberta pode gerar ordens filhas.');
            }

            if (empty($data['previous_os'])) {
                throw new RuntimeException('Informe pelo menos uma O.S. anterior para realizar a reemissão.');
            }

            $children = [];
            $parentTrace = [];

            // Cada ocorrência informada gera uma filha independente.
            foreach ($data['previous_os'] as $previous) {
                $previousOrder = AgriculturalDefensiveOrder::query()
                    ->with(['products', 'operators'])
                    ->where('os_number', $previous['os_number'])
                    ->lockForUpdate()
                    ->firstOrFail();

                if ((int) $previousOrder->id === (int) $parent->id) {
                    throw new RuntimeException('A O.S. pai não pode ser usada como O.S. anterior dela mesma.');
                }

                $quantityUsed = round((float) $previous['quantity_used'], 3);
                if ($quantityUsed <= 0) {
                    throw new RuntimeException("A quantidade usada da O.S. {$previousOrder->os_number} deve ser maior que zero.");
                }

                $tankOperators = $previousOrder->operators
                    ->where('function', 'T')
                    ->values();
                if ($tankOperators->isEmpty()) {
                    throw new RuntimeException("A O.S. anterior {$previousOrder->os_number} não possui tanqueiro.");
                }
                if ($previousOrder->products->isEmpty()) {
                    throw new RuntimeException("A O.S. anterior {$previousOrder->os_number} não possui produtos.");
                }

                $pumpCapacity = round((float) $previousOrder->pump_capacity, 3);
                $fieldName = $parent->field?->name ?: (string) $parent->field_id;
                $childObservation = sprintf(
                    'O.S. filha da O.S. %s, gerada a partir da O.S. anterior %s, no talhão %s.',
                    $parent->os_number,
                    $previousOrder->os_number,
                    $fieldName
                );

                $childData = [
                    'crop_id' => $parent->crop_id,
                    'culture_id' => $parent->culture_id ?: $previousOrder->culture_id,
                    'type_operation_id' => $parent->type_operation_id,
                    'application_date' => $parent->application_date?->format('Y-m-d'),
                    'pump_volume' => $previousOrder->pump_volume,
                    'flow' => $previousOrder->flow,
                    'pump_capacity' => $pumpCapacity,
                    'status' => 'F',
                    'observation' => $childObservation,
                    'operators' => $tankOperators->map(fn ($operator): array => [
                        'operator_id' => $operator->operator_id,
                        'fleet_id' => $operator->fleet_id,
                        'function' => 'T',
                    ])->all(),
                    'products' => $previousOrder->products->map(fn ($product): array => [
                        'product_id' => $product->product_id,
                        'dose' => $product->dose,
                        'pump' => $product->pump,
                    ])->all(),
                ];

                // A filha representa reaplicação no mesmo talhão da pai; por
                // isso não consome uma nova área disponível do cadastro.
                $child = $this->createSingleOrder($childData, [
                    'field_id' => $parent->field_id,
                    'area' => 0,
                ], $parent->id, false);

                // A ordem filha documenta uma reaplicação já executada. Por isso,
                // recomendado e utilizado recebem a mesma quantidade informada.
                $child->update([
                    'area' => 0,
                    'recommended_pump' => $quantityUsed,
                    'used_bomb' => $quantityUsed,
                    'status' => 'F',
                ]);
                foreach ($child->products()->get() as $childProduct) {
                    $usedQuantity = round((float) $childProduct->pump * $quantityUsed, 3);
                    $childProduct->update([
                        'used_bomb' => $quantityUsed,
                        'recommended_quantity' => $usedQuantity,
                        'actual_quantity' => $usedQuantity,
                        'actual_dose' => null,
                    ]);
                }
                foreach ($child->operatorProducts()->get() as $operatorProduct) {
                    $operatorProduct->update([
                        'area' => 0,
                        'planned_quantity' => round((float) $operatorProduct->pump * $quantityUsed, 3),
                    ]);
                }

                AgriculturalDefensiveOrderPreviousOrder::create([
                    'order_id' => $child->id,
                    'previous_order_id' => $previousOrder->id,
                    'quantity_used' => $quantityUsed,
                ]);

                $parentTrace[] = sprintf(
                    'O.S. filha %s (O.S. anterior %s, talhão %s)',
                    $child->os_number,
                    $previousOrder->os_number,
                    $fieldName
                );
                $children[] = $child;
            }

            $trace = 'Ordens filhas geradas: '.implode('; ', $parentTrace).'.';
            $parent->update([
                'observation' => trim(implode("\n", array_filter([$parent->observation, $trace]))),
            ]);

            return array_map(fn (AgriculturalDefensiveOrder $order) => $this->find($order), $children);
        });
    }

    // Realiza um fechamento parcial ou final e consome o tanque.
    public function close(array $data, ?int $userId = null): AgriculturalDefensiveOrder
    {
        return DB::transaction(function () use ($data, $userId): AgriculturalDefensiveOrder {
            $legacyPayload = empty($data['os_number']) && !empty($data['order_id']);
            $order = AgriculturalDefensiveOrder::query()
                ->when(
                    $legacyPayload,
                    fn ($query) => $query->whereKey($data['order_id']),
                    fn ($query) => $query->where('os_number', $data['os_number'])
                )
                ->lockForUpdate()
                ->firstOrFail();

            if ($order->status !== 'A') {
                throw new RuntimeException('A OS não está aberta para fechamento.');
            }

            $closingBomb = round((float) $data['closing_bomb'], 3);
            $tank = $legacyPayload
                ? $this->resolveLegacyClosingTank($order, (int) $data['operator_tank_id'], $closingBomb)
                : OperatorTank::query()->lockForUpdate()->findOrFail($data['operator_tank_id']);

            if ($tank->date->lt($order->application_date->copy()->startOfDay())) {
                throw new RuntimeException('O tanque do operador não pode ser anterior à data programada da OS.');
            }

            $isTankOperator = AgriculturalDefensiveOrderOperator::query()
                ->where('agricultural_defensive_order_id', $order->id)
                ->where('operator_id', $tank->operator_id)
                ->where('function', 'T')
                ->exists();

            if (!$isTankOperator) {
                throw new RuntimeException('O operador do tanque precisa estar relacionado à OS com a função T.');
            }

            $newUsedBomb = round((float) $order->used_bomb + $closingBomb, 3);

            $closing = AgriculturalDefensiveOrderClosing::create([
                'agricultural_defensive_order_id' => $order->id,
                'operator_tank_id' => $tank->id,
                'closing_bomb' => $closingBomb,
                'closing_type' => $data['closing_type'],
                'closed_at' => Carbon::now(),
                'created_by' => $userId,
            ]);

            foreach ($order->products()->lockForUpdate()->get() as $item) {
                $tankProduct = OperatorTankProduct::query()
                    ->where('operator_tank_id', $tank->id)
                    ->where('product_id', $item->product_id)
                    ->lockForUpdate()
                    ->first();

                if (!$tankProduct) {
                    throw new RuntimeException("O produto {$item->product_id} não possui saldo no tanque do operador.");
                }

                // Cada fechamento baixa exatamente: bombas do evento × pump do produto.
                $closingQuantity = round($closingBomb * (float) $item->pump, 3);
                if ((float) $tankProduct->current_quantity < $closingQuantity - 0.0000001) {
                    throw new RuntimeException("Saldo insuficiente do produto {$item->product_id} no tanque.");
                }

                $actualQuantity = round((float) $item->actual_quantity + $closingQuantity, 3);
                $actualDose = $actualQuantity > 0
                    ? round((float) $order->area / $actualQuantity, 3)
                    : null;

                $item->update([
                    'used_bomb' => $newUsedBomb,
                    'actual_dose' => $actualDose,
                    'actual_quantity' => $actualQuantity,
                ]);

                $tankProduct->update([
                    'used_quantity' => round((float) $tankProduct->used_quantity + $closingQuantity, 3),
                    'current_quantity' => round((float) $tankProduct->current_quantity - $closingQuantity, 3),
                ]);

                OperatorTankMovement::create([
                    'operator_tank_id' => $tank->id,
                    'product_id' => $item->product_id,
                    'closing_id' => $closing->id,
                    'order_id' => $order->id,
                    'movement_type' => 'USAGE',
                    'quantity' => $closingQuantity,
                    'observation' => 'Consumo de produto no fechamento da OS: bombas utilizadas × pump do produto.',
                ]);
            }

            $order->update(['used_bomb' => $newUsedBomb]);

            if ($data['closing_type'] === 'FINAL') {
                $order->update(['status' => 'F']);
            }

            // Recompõe os saldos transportados caso o fechamento tenha sido
            // registrado em um tanque anterior a outros tanques já existentes.
            $lastTankDate = OperatorTank::query()
                ->where('operator_id', $tank->operator_id)
                ->max('date');
            $this->synchronizeTankBalancesThroughDate(
                (int) $tank->operator_id,
                Carbon::parse($lastTankDate ?: $tank->date)->toDateString()
            );

            return $this->find($order->refresh());
        });
    }

    /**
     * Compatibilidade com a tela atual, que envia operator_id dentro de
     * operator_tank_id. Localiza o primeiro tanque cronológico, a partir da
     * data da OS, com saldo suficiente para todos os produtos do fechamento.
     */
    private function resolveLegacyClosingTank(
        AgriculturalDefensiveOrder $order,
        int $operatorId,
        float $closingBomb
    ): OperatorTank {
        $isTankOperator = AgriculturalDefensiveOrderOperator::query()
            ->where('agricultural_defensive_order_id', $order->id)
            ->where('operator_id', $operatorId)
            ->where('function', 'T')
            ->exists();

        if (!$isTankOperator) {
            throw new RuntimeException('O tanqueiro informado não está relacionado à OS com a função T.');
        }

        $lastTankDate = OperatorTank::query()
            ->where('operator_id', $operatorId)
            ->max('date');
        if ($lastTankDate) {
            $this->synchronizeTankBalancesThroughDate(
                $operatorId,
                Carbon::parse($lastTankDate)->toDateString()
            );
        }

        $products = $order->products()->lockForUpdate()->get();
        $tanks = OperatorTank::query()
            ->where('operator_id', $operatorId)
            ->whereDate('date', '>=', $order->application_date->toDateString())
            ->with('products')
            ->orderBy('date')
            ->orderBy('id')
            ->lockForUpdate()
            ->get();

        if ($tanks->isEmpty()) {
            throw new RuntimeException('Nenhum tanque operacional foi encontrado para o tanqueiro a partir da data da OS.');
        }

        foreach ($tanks as $tank) {
            $balances = $tank->products->keyBy('product_id');
            $hasBalance = $products->every(function ($product) use ($balances, $closingBomb): bool {
                $required = round($closingBomb * (float) $product->pump, 3);
                return (float) ($balances->get($product->product_id)?->current_quantity ?? 0) >= $required - 0.0000001;
            });

            if ($hasBalance) {
                return $tank;
            }
        }

        throw new RuntimeException('Nenhum tanque do operador possui saldo suficiente para todos os produtos deste fechamento.');
    }

    public function activeCrops()
    {
        return \App\Models\Registrations\Harvest\Crop::query()
            ->where('status', 'A')
            ->orderBy('name')
            ->get(['id', 'name', 'status']);
    }

    public function tankOperators(int $cropId)
    {
        return AgriculturalDefensiveOrderOperator::query()
            ->where('function', 'T')
            ->whereHas('order', fn ($q) => $q->where('crop_id', $cropId)->where('status', 'A'))
            ->whereHas('operator', fn ($q) => $q->where('status', 'A'))
            ->with('operator.supplier')
            ->get()
            ->unique('operator_id')
            ->map(fn (AgriculturalDefensiveOrderOperator $orderOperator) => [
                'id' => $orderOperator->operator_id,
                'name' => $orderOperator->operator?->supplier?->fantasy_name
                    ?: $orderOperator->operator?->supplier?->corporate_reason
                    ?: 'Operador sem nome',
            ])
            ->values();
    }

    public function tankDates(int $cropId)
    {
        return AgriculturalDefensiveOrder::query()
            ->where('crop_id', $cropId)
            ->where('status', 'A')
            ->whereHas('operators', fn ($q) => $q->where('function', 'T'))
            ->select('application_date')
            ->distinct()
            ->orderBy('application_date')
            ->pluck('application_date')
            ->map(fn ($date) => [
                'date' => Carbon::parse($date)->toDateString(),
            ])
            ->values();
    }

    public function openTankDates(int $cropId, int $operatorId)
    {
        $openDates = AgriculturalDefensiveOrder::query()
            ->where('crop_id', $cropId)
            ->where('status', 'A')
            ->whereHas('operators', fn ($q) => $q
                ->where('operator_id', $operatorId)
                ->where('function', 'T'))
            ->selectRaw('DATE(application_date) as date, COUNT(*) as open_orders')
            ->groupByRaw('DATE(application_date)')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'date' => Carbon::parse($row->date)->toDateString(),
                'open_orders' => (int) $row->open_orders,
            ])
            ->keyBy('date');

        // Mantém acessíveis os tanques que ainda possuem saldo, mesmo quando
        // todas as O.S. daquela data já foram finalizadas.
        OperatorTank::query()
            ->where('operator_id', $operatorId)
            ->where('status', 'A')
            ->whereHas('products', fn ($query) => $query->where('current_quantity', '>', 0))
            ->orderBy('date')
            ->pluck('date')
            ->each(function ($date) use ($openDates): void {
                $formattedDate = Carbon::parse($date)->toDateString();
                if (! $openDates->has($formattedDate)) {
                    $openDates->put($formattedDate, [
                        'date' => $formattedDate,
                        'open_orders' => 0,
                    ]);
                }
            });

        return $openDates->sortKeys()->values();
    }

    public function tankProductPlanning(int $cropId, int $operatorId, string $date): array
    {
        $selectedDate = Carbon::parse($date)->toDateString();
        $crop = Crop::query()->findOrFail($cropId);
        $operator = AgriculturalOperator::query()
            ->where('status', 'A')
            ->with('supplier')
            ->findOrFail($operatorId);

        $orders = AgriculturalDefensiveOrder::query()
            ->where('crop_id', $cropId)
            ->where('status', 'A')
            ->whereDate('application_date', '<=', $selectedDate)
            ->whereHas('operators', fn ($q) => $q
                ->where('operator_id', $operatorId)
                ->where('function', 'T'))
            ->with(['field', 'products.product'])
            ->orderBy('id')
            ->get();

        $tank = $this->getOrCreateTank($operatorId, $selectedDate);
        $balances = $tank->products->keyBy('product_id');
        $grouped = [];
        $totalArea = 0.0;
        $partiallyCompletedArea = 0.0;

        foreach ($orders as $order) {
            $area = round((float) $order->area, 3);
            $recommendedPump = (float) $order->recommended_pump;
            $usedBomb = min((float) $order->used_bomb, $recommendedPump);
            $completedArea = $recommendedPump > 0
                ? round($area * ($usedBomb / $recommendedPump), 3)
                : 0.0;
            $totalArea = round($totalArea + $area, 3);
            $partiallyCompletedArea = round($partiallyCompletedArea + $completedArea, 3);

            foreach ($order->products as $orderProduct) {
                $key = (int) $orderProduct->product_id;
                // Recalcula pela regra canônica para corrigir também OS abertas antigas.
                $planned = round(
                    (float) $orderProduct->pump * (float) $order->recommended_pump,
                    3
                );
                $used = round((float) ($orderProduct->actual_quantity ?? 0), 3);
                $remaining = round(max($planned - $used, 0), 3);

                if (!isset($grouped[$key])) {
                    $grouped[$key] = [
                        'product_id' => $key,
                        'product_name' => $orderProduct->product?->name,
                        'dose' => (float) $orderProduct->dose,
                        'pump' => (float) $orderProduct->pump,
                        'planned_quantity' => 0.0,
                        'used_quantity' => 0.0,
                        'open_quantity' => 0.0,
                        'tank_balance' => round((float) ($balances->get($key)?->current_quantity ?? 0), 3),
                        'additional_need' => 0.0,
                        'orders' => [],
                    ];
                }

                $grouped[$key]['planned_quantity'] = round($grouped[$key]['planned_quantity'] + $planned, 3);
                $grouped[$key]['used_quantity'] = round($grouped[$key]['used_quantity'] + $used, 3);
                $grouped[$key]['open_quantity'] = round($grouped[$key]['open_quantity'] + $remaining, 3);
                $grouped[$key]['orders'][] = [
                    'order_id' => $order->id,
                    'os_number' => $order->os_number,
                    'application_date' => $order->application_date?->format('Y-m-d'),
                    'field_id' => $order->field_id,
                    'field_name' => $order->field?->name,
                    'area' => (float) $order->area,
                    'pump' => (float) $orderProduct->pump,
                    'planned_quantity' => $planned,
                    'used_quantity' => $used,
                    'open_quantity' => $remaining,
                ];
            }
        }

        foreach ($grouped as &$product) {
            $product['additional_need'] = round(max($product['open_quantity'] - $product['tank_balance'], 0), 3);
            $product['suggested_withdrawal'] = $product['additional_need'];
        }
        unset($product);

        // Produtos remanescentes no tanque também precisam aparecer para que
        // possam ser devolvidos, mesmo sem necessidade em uma O.S. aberta.
        foreach ($balances as $productId => $tankProduct) {
            $key = (int) $productId;
            $tankBalance = round((float) $tankProduct->current_quantity, 3);
            if (isset($grouped[$key]) || $tankBalance <= 0) {
                continue;
            }

            $grouped[$key] = [
                'product_id' => $key,
                'product_name' => $tankProduct->product?->name,
                'dose' => 0.0,
                'pump' => 0.0,
                'planned_quantity' => 0.0,
                'used_quantity' => 0.0,
                'open_quantity' => 0.0,
                'tank_balance' => $tankBalance,
                'additional_need' => 0.0,
                'suggested_withdrawal' => 0.0,
                'orders' => [],
            ];
        }

        return [
            'operator_tank_id' => $tank->id,
            'crop' => [
                'id' => $crop->id,
                'name' => $crop->name,
            ],
            'operator' => [
                'id' => $operator->id,
                'name' => $operator->supplier?->fantasy_name
                    ?: $operator->supplier?->corporate_reason
                    ?: 'Operador sem nome',
            ],
            'date' => $selectedDate,
            'summary' => [
                'open_orders' => $orders->count(),
                'total_open_area' => $totalArea,
                'partially_completed_area' => $partiallyCompletedArea,
                'remaining_area' => round(max($totalArea - $partiallyCompletedArea, 0), 3),
            ],
            'products' => array_values($grouped),
        ];
    }

    public function withdrawals(array $filters = [])
    {
        return OperatorTankWithdrawal::query()
            ->with(['crop', 'tank.operator.supplier', 'creator'])
            ->withCount('items')
            ->when($filters['crop_id'] ?? null, fn ($q, $value) => $q->where('crop_id', $value))
            ->when($filters['operator_id'] ?? null, fn ($q, $value) => $q->whereHas('tank', fn ($tank) => $tank->where('operator_id', $value)))
            ->when($filters['date_from'] ?? null, fn ($q, $value) => $q->whereDate('occurred_at', '>=', $value))
            ->when($filters['date_to'] ?? null, fn ($q, $value) => $q->whereDate('occurred_at', '<=', $value))
            ->when($filters['product_id'] ?? null, fn ($q, $value) => $q->whereHas('items', fn ($item) => $item->where('product_id', $value)))
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->get();
    }

    /**
     * Consolida as movimentações do tanqueiro dentro de uma safra.
     * Os fechamentos parciais e finais são contabilizados pelos movimentos USAGE.
     */
    public function tankConsolidation(int $cropId, int $operatorId): array
    {
        Crop::query()->findOrFail($cropId);
        AgriculturalOperator::query()->findOrFail($operatorId);

        $withdrawn = DB::table('operator_tank_withdrawal_items as item')
            ->join('operator_tank_withdrawals as withdrawal', 'withdrawal.id', '=', 'item.operator_tank_withdrawal_id')
            ->join('operator_tanks as tank', 'tank.id', '=', 'withdrawal.operator_tank_id')
            ->where('withdrawal.crop_id', $cropId)
            ->where('withdrawal.status', 'A')
            ->where('tank.operator_id', $operatorId)
            ->groupBy('item.product_id')
            ->selectRaw('item.product_id, SUM(item.quantity) as total')
            ->pluck('total', 'item.product_id');

        $used = DB::table('operator_tank_movements as movement')
            ->join('operator_tanks as tank', 'tank.id', '=', 'movement.operator_tank_id')
            ->join('agricultural_defensive_orders as orders', 'orders.id', '=', 'movement.order_id')
            ->where('movement.movement_type', 'USAGE')
            ->where('orders.crop_id', $cropId)
            ->where('tank.operator_id', $operatorId)
            ->groupBy('movement.product_id')
            ->selectRaw('movement.product_id, SUM(movement.quantity) as total')
            ->pluck('total', 'movement.product_id');

        $cropTankIds = DB::table('operator_tank_withdrawals as withdrawal')
            ->join('operator_tanks as tank', 'tank.id', '=', 'withdrawal.operator_tank_id')
            ->where('withdrawal.crop_id', $cropId)
            ->where('withdrawal.status', 'A')
            ->where('tank.operator_id', $operatorId)
            ->pluck('withdrawal.operator_tank_id')
            ->unique()
            ->values();

        $returned = $cropTankIds->isEmpty()
            ? collect()
            : DB::table('operator_tank_movements')
                ->whereIn('operator_tank_id', $cropTankIds)
                ->where('movement_type', 'RETURN')
                ->groupBy('product_id')
                ->selectRaw('product_id, SUM(quantity) as total')
                ->pluck('total', 'product_id');

        $latestTankId = OperatorTank::query()
            ->where('operator_id', $operatorId)
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->value('id');

        $balances = $latestTankId
            ? OperatorTankProduct::query()
                ->where('operator_tank_id', $latestTankId)
                ->pluck('current_quantity', 'product_id')
            : collect();

        $productIds = collect($withdrawn->keys())
            ->merge($used->keys())
            ->merge($returned->keys())
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $products = Product::query()
            ->whereIn('id', $productIds)
            ->get(['id', 'name', 'unit'])
            ->keyBy('id');

        return $productIds
            ->map(function (int $productId) use ($products, $withdrawn, $used, $returned, $balances): array {
                $product = $products->get($productId);

                return [
                    'product_id' => $productId,
                    'product_name' => $product?->name ?? "Produto {$productId}",
                    'unit' => $product?->unit,
                    'withdrawn_quantity' => round((float) ($withdrawn[$productId] ?? 0), 3),
                    'used_quantity' => round((float) ($used[$productId] ?? 0), 3),
                    'current_quantity' => round((float) ($balances[$productId] ?? 0), 3),
                    'returned_quantity' => round((float) ($returned[$productId] ?? 0), 3),
                ];
            })
            ->sortBy('product_name', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->all();
    }

    public function withdrawal(OperatorTankWithdrawal $withdrawal): OperatorTankWithdrawal
    {
        return $withdrawal->load(['crop', 'tank.operator.supplier', 'creator', 'items.product']);
    }

    public function withdrawForOperator(array $data, ?int $userId = null): OperatorTankWithdrawal
    {
        return DB::transaction(function () use ($data, $userId): OperatorTankWithdrawal {
            $crop = \App\Models\Registrations\Harvest\Crop::query()->findOrFail($data['crop_id']);
            if ($crop->status !== 'A') {
                throw new RuntimeException('A safra selecionada está inativa.');
            }

            $operatorParticipates = AgriculturalDefensiveOrderOperator::query()
                ->where('operator_id', $data['operator_id'])
                ->where('function', 'T')
                ->whereHas('order', fn ($q) => $q->where('crop_id', $crop->id)->where('status', 'A'))
                ->exists();

            if (!$operatorParticipates) {
                throw new RuntimeException('O operador selecionado não possui participação T em OS abertas da safra.');
            }

            $availableDates = $this->openTankDates($crop->id, $data['operator_id'])
                ->where('open_orders', '>', 0)
                ->pluck('date')
                ->all();
            if (!in_array(Carbon::parse($data['date'])->format('Y-m-d'), $availableDates, true)) {
                throw new RuntimeException('A data selecionada não possui OS aberta para a safra com participação do operador.');
            }

            $tank = $this->getOrCreateTank($data['operator_id'], $data['date']);
            $tank = OperatorTank::query()->lockForUpdate()->findOrFail($tank->id);

            $withdrawal = OperatorTankWithdrawal::create([
                'withdrawal_number' => null,
                'crop_id' => $crop->id,
                'operator_tank_id' => $tank->id,
                'cutoff_date' => Carbon::parse($data['date'])->toDateString(),
                'occurred_at' => now(),
                'observation' => $data['observation'] ?? null,
                'created_by' => $userId,
                'status' => 'A',
            ]);
            $withdrawal->update([
                'withdrawal_number' => sprintf('RET-%s-%06d', now()->format('Y'), $withdrawal->id),
            ]);

            foreach ($data['products'] as $productData) {
                $product = Product::query()->lockForUpdate()->findOrFail($productData['product_id']);
                $quantity = round((float) $productData['quantity'], 3);

                if ((float) ($product->stock ?? 0) < $quantity - 0.0000001) {
                    throw new RuntimeException("Estoque insuficiente para o produto {$product->id}.");
                }

                $tankProduct = OperatorTankProduct::query()
                    ->where('operator_tank_id', $tank->id)
                    ->where('product_id', $product->id)
                    ->lockForUpdate()
                    ->first();

                if (!$tankProduct) {
                    $tankProduct = OperatorTankProduct::create([
                        'operator_tank_id' => $tank->id,
                        'product_id' => $product->id,
                        'opening_quantity' => 0,
                        'withdrawn_quantity' => 0,
                        'used_quantity' => 0,
                        'returned_quantity' => 0,
                        'current_quantity' => 0,
                    ]);
                }

                $tankBalanceBefore = round((float) $tankProduct->current_quantity, 3);
                $before = round((float) ($product->stock ?? 0), 3);
                $after = round($before - $quantity, 3);
                $product->update(['stock' => $after]);

                $tankProduct->update([
                    'withdrawn_quantity' => round((float) $tankProduct->withdrawn_quantity + $quantity, 3),
                    'current_quantity' => round((float) $tankProduct->current_quantity + $quantity, 3),
                ]);

                $stockMovement = ProductStockMovement::create([
                    'product_id' => $product->id,
                    'order_id' => null,
                    'operator_tank_id' => $tank->id,
                    'movement_type' => 'WITHDRAWAL_TO_TANK',
                    'quantity' => $quantity,
                    'stock_before' => $before,
                    'stock_after' => $after,
                    'observation' => $data['observation'] ?? "Retirada consolidada para o tanque do operador na safra {$crop->id}.",
                    'created_by' => $userId,
                ]);

                $tankMovement = OperatorTankMovement::create([
                    'operator_tank_id' => $tank->id,
                    'product_id' => $product->id,
                    'order_id' => null,
                    'movement_type' => 'WITHDRAWAL',
                    'quantity' => $quantity,
                    'observation' => $data['observation'] ?? 'Retirada consolidada do estoque físico para o tanque do operador.',
                ]);

                OperatorTankWithdrawalItem::create([
                    'operator_tank_withdrawal_id' => $withdrawal->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'stock_before' => $before,
                    'stock_after' => $after,
                    'tank_balance_before' => $tankBalanceBefore,
                    'tank_balance_after' => round($tankBalanceBefore + $quantity, 3),
                    'product_stock_movement_id' => $stockMovement->id,
                    'operator_tank_movement_id' => $tankMovement->id,
                ]);
            }

            return $this->withdrawal($withdrawal->refresh());
        });
    }

    // Obtém ou cria o tanque diário e traz o saldo do dia anterior.
    public function getOrCreateTank(int $operatorId, string $date): OperatorTank
    {
        // Executa a criação com proteção contra concorrência.
        return DB::transaction(function () use ($operatorId, $date): OperatorTank {
            $selectedDate = Carbon::parse($date)->toDateString();
            // Procura o tanque existente.
            $tank = OperatorTank::query()
                ->where('operator_id', $operatorId)
                ->whereDate('date', $selectedDate)
                ->lockForUpdate()
                ->first();

            if (!$tank) {
                // Cria o tanque do dia quando ainda não existe.
                $tank = OperatorTank::create([
                    'operator_id' => $operatorId,
                    'date' => $selectedDate,
                    'status' => 'A',
                ]);
            }

            // Recalcula cronologicamente os saldos até a data consultada. Isso
            // corrige tanques futuros já abertos antes de uma retirada ou de um
            // fechamento lançado em data anterior.
            $this->synchronizeTankBalancesThroughDate($operatorId, $selectedDate);

            // Retorna o tanque com dados completos.
            return $tank->refresh()->load('products.product', 'operator');
        });
    }

    /**
     * Reconstrói abertura e saldo atual de cada tanque em ordem cronológica.
     *
     * saldo atual = abertura + retirado - utilizado - devolvido
     */
    private function synchronizeTankBalancesThroughDate(int $operatorId, string $date): void
    {
        $tanks = OperatorTank::query()
            ->where('operator_id', $operatorId)
            ->whereDate('date', '<=', $date)
            ->orderBy('date')
            ->orderBy('id')
            ->lockForUpdate()
            ->get();

        $previousBalances = [];

        foreach ($tanks as $tank) {
            $tankProducts = $tank->products()
                ->lockForUpdate()
                ->get()
                ->keyBy('product_id');

            $productIds = collect(array_keys($previousBalances))
                ->merge($tankProducts->keys())
                ->unique()
                ->values();

            foreach ($productIds as $productId) {
                $opening = round((float) ($previousBalances[(int) $productId] ?? 0), 3);
                $tankProduct = $tankProducts->get($productId);

                if (!$tankProduct) {
                    if ($opening <= 0) {
                        continue;
                    }

                    $tankProduct = OperatorTankProduct::create([
                        'operator_tank_id' => $tank->id,
                        'product_id' => $productId,
                        'opening_quantity' => $opening,
                        'withdrawn_quantity' => 0,
                        'used_quantity' => 0,
                        'returned_quantity' => 0,
                        'current_quantity' => $opening,
                    ]);
                }

                $current = round(
                    $opening
                    + (float) $tankProduct->withdrawn_quantity
                    - (float) $tankProduct->used_quantity
                    - (float) $tankProduct->returned_quantity,
                    3
                );

                // Evita resíduos negativos gerados exclusivamente por precisão.
                if ($current < 0 && $current > -0.001) {
                    $current = 0.0;
                }

                $tankProduct->update([
                    'opening_quantity' => $opening,
                    'current_quantity' => $current,
                ]);

                $previousBalances[(int) $productId] = $current;
            }
        }
    }

    // Resolve a quantidade da movimentação.
    private function resolveMovementQuantity(array $data): float
    {
        // Usa a quantidade explicitamente informada quando presente.
        if (isset($data['quantity']) && $data['quantity'] !== null) {
            return round((float) $data['quantity'], 3);
        }
        // Exige uma OS para calcular automaticamente a retirada recomendada.
        if (empty($data['order_id'])) {
            throw new RuntimeException('Informe a quantidade ou uma ordem de serviço para cálculo automático.');
        }
        // Localiza a OS.
        $order = AgriculturalDefensiveOrder::query()->findOrFail($data['order_id']);
        // Localiza o produto da OS.
        $item = $order->products()->where('product_id', $data['product_id'])->first();
        // Exige que o produto esteja associado à OS.
        if (!$item) {
            throw new RuntimeException('O produto informado não pertence à ordem de serviço.');
        }
        // A retirada automática segue a regra canônica: quantidade por bomba x bombas recomendadas.
        return round(
            (float) $item->pump * (float) $order->recommended_pump,
            3
        );
    }

    // Retira produto do estoque e coloca no tanque do operador.
    public function moveTank(array $data, ?int $userId = null): OperatorTank
    {
        // Executa a movimentação em transação.
        return DB::transaction(function () use ($data, $userId): OperatorTank {
            // Bloqueia o tanque.
            $tank = OperatorTank::query()->lockForUpdate()->findOrFail($data['operator_tank_id']);
            // Bloqueia o produto para impedir corrida no estoque.
            $product = Product::query()->lockForUpdate()->findOrFail($data['product_id']);
            // Calcula automaticamente a retirada recomendada quando uma OS foi informada.
            $quantity = $this->resolveMovementQuantity($data);
            // Procura ou cria a linha do produto no tanque.
            $tankProduct = OperatorTankProduct::query()->where('operator_tank_id', $tank->id)->where('product_id', $product->id)->lockForUpdate()->first();
            // Cria a linha quando o produto ainda não existe no tanque.
            if (!$tankProduct) {
                $tankProduct = OperatorTankProduct::create([
                    // Liga ao tanque.
                    'operator_tank_id' => $tank->id,
                    // Liga ao produto.
                    'product_id' => $product->id,
                    // Não há sobra anterior.
                    'opening_quantity' => 0,
                    // Inicia retirada.
                    'withdrawn_quantity' => 0,
                    // Inicia uso.
                    'used_quantity' => 0,
                    // Inicia devolução.
                    'returned_quantity' => 0,
                    // Inicia saldo.
                    'current_quantity' => 0,
                ]);
            }
            // Processa retirada do estoque.
            if ($data['movement_type'] === 'WITHDRAWAL') {
                // Exige estoque suficiente.
                if ((float) ($product->stock ?? 0) < $quantity - 0.0000001) {
                    throw new RuntimeException("Estoque insuficiente para o produto {$product->id}.");
                }
                // Guarda o estoque anterior.
                $before = round((float) ($product->stock ?? 0), 3);
                // Calcula o estoque posterior.
                $after = round($before - $quantity, 3);
                // Atualiza o estoque.
                $product->update(['stock' => $after]);
                // Atualiza o tanque.
                $tankProduct->update([
                    // Soma a retirada do dia.
                    'withdrawn_quantity' => round((float) $tankProduct->withdrawn_quantity + $quantity, 3),
                    // Soma ao saldo.
                    'current_quantity' => round((float) $tankProduct->current_quantity + $quantity, 3),
                ]);
                // Registra a saída do estoque.
                ProductStockMovement::create([
                    // Produto.
                    'product_id' => $product->id,
                    // OS opcional.
                    'order_id' => $data['order_id'] ?? null,
                    // Tanque.
                    'operator_tank_id' => $tank->id,
                    // Tipo.
                    'movement_type' => 'WITHDRAWAL_TO_TANK',
                    // Quantidade.
                    'quantity' => $quantity,
                    // Antes.
                    'stock_before' => $before,
                    // Depois.
                    'stock_after' => $after,
                    // Observação.
                    'observation' => $data['observation'] ?? 'Retirada do estoque para tanque de operador.',
                    // Usuário.
                    'created_by' => $userId,
                ]);
                // Registra a entrada no tanque.
                OperatorTankMovement::create([
                    // Tanque.
                    'operator_tank_id' => $tank->id,
                    // Produto.
                    'product_id' => $product->id,
                    // OS opcional.
                    'order_id' => $data['order_id'] ?? null,
                    // Tipo.
                    'movement_type' => 'WITHDRAWAL',
                    // Quantidade.
                    'quantity' => $quantity,
                    // Observação.
                    'observation' => $data['observation'] ?? 'Produto retirado do estoque para o tanque.',
                ]);
            } else {
                // Exige saldo suficiente no tanque para devolver.
                if ((float) $tankProduct->current_quantity < $quantity - 0.0000001) {
                    throw new RuntimeException('A quantidade informada para devolução é maior que o saldo do tanque.');
                }
                // Guarda o estoque anterior.
                $before = round((float) ($product->stock ?? 0), 3);
                // Calcula o estoque posterior.
                $after = round($before + $quantity, 3);
                // Atualiza o estoque.
                $product->update(['stock' => $after]);
                // Atualiza o tanque.
                $tankProduct->update([
                    // Soma a devolução do dia.
                    'returned_quantity' => round((float) $tankProduct->returned_quantity + $quantity, 3),
                    // Diminui o saldo.
                    'current_quantity' => round((float) $tankProduct->current_quantity - $quantity, 3),
                ]);
                // Registra a entrada no estoque por devolução.
                ProductStockMovement::create([
                    // Produto.
                    'product_id' => $product->id,
                    // OS opcional.
                    'order_id' => $data['order_id'] ?? null,
                    // Tanque.
                    'operator_tank_id' => $tank->id,
                    // Tipo.
                    'movement_type' => 'RETURN_FROM_TANK',
                    // Quantidade.
                    'quantity' => $quantity,
                    // Antes.
                    'stock_before' => $before,
                    // Depois.
                    'stock_after' => $after,
                    // Observação.
                    'observation' => $data['observation'] ?? 'Devolução do tanque para o estoque.',
                    // Usuário.
                    'created_by' => $userId,
                ]);
                // Registra a saída do tanque.
                OperatorTankMovement::create([
                    // Tanque.
                    'operator_tank_id' => $tank->id,
                    // Produto.
                    'product_id' => $product->id,
                    // OS opcional.
                    'order_id' => $data['order_id'] ?? null,
                    // Tipo.
                    'movement_type' => 'RETURN',
                    // Quantidade.
                    'quantity' => $quantity,
                    // Observação.
                    'observation' => $data['observation'] ?? 'Produto devolvido ao estoque.',
                ]);
            }
            // Retorna o tanque atualizado.
            return $tank->refresh()->load('products.product', 'operator');
        });
    }
}
