<?php

namespace App\Services\Releases\Grain;

use App\Models\Releases\Grain\BalanceAssignment;
use App\Models\Releases\Grain\GrainBalance;
use App\Models\Registrations\Property\Registration\FarmStateRegistration;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BalanceAssignmentService
{
    public function __construct(private readonly DocumentNumberService $numbers, private readonly AuthorizationService $authorizations, private readonly GrainBalanceService $balances) {}

    public function create(array $data, int $userId): BalanceAssignment
    {
        return DB::transaction(function () use ($data, $userId): BalanceAssignment {
            $authorization = $this->authorizations->assertApproved($data['authorization_request_id'], 'BALANCE_ASSIGNMENT');
            $origin = GrainBalance::query()->lockForUpdate()->findOrFail($data['origin_grain_balance_id']);
            if ((int) $origin->producer_id === (int) $data['destination_producer_id']) {
                throw ValidationException::withMessages(['destination_producer_id' => ['A cessão deve ocorrer entre produtores diferentes.']]);
            }
            $validRegistration = FarmStateRegistration::query()->whereKey($data['destination_farm_state_registration_id'])
                ->where('producer_id', $data['destination_producer_id'])->where('status', 'A')->exists();
            if (!$validRegistration) {
                throw ValidationException::withMessages(['destination_farm_state_registration_id' => ['Inscrição incompatível com o produtor de destino.']]);
            }
            $destination = GrainBalance::query()->firstOrCreate([
                'producer_id' => $data['destination_producer_id'],
                'farm_state_registration_id' => $data['destination_farm_state_registration_id'],
                'crop_id' => $origin->crop_id,
                'culture_id' => $origin->culture_id,
                'ownership_type' => $data['destination_ownership_type'],
            ]);
            $destination = GrainBalance::query()->lockForUpdate()->findOrFail($destination->id);
            if ($origin->id === $destination->id || $origin->culture_id !== $destination->culture_id || $origin->crop_id !== $destination->crop_id) {
                throw ValidationException::withMessages(['destination_grain_balance_id' => ['Os saldos devem ser diferentes e possuir o mesmo produto e safra.']]);
            }
            $weight = (float) $data['weight'];
            if ($origin->availableForContract() < $weight) throw ValidationException::withMessages(['weight' => ['Saldo livre insuficiente para cessão.']]);
            $this->balances->move($origin, ['movement_type' => 'BALANCE_ASSIGNMENT_OUT', 'physical_quantity' => -$weight, 'commercial_quantity' => -$weight, 'reason' => $data['reason'], 'created_by' => $userId]);
            $this->balances->move($destination, ['movement_type' => 'BALANCE_ASSIGNMENT_IN', 'physical_quantity' => $weight, 'commercial_quantity' => $weight, 'reason' => $data['reason'], 'created_by' => $userId]);
            $assignment = BalanceAssignment::create([
                'assignment_number' => $this->numbers->next('CSP'), 'origin_grain_balance_id' => $origin->id,
                'destination_grain_balance_id' => $destination->id, 'weight' => $weight, 'reason' => $data['reason'],
                'authorization_request_id' => $authorization->id, 'created_by' => $userId, 'confirmed_at' => now(),
            ]);
            $this->authorizations->consume($authorization);
            return $assignment;
        });
    }
}
