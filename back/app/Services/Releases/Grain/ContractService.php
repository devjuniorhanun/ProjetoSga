<?php

namespace App\Services\Releases\Grain;

use App\Models\Registrations\Property\Registration\FarmStateRegistration;
use App\Models\Releases\Grain\ContractTransfer;
use App\Models\Releases\Grain\GrainBalance;
use App\Models\Releases\Grain\SaleContract;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ContractService
{
    public function __construct(
        private readonly DocumentNumberService $numbers,
        private readonly AuthorizationService $authorizations,
        private readonly TechnicalLossService $technicalLosses,
        private readonly GrainBalanceService $balances,
    ) {}

    public function create(array $data, int $userId): SaleContract
    {
        return DB::transaction(function () use ($data, $userId): SaleContract {
            $this->technicalLosses->processDue($userId);
            $this->assertBuyer((int) $data['buyer_id']);
            $registration = FarmStateRegistration::query()->whereKey($data['farm_state_registration_id'])
                ->where('producer_id', $data['producer_id'])->where('status', 'A')->first();
            if (!$registration) throw ValidationException::withMessages(['farm_state_registration_id' => ['Inscrição incompatível com o produtor.']]);
            if (!DB::table('crop_culture')->where('crop_id', $data['crop_id'])->where('culture_id', $data['culture_id'])->exists()) {
                throw ValidationException::withMessages(['culture_id' => ['O produto deve estar vinculado à safra selecionada.']]);
            }
            $balance = GrainBalance::query()->where('producer_id', $data['producer_id'])
                ->where('farm_state_registration_id', $data['farm_state_registration_id'])->where('crop_id', $data['crop_id'])
                ->where('culture_id', $data['culture_id'])->where('ownership_type', $data['ownership_type'])->lockForUpdate()->first();
            if ($balance) $this->balances->refreshTechnicalReserve($balance, now());
            if (!$balance || $balance->availableForContract() < (float) $data['contracted_weight']) {
                throw ValidationException::withMessages(['contracted_weight' => ['Quantidade superior ao saldo disponível após a reserva técnica.']]);
            }
            return SaleContract::create([...$data, 'created_by' => $userId, 'status' => $data['status'] ?? 'DRAFT']);
        });
    }

    public function update(SaleContract $contract, array $data, int $authorizationId): SaleContract
    {
        return DB::transaction(function () use ($contract, $data, $authorizationId): SaleContract {
            $contract = SaleContract::query()->lockForUpdate()->findOrFail($contract->id);
            $authorization = $this->authorizations->assertApproved($authorizationId, 'CHANGE_CONTRACT', $contract->id);
            $this->authorizations->assertPayloadMatches($authorization, $data);
            if (isset($data['buyer_id'])) $this->assertBuyer((int) $data['buyer_id']);
            $identityFields = ['buyer_id', 'producer_id', 'farm_state_registration_id', 'crop_id', 'culture_id', 'ownership_type'];
            $identityChanged = collect($identityFields)->contains(fn (string $field) => array_key_exists($field, $data) && (string) $data[$field] !== (string) $contract->{$field});
            if ($identityChanged && ((float) $contract->transferred_weight > 0 || (float) $contract->shipped_weight > 0)) {
                throw ValidationException::withMessages(['contract' => ['Não altere comprador, produtor, inscrição, safra ou produto depois de movimentar o contrato.']]);
            }
            if (isset($data['contracted_weight']) && (float) $data['contracted_weight'] < (float) $contract->shipped_weight) {
                throw ValidationException::withMessages(['contracted_weight' => ['A quantidade não pode ser inferior ao peso já expedido.']]);
            }
            if (isset($data['contracted_weight']) && (float) $data['contracted_weight'] < (float) $contract->transferred_weight) {
                throw ValidationException::withMessages(['contracted_weight' => ['Estorne primeiro o saldo transferido que excederá a nova quantidade.']]);
            }
            $contract->update($data);
            $this->authorizations->consume($authorization);
            return $contract->refresh();
        });
    }

    public function transferToContract(array $data, int $userId): ContractTransfer
    {
        return DB::transaction(function () use ($data, $userId): ContractTransfer {
            $balance = GrainBalance::query()->lockForUpdate()->findOrFail($data['grain_balance_id']);
            $contract = SaleContract::query()->lockForUpdate()->findOrFail($data['destination_contract_id']);
            $this->balances->refreshTechnicalReserve($balance, now());
            $this->assertCompatible($balance, $contract);
            if (!in_array($contract->status, ['OPEN', 'PARTIAL'], true)) throw ValidationException::withMessages(['destination_contract_id' => ['Contrato não está aberto.']]);
            $weight = (float) $data['weight'];
            if ($balance->availableForContract() < $weight) throw ValidationException::withMessages(['weight' => ['Saldo livre insuficiente após a reserva técnica.']]);
            $limit = (float) $contract->contracted_weight * (1 + ((float) $contract->tolerance_percentage / 100));
            if ((float) $contract->transferred_weight + $weight > $limit) throw ValidationException::withMessages(['weight' => ['A transferência ultrapassa a quantidade contratada e sua tolerância.']]);
            $balance->increment('contract_balance', $weight);
            $contract->increment('transferred_weight', $weight);
            return ContractTransfer::create([
                'transfer_number' => $this->numbers->next('TRC'), 'grain_balance_id' => $balance->id,
                'destination_contract_id' => $contract->id, 'weight' => $weight,
                'transfer_type' => 'BALANCE_TO_CONTRACT', 'status' => 'CONFIRMED',
                'reason' => $data['reason'] ?? null, 'created_by' => $userId, 'confirmed_at' => now(),
            ]);
        });
    }

    public function betweenContracts(array $data, int $userId): ContractTransfer
    {
        return DB::transaction(function () use ($data, $userId): ContractTransfer {
            $authorization = $this->authorizations->assertApproved($data['authorization_request_id'], 'CONTRACT_TO_CONTRACT_TRANSFER');
            $this->authorizations->assertPayloadMatches($authorization, [
                'origin_contract_id' => $data['origin_contract_id'], 'destination_contract_id' => $data['destination_contract_id'], 'weight' => $data['weight'],
            ]);
            $origin = SaleContract::query()->lockForUpdate()->findOrFail($data['origin_contract_id']);
            $destination = SaleContract::query()->lockForUpdate()->findOrFail($data['destination_contract_id']);
            $balance = GrainBalance::query()->lockForUpdate()->findOrFail($data['grain_balance_id']);
            $this->assertCompatible($balance, $origin); $this->assertCompatible($balance, $destination);
            if (!in_array($destination->status, ['OPEN', 'PARTIAL'], true)) throw ValidationException::withMessages(['destination_contract_id' => ['Contrato de destino não está aberto.']]);
            $weight = (float) $data['weight'];
            if ($origin->availableWeight() < $weight) throw ValidationException::withMessages(['weight' => ['Saldo insuficiente no contrato de origem.']]);
            $destinationLimit = (float) $destination->contracted_weight * (1 + ((float) $destination->tolerance_percentage / 100));
            if ((float) $destination->transferred_weight + $weight > $destinationLimit) throw ValidationException::withMessages(['weight' => ['A transferência ultrapassa a capacidade do contrato de destino.']]);
            $origin->decrement('transferred_weight', $weight);
            $destination->increment('transferred_weight', $weight);
            $transfer = ContractTransfer::create([
                'transfer_number' => $this->numbers->next('TCT'), 'grain_balance_id' => $balance->id,
                'origin_contract_id' => $origin->id, 'destination_contract_id' => $destination->id,
                'weight' => $weight, 'transfer_type' => 'CONTRACT_TO_CONTRACT', 'status' => 'CONFIRMED',
                'reason' => $data['reason'], 'authorization_request_id' => $authorization->id,
                'created_by' => $userId, 'confirmed_at' => now(),
            ]);
            $this->authorizations->consume($authorization);
            return $transfer;
        });
    }

    public function reverse(ContractTransfer $transfer, array $data, int $userId): ContractTransfer
    {
        return DB::transaction(function () use ($transfer, $data, $userId): ContractTransfer {
            $transfer = ContractTransfer::query()->lockForUpdate()->findOrFail($transfer->id);
            if ($transfer->status !== 'CONFIRMED') throw ValidationException::withMessages(['transfer' => ['A transferência não pode ser estornada.']]);
            $authorization = $this->authorizations->assertApproved($data['authorization_request_id'], 'REVERSE_CONTRACT_TRANSFER', $transfer->id);
            $destination = SaleContract::query()->lockForUpdate()->findOrFail($transfer->destination_contract_id);
            if ($destination->availableWeight() < (float) $transfer->weight) throw ValidationException::withMessages(['transfer' => ['Parte do saldo transferido já foi expedida.']]);
            $destination->decrement('transferred_weight', $transfer->weight);
            if ($transfer->origin_contract_id) {
                SaleContract::query()->lockForUpdate()->findOrFail($transfer->origin_contract_id)->increment('transferred_weight', $transfer->weight);
            } else {
                GrainBalance::query()->lockForUpdate()->findOrFail($transfer->grain_balance_id)->decrement('contract_balance', $transfer->weight);
            }
            $transfer->update(['status' => 'CANCELED', 'canceled_by' => $userId, 'canceled_at' => now(), 'cancellation_reason' => $data['reason']]);
            $this->authorizations->consume($authorization);
            return $transfer->refresh();
        });
    }

    private function assertCompatible(GrainBalance $balance, SaleContract $contract): void
    {
        foreach (['producer_id', 'farm_state_registration_id', 'crop_id', 'culture_id', 'ownership_type'] as $field) {
            if ((int) $balance->{$field} !== (int) $contract->{$field}) throw ValidationException::withMessages(['contract' => ['Contrato incompatível com o saldo selecionado.']]);
        }
    }

    private function assertBuyer(int $buyerId): void
    {
        $valid = DB::table('suppliers')->where('suppliers.id', $buyerId)->where('suppliers.status', 'A')
            ->join('supplier_type_supplier', 'supplier_type_supplier.supplier_id', '=', 'suppliers.id')
            ->join('type_suppliers', 'type_suppliers.id', '=', 'supplier_type_supplier.type_supplier_id')
            ->where('type_suppliers.code', 'BUYER')->where('type_suppliers.status', 'A')->exists();
        if (!$valid) throw ValidationException::withMessages(['buyer_id' => ['Fornecedor não está cadastrado como COMPRADOR.']]);
    }
}
