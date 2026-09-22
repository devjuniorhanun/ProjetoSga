<?php

namespace App\Http\Controllers\Reports\Agricultural;

use App\Http\Controllers\Controller;
use App\Models\Registrations\Agricultural\Defensive\TypeOperation;
use App\Models\Registrations\Harvest\Crop;
use App\Models\Registrations\Property\Areas\Field;
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class DefensiveOrderReportController extends Controller
{
    public function options(Request $request)
    {
        $filters = $request->validate([
            'crop_id' => ['nullable', 'integer', 'exists:crops,id'],
            'type_operation_id' => ['nullable', 'integer', 'exists:type_operations,id'],
        ]);

        $crops = Crop::query()
            ->whereHas('defensiveOrders')
            ->orderBy('name')
            ->get(['id', 'name']);

        $operations = collect();
        if (!empty($filters['crop_id'])) {
            $operations = TypeOperation::query()
                ->whereHas('defensiveOrders', fn (Builder $query) => $query->where('crop_id', $filters['crop_id']))
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        $fields = collect();
        if (!empty($filters['crop_id']) && !empty($filters['type_operation_id'])) {
            $fields = Field::query()
                ->whereHas('defensiveOrders', fn (Builder $query) => $query
                    ->where('crop_id', $filters['crop_id'])
                    ->where('type_operation_id', $filters['type_operation_id']))
                ->orderBy('name')
                ->get(['id', 'name', 'area']);
        }

        return response()->json(['data' => compact('crops', 'operations', 'fields')]);
    }

    public function orders(Request $request)
    {
        $filters = $request->validate([
            'crop_id' => ['required', 'integer', 'exists:crops,id'],
            'type_operation_id' => ['required', 'integer', 'exists:type_operations,id'],
            'field_id' => ['required', 'integer', 'exists:fields,id'],
        ]);

        $orders = $this->baseQuery($filters)->get();
        $field = Field::query()->findOrFail($filters['field_id']);
        $area = min((float) $field->area, $orders->sum(fn ($order) => max((float) $order->area, 0)));

        return response()->json(['data' => [
            'crop' => Crop::query()->findOrFail($filters['crop_id'], ['id', 'name']),
            'operation' => TypeOperation::query()->findOrFail($filters['type_operation_id'], ['id', 'name']),
            'field' => ['id' => $field->id, 'name' => $field->name, 'real_area' => round((float) $field->area, 3)],
            'considered_area' => round($area, 3),
            'orders' => $orders->map(fn ($order) => $this->orderData($order))->values(),
            'products' => $this->aggregateProducts($orders, $area),
        ]]);
    }

    public function products(Request $request)
    {
        $filters = $request->validate([
            'crop_id' => ['required', 'integer', 'exists:crops,id'],
            'type_operation_id' => ['required', 'integer', 'exists:type_operations,id'],
        ]);

        $orders = $this->baseQuery($filters)->get();
        $area = $orders
            ->groupBy('field_id')
            ->sum(function ($fieldOrders): float {
                $realArea = (float) optional($fieldOrders->first()->field)->area;
                return min($realArea, $fieldOrders->sum(fn ($order) => max((float) $order->area, 0)));
            });

        return response()->json(['data' => [
            'crop' => Crop::query()->findOrFail($filters['crop_id'], ['id', 'name']),
            'operation' => TypeOperation::query()->findOrFail($filters['type_operation_id'], ['id', 'name']),
            'field_count' => $orders->pluck('field_id')->unique()->count(),
            'order_count' => $orders->count(),
            'considered_area' => round($area, 3),
            'products' => $this->aggregateProducts($orders, $area),
        ]]);
    }

    public function totalProducts(Request $request)
    {
        $filters = $request->validate([
            'crop_id' => ['required', 'integer', 'exists:crops,id'],
        ]);

        $orders = AgriculturalDefensiveOrder::query()
            ->with(['field', 'products.product', 'typeOperation'])
            ->where('crop_id', $filters['crop_id'])
            ->orderBy('application_date')
            ->orderBy('os_number')
            ->get();

        $area = $orders
            ->groupBy('field_id')
            ->sum(function ($fieldOrders): float {
                $realArea = (float) optional($fieldOrders->first()->field)->area;
                return min($realArea, $fieldOrders->sum(fn ($order) => max((float) $order->area, 0)));
            });

        return response()->json(['data' => [
            'crop' => Crop::query()->findOrFail($filters['crop_id'], ['id', 'name']),
            'operation_count' => $orders->pluck('type_operation_id')->unique()->count(),
            'field_count' => $orders->pluck('field_id')->unique()->count(),
            'order_count' => $orders->count(),
            'considered_area' => round($area, 3),
            'products' => $this->aggregateProducts($orders, $area),
        ]]);
    }

    private function baseQuery(array $filters): Builder
    {
        return AgriculturalDefensiveOrder::query()
            ->with(['crop', 'culture', 'typeOperation', 'field', 'products.product', 'operators.operator.supplier', 'operators.fleet'])
            ->where('crop_id', $filters['crop_id'])
            ->where('type_operation_id', $filters['type_operation_id'])
            ->when(!empty($filters['field_id']), fn (Builder $query) => $query->where('field_id', $filters['field_id']))
            ->orderBy('application_date')
            ->orderBy('os_number');
    }

    private function orderData(AgriculturalDefensiveOrder $order): array
    {
        $realArea = (float) optional($order->field)->area;
        $area = min(max((float) $order->area, 0), $realArea);

        return [
            'id' => $order->id,
            'os_number' => $order->os_number,
            'application_date' => $order->application_date?->format('Y-m-d'),
            'crop_name' => $order->crop?->name,
            'culture_name' => $order->culture?->name,
            'operation_name' => $order->typeOperation?->name,
            'field_name' => $order->field?->name,
            'area' => round($area, 3),
            'field_real_area' => round($realArea, 3),
            'recommended_pump' => round((float) $order->recommended_pump, 3),
            'used_bomb' => round((float) $order->used_bomb, 3),
            'status' => $order->status,
            'observation' => $order->observation,
            'operators' => $order->operators->map(fn ($operator) => [
                'name' => $operator->operator?->supplier?->corporate_reason,
                'fleet' => $operator->fleet?->name ?? $operator->fleet?->plate,
                'function' => $operator->function,
            ])->values(),
            'products' => $order->products->map(fn ($product) => [
                'product_id' => $product->product_id,
                'product_name' => $product->product?->name,
                'recommended_quantity' => round((float) $product->recommended_quantity, 3),
                'used_quantity' => round((float) $product->actual_quantity, 3),
                'used_per_area' => $area > 0 ? round((float) $product->actual_quantity / $area, 3) : null,
            ])->values(),
        ];
    }

    private function aggregateProducts($orders, float $area)
    {
        return $orders->flatMap(fn ($order) => $order->products)
            ->groupBy('product_id')
            ->map(function ($items) use ($area): array {
                $recommended = $items->sum(fn ($item) => (float) $item->recommended_quantity);
                $used = $items->sum(fn ($item) => (float) $item->actual_quantity);

                return [
                    'product_id' => $items->first()->product_id,
                    'product_name' => $items->first()->product?->name,
                    'recommended_quantity' => round($recommended, 3),
                    'used_quantity' => round($used, 3),
                    'used_per_area' => $area > 0 ? round($used / $area, 3) : null,
                ];
            })
            ->sortBy('product_name')
            ->values();
    }
}
