<?php

namespace App\Services\Reports\Harvest;

use App\Models\Registrations\Harvest\Crop;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class HarvestReportService
{
    public function productivityOptions(?int $cropId = null): array
    {
        $crops = DB::table('crops')->whereNull('deleted_at')->where('status', 'A')
            ->select('id', 'name', 'opening_date', 'closing_date', 'status')
            ->orderByDesc('opening_date')->orderByDesc('id')->get();
        $defaultCropId = $crops->first()?->id;
        $selectedCropId = $cropId && $crops->contains('id', $cropId) ? $cropId : $defaultCropId;
        $base = DB::table('harvest_releases as hr')
            ->join('plot_fields as pf', 'pf.id', '=', 'hr.plot_field_id')
            ->join('fields as f', 'f.id', '=', 'pf.field_id')->join('farms as farm', 'farm.id', '=', 'f.farm_id')
            ->join('producers as p', 'p.id', '=', 'farm.producer_id')->join('owners as po', 'po.id', '=', 'p.owner_id')
            ->join('owners as ho', 'ho.id', '=', 'hr.owner_id')->join('cultures as c', 'c.id', '=', 'pf.culture_id')
            ->join('variety_cultures as v', 'v.id', '=', 'pf.variety_culture_id')
            ->join('warehouses as w', 'w.id', '=', 'hr.warehouse_id')->join('drivers as d', 'd.id', '=', 'hr.driver_id')
            ->join('lanyards as l', 'l.id', '=', 'hr.lanyard_id')
            ->where('hr.crop_id', $selectedCropId)->where('hr.status', 'A')->whereNull('hr.deleted_at')
            ->where('pf.status', 'A')->where('f.status', 'A')->where('farm.status', 'A')
            ->where('p.status', 'A')->where('po.status', 'A')->where('ho.status', 'A')
            ->where('c.status', 'A')->where('v.status', 'A')->where('w.status', 'A')
            ->where('d.status', 'A')->where('l.status', 'A');
        $items = $selectedCropId ? $base->select('farm.id as farm_id', 'farm.name as farm_name',
            'p.id as producer_id', 'po.corporate_name as producer_name', 'ho.id as owner_id',
            'ho.corporate_name as owner_name', 'pf.id as plot_field_id', 'pf.name as plot_name',
            'f.name as field_name', 'c.id as culture_id', 'c.name as culture_name',
            'v.id as variety_id', 'v.name as variety_name', 'w.id as warehouse_id', 'w.name as warehouse_name',
            'd.id as driver_id', 'd.name as driver_name', 'l.id as lanyard_id', 'l.name as lanyard_name')->get() : collect();

        $options = fn (string $id, string $name) => $items->map(fn ($item) => [
            'id' => $item->{$id}, 'name' => $item->{$name},
        ])->unique('id')->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)->values()->all();

        return [
            'crops' => $crops,
            'active_crops' => $crops->values(),
            'default_crop_id' => $defaultCropId,
            'selected_crop_id' => $selectedCropId,
            'producers' => $options('producer_id', 'producer_name'),
            'owners' => $options('owner_id', 'owner_name'),
            'farms' => $options('farm_id', 'farm_name'),
            'plot_fields' => $items->map(fn ($item) => ['id'=>$item->plot_field_id, 'name'=>$item->plot_name,
                'field_name'=>$item->field_name])->unique('id')->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)->values()->all(),
            'cultures' => $options('culture_id', 'culture_name'),
            'varieties' => $options('variety_id', 'variety_name'),
            'warehouses' => $options('warehouse_id', 'warehouse_name'),
            'drivers' => $options('driver_id', 'driver_name'),
            'harvesters' => $options('lanyard_id', 'lanyard_name'),
            'order_options' => ['NAME_ASC', 'PRODUCTIVITY_ASC', 'PRODUCTIVITY_DESC', 'PRODUCTION_DESC'],
        ];
    }

    public function productivity(Crop $crop, array $filters, string $dimension): array
    {
        $items = DB::table('harvest_releases as hr')
            ->join('plot_fields as pf', 'pf.id', '=', 'hr.plot_field_id')
            ->join('fields as f', 'f.id', '=', 'pf.field_id')
            ->join('farms as farm', 'farm.id', '=', 'f.farm_id')
            ->join('producers as p', 'p.id', '=', 'farm.producer_id')
            ->join('owners as o', 'o.id', '=', 'p.owner_id')
            ->join('cultures as c', 'c.id', '=', 'pf.culture_id')
            ->join('variety_cultures as v', 'v.id', '=', 'pf.variety_culture_id')
            ->join('lanyards as l', 'l.id', '=', 'hr.lanyard_id')
            ->where('hr.crop_id', $crop->id)->where('hr.status', 'A')->whereNull('hr.deleted_at')
            ->whereNull('pf.deleted_at')->whereNull('f.deleted_at')->whereNull('farm.deleted_at')
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('hr.release_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('hr.release_date', '<=', $v))
            ->when($filters['producer_id'] ?? null, fn ($q, $v) => $q->where('farm.producer_id', $v))
            ->when($filters['owner_id'] ?? null, fn ($q, $v) => $q->where('hr.owner_id', $v))
            ->when($filters['warehouse_id'] ?? null, fn ($q, $v) => $q->where('hr.warehouse_id', $v))
            ->when($filters['culture_id'] ?? null, fn ($q, $v) => $q->where('pf.culture_id', $v))
            ->when($filters['farm_id'] ?? null, fn ($q, $v) => $q->where('farm.id', $v))
            ->when($filters['plot_field_id'] ?? null, fn ($q, $v) => $q->where('pf.id', $v))
            ->when($filters['variety_culture_id'] ?? null, fn ($q, $v) => $q->where('pf.variety_culture_id', $v))
            ->when($filters['driver_id'] ?? null, fn ($q, $v) => $q->where('hr.driver_id', $v))
            ->when($filters['lanyard_id'] ?? null, fn ($q, $v) => $q->where('hr.lanyard_id', $v))
            ->select('hr.id', 'hr.gross_weight', 'hr.discount_weight', 'hr.net_weight', 'hr.gross_bags',
                'hr.liquid_bags', 'hr.shipping_value', 'pf.id as plot_field_id', 'pf.area',
                'f.id as field_id', 'f.name as field_name', 'pf.name as plot_name', 'farm.id as farm_id', 'farm.name as farm_name',
                'farm.producer_id', 'o.corporate_name as producer_name', 'c.id as culture_id',
                'c.name as culture_name', 'v.id as variety_id', 'v.name as variety_name',
                'l.id as lanyard_id', 'l.name as lanyard_name')->get();

        $groups = $items->groupBy(function ($item) use ($dimension): string {
            $id = match ($dimension) {
                'FARM' => $item->farm_id,
                'VARIETY' => $item->variety_id,
                'HARVESTER' => $item->lanyard_id,
                default => $item->plot_field_id,
            };
            return $id.':'.$item->culture_id;
        });

        $rows = $groups->map(function ($group) use ($dimension): array {
            $first = $group->first();
            $name = match ($dimension) {
                'FARM' => $first->farm_name,
                'VARIETY' => $first->variety_name,
                'HARVESTER' => $first->lanyard_name,
                default => $first->plot_name,
            };
            $id = match ($dimension) {
                'FARM' => $first->farm_id,
                'VARIETY' => $first->variety_id,
                'HARVESTER' => $first->lanyard_id,
                default => $first->plot_field_id,
            };
            $area = round((float) $group->unique('plot_field_id')->sum('area'), 3);
            $netBags = round((float) $group->sum('liquid_bags'), 3);

            return [
                'id' => $id, 'name' => $name, 'culture_id' => $first->culture_id,
                'culture_name' => $first->culture_name, 'trips_count' => $group->count(),
                'gross_weight_kg' => round((float) $group->sum('gross_weight'), 3),
                'discount_weight_kg' => round((float) $group->sum('discount_weight'), 3),
                'net_weight_kg' => round((float) $group->sum('net_weight'), 3),
                'gross_bags' => round((float) $group->sum('gross_bags'), 3),
                'net_bags' => $netBags, 'harvested_area_ha' => $area,
                'productivity_bags_ha' => $area > 0 ? round($netBags / $area, 3) : null,
                'shipping_value' => round((float) $group->sum('shipping_value'), 2),
            ];
        });
        $rows = match ($filters['order_by'] ?? 'PRODUCTIVITY_DESC') {
            'NAME_ASC' => $rows->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE),
            'PRODUCTIVITY_ASC' => $rows->sortBy('productivity_bags_ha'),
            'PRODUCTION_DESC' => $rows->sortByDesc('net_bags'),
            default => $rows->sortByDesc('productivity_bags_ha'),
        };
        $uniquePlots = $items->unique('plot_field_id');
        $area = round((float) $uniquePlots->sum('area'), 3);
        $netBags = round((float) $items->sum('liquid_bags'), 3);
        $grossBags = round((float) $items->sum('gross_bags'), 3);
        $shipping = round((float) $items->sum('shipping_value'), 2);

        return [
            'report' => 'HARVEST_PRODUCTIVITY_'.$dimension,
            'dimension' => $dimension,
            'crop' => ['id' => $crop->id, 'name' => $crop->name],
            'filters' => $filters,
            'generated_at' => now()->toISOString(),
            'summary' => [
                'trips_count' => $items->count(), 'gross_weight_kg' => round((float) $items->sum('gross_weight'), 3),
                'discount_weight_kg' => round((float) $items->sum('discount_weight'), 3),
                'net_weight_kg' => round((float) $items->sum('net_weight'), 3), 'gross_bags' => $grossBags,
                'net_bags' => $netBags, 'harvested_area_ha' => $area,
                'average_productivity_bags_ha' => $area > 0 ? round($netBags / $area, 3) : null,
                'shipping_value' => $shipping,
                'average_shipping_per_gross_bag' => $grossBags > 0 ? round($shipping / $grossBags, 2) : null,
                'by_culture' => $items->groupBy('culture_id')->map(fn ($culture) => [
                    'culture_id' => $culture->first()->culture_id, 'culture_name' => $culture->first()->culture_name,
                    'net_bags' => round((float) $culture->sum('liquid_bags'), 3),
                ])->values()->all(),
            ],
            'area_method' => 'A área cadastrada de cada PlotField com colheita é considerada uma única vez.',
            'warnings' => array_values(array_filter([
                (($filters['date_from'] ?? null) || ($filters['date_to'] ?? null))
                    ? 'O lançamento de colheita não possui área colhida por viagem. Em períodos parciais, a produtividade usa a área total cadastrada dos talhões encontrados.' : null,
            ])),
            'rows' => $rows->values()->all(),
        ];
    }

    public function consolidated(Crop $crop, array $filters): array
    {
        $entriesQuery = DB::table('harvest_releases as hr')
            ->join('plot_fields as pf', 'pf.id', '=', 'hr.plot_field_id')
            ->join('fields as f', 'f.id', '=', 'pf.field_id')
            ->join('farms as farm', 'farm.id', '=', 'f.farm_id')
            ->join('producers as p', 'p.id', '=', 'farm.producer_id')
            ->join('owners as po', 'po.id', '=', 'p.owner_id')
            ->join('owners as ho', 'ho.id', '=', 'hr.owner_id')
            ->join('warehouses as w', 'w.id', '=', 'hr.warehouse_id')
            ->join('cultures as c', 'c.id', '=', 'pf.culture_id')
            ->join('drivers as d', 'd.id', '=', 'hr.driver_id')
            ->join('lanyards as l', 'l.id', '=', 'hr.lanyard_id')
            ->where('hr.crop_id', $crop->id)->where('hr.status', 'A')->whereNull('hr.deleted_at')
            ->whereNull('pf.deleted_at')->whereNull('f.deleted_at')->whereNull('farm.deleted_at');
        $this->entryFilters($entriesQuery, $filters);

        $entries = (clone $entriesQuery)->select('hr.id', 'hr.release_date', 'hr.shipping_number', 'hr.control_number',
            'hr.gross_weight', 'hr.discount_weight', 'hr.net_weight', 'hr.gross_bags', 'hr.liquid_bags',
            'hr.shipping_value', 'd.name as driver_name', 'pf.name as plot_name', 'f.name as field_name', 'w.name as warehouse_name',
            'l.name as lanyard_name', 'c.name as culture_name', 'po.corporate_name as producer_name',
            'ho.corporate_name as harvest_owner_name', 'farm.producer_id', 'hr.owner_id', 'hr.warehouse_id',
            'pf.culture_id')->orderBy('hr.release_date')->orderBy('hr.id')->get();

        $transfersQuery = DB::table('harvest_grain_transfers as t')
            ->join('producers as p', 'p.id', '=', 't.producer_id')->join('owners as po', 'po.id', '=', 'p.owner_id')
            ->join('owners as destination', 'destination.id', '=', 't.owner_id')
            ->join('warehouses as w', 'w.id', '=', 't.warehouse_id')->join('cultures as c', 'c.id', '=', 't.culture_id')
            ->where('t.crop_id', $crop->id)->where('t.status', 'A')->whereNull('t.deleted_at');
        $this->transferFilters($transfersQuery, $filters);
        $transfers = (clone $transfersQuery)->select('t.*', 'po.corporate_name as producer_name',
            'destination.corporate_name as destination_owner_name', 'w.name as warehouse_name',
            'c.name as culture_name')->orderBy('t.transfer_date')->orderBy('t.id')->get();

        $inputKg = round((float) $entries->sum('net_weight'), 3);
        $inputBags = round((float) $entries->sum('liquid_bags'), 3);
        $transferKg = round((float) $transfers->sum('quantity_kg'), 3);
        $transferBags = round((float) $transfers->sum('quantity_bags'), 3);
        $balanceKg = round($inputKg - $transferKg, 3);
        $balanceBags = round($inputBags - $transferBags, 3);

        return [
            'report' => 'HARVEST_CONSOLIDATED',
            'crop' => ['id' => $crop->id, 'name' => $crop->name],
            'filters' => $filters,
            'generated_at' => now()->toISOString(),
            'summary' => [
                'gross_weight_kg' => round((float) $entries->sum('gross_weight'), 3),
                'gross_bags' => round((float) $entries->sum('gross_bags'), 3),
                'discount_weight_kg' => round((float) $entries->sum('discount_weight'), 3),
                'input_net_weight_kg' => $inputKg,
                'input_net_bags' => $inputBags,
                'transferred_weight_kg' => $transferKg,
                'transferred_bags' => $transferBags,
                'balance_weight_kg' => $balanceKg,
                'balance_bags' => $balanceBags,
                'shipping_value' => round((float) $entries->sum('shipping_value'), 2),
                'entries_count' => $entries->count(),
                'transfers_count' => $transfers->count(),
                'reconciled' => $balanceKg >= -0.0005,
            ],
            'consolidation' => $this->consolidation($entries, $transfers),
            'entries' => $entries,
            'transfers' => $transfers,
        ];
    }

    private function consolidation($entries, $transfers): array
    {
        $rows = [];
        foreach ($entries as $entry) {
            $key = implode(':', [$entry->producer_id, $entry->warehouse_id, $entry->culture_id]);
            $rows[$key] ??= ['producer_id' => $entry->producer_id, 'producer_name' => $entry->producer_name,
                'warehouse_id' => $entry->warehouse_id, 'warehouse_name' => $entry->warehouse_name,
                'culture_id' => $entry->culture_id, 'culture_name' => $entry->culture_name,
                'input_kg' => 0.0, 'transferred_kg' => 0.0];
            $rows[$key]['input_kg'] += (float) $entry->net_weight;
        }
        foreach ($transfers as $transfer) {
            $key = implode(':', [$transfer->producer_id, $transfer->warehouse_id, $transfer->culture_id]);
            $rows[$key] ??= ['producer_id' => $transfer->producer_id, 'producer_name' => $transfer->producer_name,
                'warehouse_id' => $transfer->warehouse_id, 'warehouse_name' => $transfer->warehouse_name,
                'culture_id' => $transfer->culture_id, 'culture_name' => $transfer->culture_name,
                'input_kg' => 0.0, 'transferred_kg' => 0.0];
            $rows[$key]['transferred_kg'] += (float) $transfer->quantity_kg;
        }
        return collect($rows)->map(function (array $row): array {
            $row['input_kg'] = round($row['input_kg'], 3);
            $row['transferred_kg'] = round($row['transferred_kg'], 3);
            $row['balance_kg'] = round($row['input_kg'] - $row['transferred_kg'], 3);
            $row['input_bags'] = round($row['input_kg'] / 60, 3);
            $row['transferred_bags'] = round($row['transferred_kg'] / 60, 3);
            $row['balance_bags'] = round($row['balance_kg'] / 60, 3);
            return $row;
        })->sortBy(fn (array $row): string => implode('|', [
            $row['producer_name'], $row['warehouse_name'], $row['culture_name'],
        ]), SORT_NATURAL | SORT_FLAG_CASE)->values()->all();
    }

    private function entryFilters(Builder $query, array $filters): void
    {
        $query->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('hr.release_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('hr.release_date', '<=', $v))
            ->when($filters['producer_id'] ?? null, fn ($q, $v) => $q->where('farm.producer_id', $v))
            ->when($filters['warehouse_id'] ?? null, fn ($q, $v) => $q->where('hr.warehouse_id', $v))
            ->when($filters['culture_id'] ?? null, fn ($q, $v) => $q->where('pf.culture_id', $v));
    }

    private function transferFilters(Builder $query, array $filters): void
    {
        $query->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('t.transfer_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('t.transfer_date', '<=', $v))
            ->when($filters['producer_id'] ?? null, fn ($q, $v) => $q->where('t.producer_id', $v))
            ->when($filters['owner_id'] ?? null, fn ($q, $v) => $q->where('t.owner_id', $v))
            ->when($filters['warehouse_id'] ?? null, fn ($q, $v) => $q->where('t.warehouse_id', $v))
            ->when($filters['culture_id'] ?? null, fn ($q, $v) => $q->where('t.culture_id', $v));
    }
}
