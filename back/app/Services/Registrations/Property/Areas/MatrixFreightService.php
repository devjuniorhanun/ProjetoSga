<?php

namespace App\Services\Registrations\Property\Areas;

use App\Models\Registrations\Property\Areas\MatrixFreight;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MatrixFreightService
{
    public function list()
    {
        return MatrixFreight::query()->with('crop')
            ->orderByDesc('effective_from')->orderByDesc('id')->get();
    }

    public function create(array $data): MatrixFreight
    {
        return DB::transaction(function () use ($data): MatrixFreight {
            $data['effective_from'] ??= now();
            $this->closeCurrentVersion($data);
            $this->assertNoOverlap($data);

            return MatrixFreight::create($data)->load('crop');
        });
    }

    public function update(MatrixFreight $item, array $data): MatrixFreight
    {
        $merged = array_merge($item->only(['crop_id', 'block', 'route', 'price', 'status']), $data);
        $changesVersion = (string) $merged['price'] !== (string) $item->getRawOriginal('price')
            || (int) $merged['crop_id'] !== (int) $item->crop_id
            || $merged['block'] !== $item->block || $merged['route'] !== $item->route;

        if ($changesVersion) {
            if ($item->effective_to !== null || $item->status !== 'A') {
                throw ValidationException::withMessages([
                    'price' => ['Uma matriz histórica não pode ser alterada. Crie uma nova vigência.'],
                ]);
            }
            $merged['effective_from'] = $data['effective_from'] ?? now();
            unset($merged['effective_to']);

            return $this->create($merged);
        }

        return DB::transaction(function () use ($item, $data): MatrixFreight {
            if (($data['status'] ?? null) === 'I' && $item->effective_to === null && empty($data['effective_to'])) {
                $data['effective_to'] = now();
            }
            $candidate = array_merge($item->toArray(), $data);
            $this->assertNoOverlap($candidate, $item->id);
            $item->update($data);

            return $item->refresh()->load('crop');
        });
    }

    public function delete(MatrixFreight $item): void
    {
        $item->delete();
    }

    private function closeCurrentVersion(array $data): void
    {
        if (($data['status'] ?? 'A') !== 'A') {
            return;
        }
        $startsAt = Carbon::parse($data['effective_from']);
        $current = MatrixFreight::query()
            ->where('crop_id', $data['crop_id'])->where('block', $data['block'])
            ->where('route', $data['route'])->where('status', 'A')
            ->whereNull('effective_to')->lockForUpdate()->first();
        if (!$current) {
            return;
        }
        if ($startsAt->lessThanOrEqualTo($current->effective_from)) {
            throw ValidationException::withMessages([
                'effective_from' => ['A nova vigência deve iniciar depois da vigência atual.'],
            ]);
        }
        $current->update(['effective_to' => $startsAt->copy()->subSecond(), 'status' => 'I']);
    }

    private function assertNoOverlap(array $data, ?int $ignoreId = null): void
    {
        $from = Carbon::parse($data['effective_from']);
        $to = !empty($data['effective_to']) ? Carbon::parse($data['effective_to']) : null;
        $overlap = MatrixFreight::query()
            ->where('crop_id', $data['crop_id'])->where('block', $data['block'])
            ->where('route', $data['route'])
            ->when($ignoreId, fn ($query) => $query->where('id', '<>', $ignoreId))
            ->where('effective_from', '<=', $to ?? '9999-12-31 23:59:59')
            ->where(fn ($query) => $query->whereNull('effective_to')->orWhere('effective_to', '>=', $from))
            ->exists();
        if ($overlap) {
            throw ValidationException::withMessages([
                'effective_from' => ['Já existe uma matriz para a mesma safra, bloco e percurso neste período.'],
            ]);
        }
    }
}
