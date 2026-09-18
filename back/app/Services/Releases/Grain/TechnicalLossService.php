<?php

namespace App\Services\Releases\Grain;

use App\Models\Registrations\Grain\TechnicalLossConfig;
use App\Models\Releases\Grain\GrainBalance;
use App\Models\Releases\Grain\StockMovement;
use App\Models\Releases\Grain\TechnicalLoss;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TechnicalLossService
{
    public function __construct(private readonly DocumentNumberService $numbers) {}

    public function processDue(?int $userId = null, ?Carbon $today = null): int
    {
        $today ??= today();
        $lastClosedMonth = $today->copy()->startOfMonth()->subDay();
        $processed = 0;

        TechnicalLossConfig::query()->where('status', 'A')->whereDate('effective_from', '<=', $lastClosedMonth)
            ->chunkById(100, function ($configs) use (&$processed, $lastClosedMonth, $userId): void {
                foreach ($configs as $config) {
                    $query = GrainBalance::query()->where('producer_id', $config->producer_id)->where('culture_id', $config->culture_id);
                    foreach ($query->get() as $balance) {
                        $firstMovement = StockMovement::query()->where('grain_balance_id', $balance->id)->min('occurred_at');
                        if (!$firstMovement) continue;
                        $cursor = Carbon::parse($firstMovement)->max(Carbon::parse($config->effective_from))->startOfMonth();
                        $configEnd = $config->effective_until ? Carbon::parse($config->effective_until)->endOfMonth() : $lastClosedMonth;
                        $endLimit = $configEnd->min($lastClosedMonth);
                        while ($cursor->lte($endLimit)) {
                            $end = $cursor->copy()->endOfMonth();
                            $processed += $this->processBalance($balance->id, $config->id, $cursor->copy(), $end, $userId) ? 1 : 0;
                            $cursor->addMonth()->startOfMonth();
                        }
                    }
                }
            });
        return $processed;
    }

    private function processBalance(int $balanceId, int $configId, Carbon $start, Carbon $end, ?int $userId): bool
    {
        return DB::transaction(function () use ($balanceId, $configId, $start, $end, $userId): bool {
            $balance = GrainBalance::query()->lockForUpdate()->findOrFail($balanceId);
            $config = TechnicalLossConfig::query()->findOrFail($configId);
            if (TechnicalLoss::query()->where('grain_balance_id', $balance->id)->where('reference_year', $end->year)->where('reference_month', $end->month)->exists()) return false;

            $opening = (float) StockMovement::query()->where('grain_balance_id', $balance->id)->where('occurred_at', '<', $start)->sum('commercial_quantity');
            $dailyChanges = StockMovement::query()->where('grain_balance_id', $balance->id)->whereBetween('occurred_at', [$start, $end->copy()->endOfDay()])
                ->selectRaw('DATE(occurred_at) as movement_date, SUM(commercial_quantity) as quantity')->groupByRaw('DATE(occurred_at)')->pluck('quantity', 'movement_date');
            $running = $opening; $sum = 0; $snapshot = [];
            for ($day = $start->copy(); $day->lte($end); $day->addDay()) {
                $running += (float) ($dailyChanges[$day->toDateString()] ?? 0);
                $running = max(0, $running); $sum += $running;
                $snapshot[] = ['date' => $day->toDateString(), 'closing_balance' => round($running, 3)];
            }
            $average = $sum / $end->daysInMonth;
            $calculated = round($average * ((float) $config->monthly_percentage / 100), 3);
            $applied = min($calculated, (float) $balance->physical_balance, (float) $balance->commercial_balance);
            if ($applied <= 0) return false;
            $before = (float) $balance->commercial_balance;
            $balance->decrement('physical_balance', $applied);
            $balance->decrement('commercial_balance', $applied);
            $balance->update(['estimated_technical_reserve' => 0]);
            $loss = TechnicalLoss::create([
                'loss_number' => $this->numbers->next('QTB', $end->year, $end->month), 'grain_balance_id' => $balance->id,
                'grain_technical_loss_config_id' => $config->id, 'reference_year' => $end->year, 'reference_month' => $end->month,
                'period_start' => $start, 'period_end' => $end, 'monthly_percentage' => $config->monthly_percentage,
                'average_daily_balance' => $average, 'calculated_loss' => $calculated, 'applied_loss' => $applied,
                'balance_before' => $before, 'balance_after' => $before - $applied, 'daily_balance_snapshot' => $snapshot,
                'configuration_snapshot' => $config->toArray(), 'processed_by' => $userId, 'processed_at' => now(),
            ]);
            StockMovement::create([
                'movement_number' => $this->numbers->next('MOV'), 'grain_balance_id' => $balance->id,
                'movement_type' => 'TECHNICAL_LOSS', 'physical_quantity' => -$applied, 'commercial_quantity' => -$applied,
                'physical_balance_before' => (float) $balance->physical_balance + $applied, 'physical_balance_after' => (float) $balance->physical_balance,
                'commercial_balance_before' => $before, 'commercial_balance_after' => $before - $applied,
                'source_type' => TechnicalLoss::class, 'source_id' => $loss->id,
                'created_by' => $userId, 'occurred_at' => $end->copy()->endOfDay(),
            ]);
            $remainingDays = now()->daysInMonth - now()->day + 1;
            $balance->update(['estimated_technical_reserve' => round((float) $balance->commercial_balance * ((float) $config->monthly_percentage / 100) * ($remainingDays / now()->daysInMonth), 3)]);
            return true;
        });
    }
}
