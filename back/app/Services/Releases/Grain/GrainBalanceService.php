<?php

namespace App\Services\Releases\Grain;

use App\Models\Registrations\Grain\TechnicalLossConfig;
use App\Models\Releases\Grain\GrainBalance;
use App\Models\Releases\Grain\StockMovement;
use App\Models\Releases\Grain\WeighingTicket;
use Carbon\CarbonInterface;

class GrainBalanceService
{
    public function __construct(private readonly DocumentNumberService $numbers) {}

    public function lockedForTicket(WeighingTicket $ticket): GrainBalance
    {
        $key = [
            'producer_id' => $ticket->producer_id,
            'farm_state_registration_id' => $ticket->farm_state_registration_id,
            'crop_id' => $ticket->crop_id,
            'culture_id' => $ticket->culture_id,
            'ownership_type' => $ticket->ownership_type,
        ];
        GrainBalance::query()->firstOrCreate($key);
        return GrainBalance::query()->where($key)->lockForUpdate()->firstOrFail();
    }

    public function move(GrainBalance $balance, array $data): StockMovement
    {
        $physicalBefore = (float) $balance->physical_balance;
        $commercialBefore = (float) $balance->commercial_balance;
        $physicalAfter = $physicalBefore + (float) ($data['physical_quantity'] ?? 0);
        $commercialAfter = $commercialBefore + (float) ($data['commercial_quantity'] ?? 0);
        if ($physicalAfter < 0 || $commercialAfter < 0) {
            throw \Illuminate\Validation\ValidationException::withMessages(['balance' => ['A operação produziria saldo negativo.']]);
        }
        $balance->update(['physical_balance' => $physicalAfter, 'commercial_balance' => $commercialAfter]);
        $this->refreshTechnicalReserve($balance->refresh(), $data['occurred_at'] ?? now());

        return StockMovement::create([
            ...$data,
            'movement_number' => $this->numbers->next('MOV'),
            'grain_balance_id' => $balance->id,
            'physical_balance_before' => $physicalBefore,
            'physical_balance_after' => $physicalAfter,
            'commercial_balance_before' => $commercialBefore,
            'commercial_balance_after' => $commercialAfter,
            'occurred_at' => $data['occurred_at'] ?? now(),
        ]);
    }

    public function refreshTechnicalReserve(GrainBalance $balance, CarbonInterface $date): void
    {
        $config = TechnicalLossConfig::query()
            ->where('producer_id', $balance->producer_id)
            ->where('culture_id', $balance->culture_id)
            ->where('status', 'A')
            ->whereDate('effective_from', '<=', $date)
            ->where(fn ($q) => $q->whereNull('effective_until')->orWhereDate('effective_until', '>=', $date))
            ->orderByDesc('effective_from')->first();

        $reserve = 0;
        if ($config && (float) $balance->commercial_balance > 0) {
            $remainingDays = $date->daysInMonth - $date->day + 1;
            $reserve = (float) $balance->commercial_balance * ((float) $config->monthly_percentage / 100) * ($remainingDays / $date->daysInMonth);
        }
        $balance->update(['estimated_technical_reserve' => round($reserve, 3)]);
    }
}
