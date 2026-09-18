<?php

namespace App\Services\Releases\Grain;

use App\Models\Registrations\Grain\DiscountType;
use App\Models\Registrations\Grain\ScaleChannel;
use App\Models\Registrations\Grain\StorageLocation;
use App\Models\Registrations\Grain\TransportTruck;
use App\Models\Registrations\Property\Registration\FarmStateRegistration;
use App\Models\Releases\Grain\EntryDiscount;
use App\Models\Releases\Grain\ImpurityOutput;
use App\Models\Releases\Grain\ImpurityOutputItem;
use App\Models\Releases\Grain\SaleContract;
use App\Models\Releases\Grain\ScaleReading;
use App\Models\Releases\Grain\ShipmentAllocation;
use App\Models\Releases\Grain\WeighingTicket;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class WeighingService
{
    public function __construct(
        private readonly DocumentNumberService $numbers,
        private readonly AuthorizationService $authorizations,
        private readonly GrainBalanceService $balances,
    ) {}

    public function create(array $data, int $userId): WeighingTicket
    {
        return DB::transaction(function () use ($data, $userId): WeighingTicket {
            TransportTruck::query()->whereKey($data['grain_transport_truck_id'])->lockForUpdate()->firstOrFail();
            $open = WeighingTicket::query()->where('grain_transport_truck_id', $data['grain_transport_truck_id'])
                ->whereIn('status', WeighingTicket::ACTIVE_STATUSES)->lockForUpdate()->first();
            if ($open) {
                throw ValidationException::withMessages(['grain_transport_truck_id' => ["O caminhão já possui a portaria {$open->ticket_number} em aberto."]]);
            }
            $registration = FarmStateRegistration::query()->whereKey($data['farm_state_registration_id'])
                ->where('producer_id', $data['producer_id'])->where('farm_id', $data['farm_id'])
                ->where('status', 'A')->first();
            if (!$registration) {
                throw ValidationException::withMessages(['farm_state_registration_id' => ['A inscrição deve estar ativa e pertencer ao produtor e à fazenda.']]);
            }
            if (!DB::table('crop_culture')->where('crop_id', $data['crop_id'])->where('culture_id', $data['culture_id'])->exists()) {
                throw ValidationException::withMessages(['culture_id' => ['O produto deve estar vinculado à safra selecionada.']]);
            }
            $locationValid = StorageLocation::query()->whereKey($data['grain_storage_location_id'])
                ->where('grain_warehouse_id', $data['grain_warehouse_id'])->where('status', 'A')->exists();
            if (!$locationValid) {
                throw ValidationException::withMessages(['grain_storage_location_id' => ['O local deve pertencer ao armazém e estar ativo.']]);
            }
            if ($data['operation_type'] === 'EXIT') {
                $this->assertBuyer((int) ($data['buyer_id'] ?? 0));
            }
            $prefix = match ($data['operation_type']) { 'ENTRY' => 'REC', 'EXIT' => 'EXP', 'IMPURITY_OUTPUT' => 'IMP' };
            return WeighingTicket::create([
                ...$data, 'ticket_number' => $this->numbers->next($prefix),
                'flow_type' => 'DOUBLE', 'status' => 'WAITING_FIRST_WEIGHT', 'created_by' => $userId,
            ]);
        });
    }

    public function capture(WeighingTicket $ticket, array $data, int $userId): WeighingTicket
    {
        return DB::transaction(function () use ($ticket, $data, $userId): WeighingTicket {
            $ticket = WeighingTicket::query()->lockForUpdate()->findOrFail($ticket->id);
            $stage = $data['stage'];
            $expected = $stage === 'FIRST' ? 'WAITING_FIRST_WEIGHT' : 'WAITING_SECOND_WEIGHT';
            if ($ticket->status !== $expected) {
                throw ValidationException::withMessages(['stage' => ['A etapa não corresponde ao estado atual do ticket.']]);
            }
            [$weight, $scaleId, $channelId, $readingId, $source, $readAt] = $this->resolveWeight($ticket, $data, $userId);
            $channel = ScaleChannel::query()->whereKey($channelId)->where('grain_scale_id', $scaleId)->where('status', 'A')->firstOrFail();
            if ($weight < (float) $channel->minimum_weight || $weight > (float) $channel->maximum_weight) {
                throw ValidationException::withMessages(['weight' => ['Peso fora dos limites configurados para o canal.']]);
            }
            $prefix = strtolower($stage);
            $ticket->update([
                "{$prefix}_scale_id" => $scaleId,
                "{$prefix}_scale_channel_id" => $channelId,
                "{$prefix}_reading_id" => $readingId,
                "{$prefix}_weight" => $weight,
                "{$prefix}_weight_at" => $readAt,
                "{$prefix}_weight_source" => $source,
                'status' => $stage === 'FIRST'
                    ? ($ticket->operation_type === 'ENTRY' ? 'WAITING_DISCOUNTS' : 'WAITING_SECOND_WEIGHT')
                    : 'SECOND_WEIGHED',
            ]);
            if ($stage === 'SECOND') {
                $this->calculateWeights($ticket->refresh());
            }
            return $ticket->refresh()->load(['discounts', 'allocations']);
        });
    }

    public function saveDiscounts(WeighingTicket $ticket, array $items, int $userId, ?int $authorizationId): WeighingTicket
    {
        return DB::transaction(function () use ($ticket, $items, $userId, $authorizationId): WeighingTicket {
            $ticket = WeighingTicket::query()->lockForUpdate()->findOrFail($ticket->id);
            if ($ticket->operation_type !== 'ENTRY' || !in_array($ticket->status, ['WAITING_DISCOUNTS', 'WAITING_SECOND_WEIGHT'], true)) {
                throw ValidationException::withMessages(['ticket' => ['Os descontos só podem ser informados em recebimento aberto após a primeira pesagem.']]);
            }
            $configured = DiscountType::query()->where('culture_id', $ticket->culture_id)->where('status', 'A')->pluck('id');
            $given = collect($items)->pluck('grain_discount_type_id');
            if ($configured->diff($given)->isNotEmpty()) {
                throw ValidationException::withMessages(['discounts' => ['Todos os tipos de desconto configurados devem ser informados, inclusive com percentual zero.']]);
            }
            $extras = $given->diff($configured);
            $authorization = null;
            if ($extras->isNotEmpty()) {
                $authorization = $this->authorizations->assertApproved($authorizationId, 'EXTRA_DISCOUNT', $ticket->id);
            }
            foreach ($items as $item) {
                if ((float) $item['percentage'] > 0 && ($item['discount_weight'] ?? null) === null) {
                    throw ValidationException::withMessages(['discounts' => ['Enquanto a fórmula não estiver configurada, informe o peso manual correspondente a todo percentual maior que zero.']]);
                }
                if ($extras->contains($item['grain_discount_type_id']) && blank($item['justification'] ?? null)) {
                    throw ValidationException::withMessages(['discounts' => ['Desconto não configurado exige justificativa.']]);
                }
                EntryDiscount::query()->updateOrCreate([
                    'grain_weighing_ticket_id' => $ticket->id,
                    'grain_discount_type_id' => $item['grain_discount_type_id'],
                ], [
                    'percentage' => $item['percentage'],
                    'discount_weight' => $item['discount_weight'] ?? null,
                    'is_extra_discount' => $extras->contains($item['grain_discount_type_id']),
                    'justification' => $item['justification'] ?? null,
                    'authorization_request_id' => $authorization?->id,
                    'informed_by' => $userId,
                ]);
            }
            $ticket->update(['status' => 'WAITING_SECOND_WEIGHT']);
            if ($authorization) $this->authorizations->consume($authorization);
            return $ticket->refresh()->load('discounts');
        });
    }

    public function previewAllocation(WeighingTicket $ticket): array
    {
        if ($ticket->operation_type !== 'EXIT' || !$ticket->commercial_net_weight) {
            throw ValidationException::withMessages(['ticket' => ['Realize a segunda pesagem da expedição antes de consultar contratos.']]);
        }
        $remaining = (float) $ticket->commercial_net_weight;
        $allocations = [];
        $contracts = $this->eligibleContracts($ticket)->get();
        foreach ($contracts as $contract) {
            if ($remaining <= 0) break;
            $weight = min($remaining, $contract->availableWeight());
            if ($weight > 0) {
                $allocations[] = ['contract_id' => $contract->id, 'contract_number' => $contract->contract_number, 'available_before' => $contract->availableWeight(), 'allocated_weight' => round($weight, 3), 'will_be_fulfilled' => $weight >= $contract->availableWeight()];
                $remaining -= $weight;
            }
        }
        $notices = [];
        foreach ($allocations as $index => $allocation) {
            if ($allocation['will_be_fulfilled'] && isset($allocations[$index + 1])) {
                $notices[] = "O contrato {$allocation['contract_number']} será finalizado e o saldo restante será consumido do contrato {$allocations[$index + 1]['contract_number']}.";
            }
        }
        return ['ticket_id' => $ticket->id, 'commercial_net_weight' => (float) $ticket->commercial_net_weight, 'allocations' => $allocations, 'notices' => $notices, 'missing_weight' => round(max(0, $remaining), 3), 'requires_authorization' => count($allocations) > 1, 'can_close' => $remaining <= 0];
    }

    public function close(WeighingTicket $ticket, array $data, int $userId): WeighingTicket
    {
        return DB::transaction(function () use ($ticket, $data, $userId): WeighingTicket {
            $ticket = WeighingTicket::query()->lockForUpdate()->findOrFail($ticket->id);
            if ($ticket->status !== 'SECOND_WEIGHED') {
                throw ValidationException::withMessages(['ticket' => ['O ticket precisa possuir as duas pesagens.']]);
            }
            $balance = $this->balances->lockedForTicket($ticket);
            match ($ticket->operation_type) {
                'ENTRY' => $this->closeEntry($ticket, $balance, $userId),
                'EXIT' => $this->closeShipment($ticket, $balance, $data, $userId),
                'IMPURITY_OUTPUT' => $this->closeImpurity($ticket, $balance, $data, $userId),
            };
            $ticket->update(['status' => 'CLOSED', 'closed_by' => $userId, 'closed_at' => now(), 'verification_code' => Str::random(32)]);
            return $ticket->refresh()->load(['discounts', 'allocations']);
        });
    }

    private function resolveWeight(WeighingTicket $ticket, array $data, int $userId): array
    {
        if (($data['source'] ?? 'AUTOMATIC') === 'MANUAL') {
            $authorization = $this->authorizations->assertApproved($data['authorization_request_id'] ?? null, 'MANUAL_WEIGHT', $ticket->id);
            $requested = $authorization->payload_requested;
            if ((float) ($requested['weight'] ?? -1) !== (float) $data['weight'] || ($requested['stage'] ?? null) !== $data['stage']) {
                throw ValidationException::withMessages(['authorization_request_id' => ['A autorização não corresponde ao peso e etapa informados.']]);
            }
            $this->authorizations->consume($authorization);
            return [(float) $data['weight'], (int) $data['grain_scale_id'], (int) $data['grain_scale_channel_id'], null, 'MANUAL', now()];
        }
        $reading = ScaleReading::query()->lockForUpdate()->findOrFail($data['reading_id']);
        if (!$reading->stable || $reading->read_at->lt(now()->subSeconds(30))) {
            throw ValidationException::withMessages(['reading_id' => ['A leitura precisa estar estável e ter sido recebida nos últimos 30 segundos.']]);
        }
        $alreadyUsed = WeighingTicket::query()->where(fn ($q) => $q->where('first_reading_id', $reading->id)->orWhere('second_reading_id', $reading->id))->exists();
        if ($alreadyUsed) throw ValidationException::withMessages(['reading_id' => ['Esta leitura já foi capturada em outro peso.']]);
        return [(float) $reading->weight, $reading->grain_scale_id, $reading->grain_scale_channel_id, $reading->id, 'AUTOMATIC', $reading->read_at];
    }

    private function calculateWeights(WeighingTicket $ticket): void
    {
        $entry = $ticket->operation_type === 'ENTRY';
        $gross = (float) ($entry ? $ticket->first_weight : $ticket->second_weight);
        $tare = (float) ($entry ? $ticket->second_weight : $ticket->first_weight);
        if ($gross <= $tare) throw ValidationException::withMessages(['weight' => ['O peso bruto deve ser maior que a tara.']]);
        if ($ticket->operation_type === 'EXIT' && $gross > (float) $ticket->truck()->firstOrFail()->maximum_gross_weight) {
            throw ValidationException::withMessages(['weight' => ['O peso bruto ultrapassa o peso máximo cadastrado para o caminhão.']]);
        }
        $net = $gross - $tare;
        $discount = $ticket->operation_type === 'ENTRY' ? (float) $ticket->discounts()->sum('discount_weight') : 0;
        if ($discount >= $net) throw ValidationException::withMessages(['discounts' => ['O desconto total deve ser menor que o peso líquido.']]);
        $ticket->update(['gross_weight' => $gross, 'tare_weight' => $tare, 'net_weight' => $net, 'quality_discount_weight' => $discount, 'commercial_net_weight' => $net - $discount]);
    }

    private function closeEntry(WeighingTicket $ticket, $balance, int $userId): void
    {
        $pendingImpurity = (float) EntryDiscount::query()->where('grain_weighing_ticket_id', $ticket->id)
            ->whereHas('discountType', fn ($q) => $q->where('generates_impurity', true))->sum('discount_weight');
        $balance->increment('pending_impurity_weight', $pendingImpurity);
        $this->balances->move($balance->refresh(), ['grain_weighing_ticket_id' => $ticket->id, 'movement_type' => 'ENTRY', 'physical_quantity' => (float) $ticket->net_weight, 'commercial_quantity' => (float) $ticket->commercial_net_weight, 'source_type' => WeighingTicket::class, 'source_id' => $ticket->id, 'created_by' => $userId]);
    }

    private function closeShipment(WeighingTicket $ticket, $balance, array $data, int $userId): void
    {
        $preview = $this->previewAllocation($ticket);
        if (!$preview['can_close']) throw ValidationException::withMessages(['contracts' => ["Saldo insuficiente. Faltam {$preview['missing_weight']} kg."]]);
        $authorization = null;
        if ($preview['requires_authorization']) {
            $authorization = $this->authorizations->assertApproved($data['authorization_request_id'] ?? null, 'MULTIPLE_CONTRACT_SHIPMENT', $ticket->id);
            $this->authorizations->assertPayloadMatches($authorization, [
                'commercial_net_weight' => (float) $ticket->commercial_net_weight,
                'allocations' => collect($preview['allocations'])->map(fn ($item) => ['contract_id' => $item['contract_id'], 'allocated_weight' => $item['allocated_weight']])->values()->all(),
            ]);
        }
        foreach ($preview['allocations'] as $index => $item) {
            $contract = SaleContract::query()->lockForUpdate()->findOrFail($item['contract_id']);
            if ($contract->availableWeight() < $item['allocated_weight']) throw ValidationException::withMessages(['contracts' => ['O saldo de um contrato foi alterado. Consulte novamente.']]);
            $contract->increment('shipped_weight', $item['allocated_weight']);
            $contract->refresh()->update(['status' => $contract->availableWeight() <= 0 ? 'FULFILLED' : 'PARTIAL']);
            ShipmentAllocation::create(['grain_weighing_ticket_id' => $ticket->id, 'grain_sale_contract_id' => $contract->id, 'subticket_number' => sprintf('%s-%02d', $ticket->ticket_number, $index + 1), 'allocated_weight' => $item['allocated_weight'], 'authorization_request_id' => $authorization?->id]);
        }
        if ((float) $balance->contract_balance < (float) $ticket->commercial_net_weight) {
            throw ValidationException::withMessages(['balance' => ['O saldo contratual consolidado é insuficiente.']]);
        }
        $balance->decrement('contract_balance', (float) $ticket->commercial_net_weight);
        $this->balances->move($balance->refresh(), ['grain_weighing_ticket_id' => $ticket->id, 'movement_type' => 'SHIPMENT', 'physical_quantity' => -(float) $ticket->commercial_net_weight, 'commercial_quantity' => -(float) $ticket->commercial_net_weight, 'source_type' => WeighingTicket::class, 'source_id' => $ticket->id, 'created_by' => $userId]);
        if ($authorization) $this->authorizations->consume($authorization);
    }

    private function closeImpurity(WeighingTicket $ticket, $balance, array $data, int $userId): void
    {
        if (blank($data['operator_name'] ?? null)) throw ValidationException::withMessages(['operator_name' => ['O operador é obrigatório.']]);
        $items = collect($data['impurity_items'] ?? [])->groupBy(fn ($item) => $item['grain_impurity_type_id'].'-'.$item['source_entry_ticket_id'])
            ->map(fn ($group) => [...$group->first(), 'quantity' => $group->sum('quantity')])->values();
        $total = (float) $items->sum('quantity');
        if (abs($total - (float) $ticket->net_weight) > 0.001 || $total > (float) $balance->pending_impurity_weight) {
            throw ValidationException::withMessages(['impurity_items' => ['Os itens devem somar o peso líquido e não ultrapassar a impureza pendente.']]);
        }
        foreach ($items as $item) {
            $source = WeighingTicket::query()->whereKey($item['source_entry_ticket_id'])->where('operation_type', 'ENTRY')->where('status', 'CLOSED')->first();
            if (!$source || $source->producer_id !== $ticket->producer_id || $source->culture_id !== $ticket->culture_id || $source->crop_id !== $ticket->crop_id) {
                throw ValidationException::withMessages(['impurity_items' => ['Toda origem deve ser um recebimento fechado do mesmo produtor, produto e safra.']]);
            }
            $generated = (float) EntryDiscount::query()->where('grain_weighing_ticket_id', $source->id)
                ->whereHas('discountType', fn ($q) => $q->where('grain_impurity_type_id', $item['grain_impurity_type_id'])->where('generates_impurity', true))->sum('discount_weight');
            $removed = (float) ImpurityOutputItem::query()
                ->join('grain_impurity_outputs', 'grain_impurity_outputs.id', '=', 'grain_impurity_output_items.grain_impurity_output_id')
                ->where('grain_impurity_outputs.status', 'CLOSED')
                ->where('grain_impurity_output_items.grain_impurity_type_id', $item['grain_impurity_type_id'])
                ->where('grain_impurity_output_items.source_entry_ticket_id', $source->id)
                ->sum('grain_impurity_output_items.quantity');
            if ($generated - $removed < (float) $item['quantity']) {
                throw ValidationException::withMessages(['impurity_items' => ['Uma das entradas não possui a quantidade de impureza pendente informada.']]);
            }
        }
        $output = ImpurityOutput::create(['output_number' => $ticket->ticket_number, 'grain_weighing_ticket_id' => $ticket->id, 'operator_name' => $data['operator_name'], 'vehicle_description' => $data['vehicle_description'] ?? null, 'destination' => $data['destination'] ?? null, 'status' => 'CLOSED', 'created_by' => $userId]);
        foreach ($items as $item) $output->items()->create($item);
        $balance->decrement('pending_impurity_weight', $total);
        $this->balances->move($balance->refresh(), ['grain_weighing_ticket_id' => $ticket->id, 'movement_type' => 'IMPURITY_OUTPUT', 'physical_quantity' => -$total, 'commercial_quantity' => 0, 'source_type' => ImpurityOutput::class, 'source_id' => $output->id, 'created_by' => $userId]);
    }

    private function eligibleContracts(WeighingTicket $ticket)
    {
        return SaleContract::query()->where('buyer_id', $ticket->buyer_id)->where('producer_id', $ticket->producer_id)
            ->where('farm_state_registration_id', $ticket->farm_state_registration_id)->where('crop_id', $ticket->crop_id)
            ->where('culture_id', $ticket->culture_id)->whereIn('status', ['OPEN', 'PARTIAL'])
            ->whereRaw('transferred_weight > shipped_weight')->orderBy('created_at')->orderBy('id');
    }

    private function assertBuyer(int $buyerId): void
    {
        $valid = DB::table('suppliers')->where('suppliers.id', $buyerId)->where('suppliers.status', 'A')
            ->join('supplier_type_supplier', 'supplier_type_supplier.supplier_id', '=', 'suppliers.id')
            ->join('type_suppliers', 'type_suppliers.id', '=', 'supplier_type_supplier.type_supplier_id')
            ->where('type_suppliers.code', 'BUYER')->where('type_suppliers.status', 'A')->exists();
        if (!$valid) throw ValidationException::withMessages(['buyer_id' => ['O comprador deve ser um fornecedor ativo do tipo COMPRADOR.']]);
    }
}
