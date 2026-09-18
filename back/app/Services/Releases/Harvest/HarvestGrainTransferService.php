<?php

namespace App\Services\Releases\Harvest;

use App\Models\Releases\Harvest\HarvestGrainTransfer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class HarvestGrainTransferService
{
    private const RELATIONS = ['crop', 'producer.owner', 'owner', 'warehouse', 'culture', 'creator'];

    public function list(array $filters)
    {
        return HarvestGrainTransfer::query()->with(self::RELATIONS)
            ->when($filters['crop_id'] ?? null, fn (Builder $q, $v) => $q->where('crop_id', $v))
            ->when($filters['producer_id'] ?? null, fn (Builder $q, $v) => $q->where('producer_id', $v))
            ->when($filters['owner_id'] ?? null, fn (Builder $q, $v) => $q->where('owner_id', $v))
            ->when($filters['warehouse_id'] ?? null, fn (Builder $q, $v) => $q->where('warehouse_id', $v))
            ->when($filters['culture_id'] ?? null, fn (Builder $q, $v) => $q->where('culture_id', $v))
            ->when($filters['status'] ?? null, fn (Builder $q, $v) => $q->where('status', $v))
            ->orderByDesc('transfer_date')->orderByDesc('id')
            ->paginate(min(max((int) ($filters['per_page'] ?? 25), 1), 100))->withQueryString();
    }

    public function find(HarvestGrainTransfer $transfer): HarvestGrainTransfer
    {
        return $transfer->load(self::RELATIONS);
    }

    public function save(array $data, ?HarvestGrainTransfer $transfer, ?int $userId): HarvestGrainTransfer
    {
        return DB::transaction(function () use ($data, $transfer, $userId): HarvestGrainTransfer {
            $transfer ??= new HarvestGrainTransfer();
            $merged = [...$transfer->only($transfer->getFillable()), ...$data];
            $merged['status'] ??= 'A';
            $this->validateReferences($merged);
            $quantity = round((float) $merged['quantity_kg'], 3);

            DB::table('harvest_releases')->where('crop_id', $merged['crop_id'])->lockForUpdate()->get(['id']);
            DB::table('harvest_grain_transfers')->where('crop_id', $merged['crop_id'])->lockForUpdate()->get(['id']);

            if ($merged['status'] === 'A') {
                $available = $this->availableKg($merged, $transfer->exists ? $transfer->id : null);
                if ($quantity > $available + 0.0005) {
                    throw ValidationException::withMessages([
                        'quantity_kg' => ['A transferência excede o saldo disponível de '.number_format($available, 3, ',', '.').' kg.'],
                    ]);
                }
            }

            $merged['quantity_kg'] = $quantity;
            $merged['quantity_bags'] = round($quantity / 60, 3);
            $merged['created_by'] = $transfer->created_by ?: $userId;
            $transfer->fill($merged)->save();

            return $this->find($transfer->refresh());
        });
    }

    public function delete(HarvestGrainTransfer $transfer): void
    {
        $transfer->delete();
    }

    public function availableKg(array $keys, ?int $exceptTransferId = null): float
    {
        $input = (float) DB::table('harvest_releases as hr')
            ->join('plot_fields as pf', 'pf.id', '=', 'hr.plot_field_id')
            ->join('fields as f', 'f.id', '=', 'pf.field_id')
            ->join('farms as farm', 'farm.id', '=', 'f.farm_id')
            ->where('hr.crop_id', $keys['crop_id'])->where('farm.producer_id', $keys['producer_id'])
            ->where('hr.warehouse_id', $keys['warehouse_id'])->where('pf.culture_id', $keys['culture_id'])
            ->where('hr.status', 'A')->whereNull('hr.deleted_at')->whereNull('pf.deleted_at')
            ->whereNull('f.deleted_at')->whereNull('farm.deleted_at')->sum('hr.net_weight');

        $transferred = (float) DB::table('harvest_grain_transfers')
            ->where('crop_id', $keys['crop_id'])->where('producer_id', $keys['producer_id'])
            ->where('warehouse_id', $keys['warehouse_id'])->where('culture_id', $keys['culture_id'])
            ->where('status', 'A')->whereNull('deleted_at')
            ->when($exceptTransferId, fn ($q, $id) => $q->where('id', '<>', $id))->sum('quantity_kg');

        return round(max(0, $input - $transferred), 3);
    }

    private function validateReferences(array $data): void
    {
        $checks = [
            'crop_id' => ['crops', 'A', 'A safra deve estar ativa.'],
            'producer_id' => ['producers', 'A', 'O produtor deve estar ativo.'],
            'warehouse_id' => ['warehouses', 'A', 'O armazém deve estar ativo.'],
            'culture_id' => ['cultures', 'A', 'A cultura deve estar ativa.'],
        ];
        foreach ($checks as $field => [$table, $status, $message]) {
            if (! DB::table($table)->where('id', $data[$field])->where('status', $status)->whereNull('deleted_at')->exists()) {
                throw ValidationException::withMessages([$field => [$message]]);
            }
        }
        if (! DB::table('owners')->where('id', $data['owner_id'])->where('payment_type', 'T')
            ->where('status', 'A')->whereNull('deleted_at')->exists()) {
            throw ValidationException::withMessages(['owner_id' => ['O proprietário deve estar ativo e possuir payment_type igual a T.']]);
        }
        if (! DB::table('crop_culture')->where('crop_id', $data['crop_id'])->where('culture_id', $data['culture_id'])->exists()) {
            throw ValidationException::withMessages(['culture_id' => ['A cultura não pertence à safra selecionada.']]);
        }
    }
}
