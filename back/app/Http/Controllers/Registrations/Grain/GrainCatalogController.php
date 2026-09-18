<?php

namespace App\Http\Controllers\Registrations\Grain;

use App\Http\Controllers\Controller;
use App\Models\Registrations\Grain\DiscountType;
use App\Models\Registrations\Grain\ImpurityType;
use App\Models\Registrations\Grain\Scale;
use App\Models\Registrations\Grain\ScaleChannel;
use App\Models\Registrations\Grain\StorageLocation;
use App\Models\Registrations\Grain\TechnicalLossConfig;
use App\Models\Registrations\Grain\TransportDriver;
use App\Models\Registrations\Grain\TransportTruck;
use App\Models\Registrations\Grain\Warehouse;
use App\Models\Registrations\Property\Registration\FarmStateRegistration;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

class GrainCatalogController extends Controller
{
    private const MODELS = [
        'scales' => Scale::class,
        'scale-channels' => ScaleChannel::class,
        'warehouses' => Warehouse::class,
        'storage-locations' => StorageLocation::class,
        'transport-drivers' => TransportDriver::class,
        'transport-trucks' => TransportTruck::class,
        'discount-types' => DiscountType::class,
        'impurity-types' => ImpurityType::class,
        'technical-loss-configs' => TechnicalLossConfig::class,
        'farm-state-registrations' => FarmStateRegistration::class,
    ];

    public function index(Request $request, string $catalog)
    {
        $model = $this->model($catalog);
        $query = $model::query();

        if ($catalog === 'farm-state-registrations') {
            $query->with(['producer.owner', 'farm']);
        }

        foreach (['status', 'producer_id', 'farm_id', 'culture_id', 'crop_id', 'grain_scale_id', 'grain_warehouse_id'] as $field) {
            if ($catalog === 'farm-state-registrations' && $field === 'culture_id') {
                continue;
            }

            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        return $query->orderBy($query->getModel()->getKeyName())->paginate(min((int) $request->input('per_page', 25), 100));
    }

    public function store(Request $request, string $catalog)
    {
        $model = $this->model($catalog);
        $data = $request->validate($this->rules($catalog));
        $data = $this->normalize($catalog, $data, $request);
        if ($catalog === 'technical-loss-configs') $data['created_by'] = $request->user()->id;
        $this->validateBusinessRules($catalog, $data);

        return response()->json($model::create($data), 201);
    }

    public function show(string $catalog, int $id): Model
    {
        $model = $this->model($catalog);
        return $model::query()->findOrFail($id);
    }

    public function update(Request $request, string $catalog, int $id): Model
    {
        $modelClass = $this->model($catalog);
        $model = $modelClass::query()->findOrFail($id);
        $data = $request->validate($this->rules($catalog, $id, true));
        $data = $this->normalize($catalog, $data, $request);
        $this->validateBusinessRules($catalog, [...$model->toArray(), ...$data], $id);
        $model->update($data);
        return $model->refresh();
    }

    public function destroy(string $catalog, int $id)
    {
        $model = $this->model($catalog)::query()->findOrFail($id);
        $model->delete();
        return response()->noContent();
    }

    private function model(string $catalog): string
    {
        abort_unless(isset(self::MODELS[$catalog]), 404, 'Cadastro de grãos não encontrado.');
        return self::MODELS[$catalog];
    }

    private function rules(string $catalog, ?int $id = null, bool $update = false): array
    {
        $required = $update ? 'sometimes' : 'required';
        $status = ['sometimes', Rule::in(['A', 'I'])];

        return match ($catalog) {
            'scales' => ['name' => [$required, 'string', 'max:255'], 'code' => [$required, 'string', 'max:50', Rule::unique('grain_scales')->ignore($id)], 'manufacturer' => ['nullable', 'string'], 'model' => ['nullable', 'string'], 'serial_number' => ['nullable', 'string'], 'location' => ['nullable', 'string'], 'status' => $status, 'notes' => ['nullable', 'string']],
            'scale-channels' => ['grain_scale_id' => [$required, 'exists:grain_scales,id'], 'code' => [$required, 'string', 'max:30'], 'description' => ['nullable', 'string'], 'maximum_weight' => [$required, 'numeric', 'gt:0'], 'minimum_weight' => ['sometimes', 'numeric', 'min:0'], 'division_weight' => [$required, 'numeric', 'gt:0'], 'unit' => ['sometimes', Rule::in(['kg'])], 'serial_configuration' => ['nullable', 'array'], 'status' => $status],
            'warehouses' => ['name' => [$required, 'string'], 'code' => [$required, 'string', Rule::unique('grain_warehouses')->ignore($id)], 'producer_id' => ['nullable', 'exists:producers,id'], 'address' => ['nullable', 'string'], 'status' => $status, 'notes' => ['nullable', 'string']],
            'storage-locations' => ['grain_warehouse_id' => [$required, 'exists:grain_warehouses,id'], 'name' => [$required, 'string'], 'code' => [$required, 'string'], 'storage_type' => ['sometimes', Rule::in(['CONVENTIONAL_SILO', 'SILO_BAG', 'WAREHOUSE', 'OTHER'])], 'capacity' => ['nullable', 'numeric', 'gt:0'], 'status' => $status, 'notes' => ['nullable', 'string']],
            'transport-drivers' => ['name' => [$required, 'string'], 'cpf' => ['nullable', 'string', 'max:14', Rule::unique('grain_transport_drivers')->ignore($id)], 'phone' => ['nullable', 'string'], 'status' => $status, 'notes' => ['nullable', 'string']],
            'transport-trucks' => ['license_plate' => [$required, 'string', 'max:10', Rule::unique('grain_transport_trucks')->ignore($id)], 'description' => ['nullable', 'string'], 'brand' => ['nullable', 'string'], 'model' => ['nullable', 'string'], 'color' => ['nullable', 'string'], 'maximum_gross_weight' => [$required, 'numeric', 'gt:0'], 'status' => $status, 'notes' => ['nullable', 'string']],
            'discount-types' => ['culture_id' => [$required, 'exists:cultures,id'], 'name' => [$required, 'string'], 'code' => [$required, 'string'], 'measurement_type' => ['sometimes', Rule::in(['PERCENTAGE'])], 'measurement_unit' => ['sometimes', Rule::in(['PERCENT'])], 'calculation_method' => ['sometimes', Rule::in(['MANUAL', 'FORMULA'])], 'affects_commercial_weight' => ['sometimes', 'boolean'], 'generates_impurity' => ['sometimes', 'boolean'], 'grain_impurity_type_id' => ['nullable', 'exists:grain_impurity_types,id'], 'display_order' => ['sometimes', 'integer', 'min:0'], 'status' => $status, 'description' => ['nullable', 'string']],
            'impurity-types' => ['name' => [$required, 'string'], 'code' => [$required, 'string', Rule::unique('grain_impurity_types')->ignore($id)], 'measurement_unit' => ['sometimes', Rule::in(['KG'])], 'requires_destination' => ['sometimes', 'boolean'], 'status' => $status, 'description' => ['nullable', 'string']],
            'technical-loss-configs' => ['producer_id' => [$required, 'exists:producers,id'], 'culture_id' => [$required, 'exists:cultures,id'], 'monthly_percentage' => [$required, 'numeric', 'gt:0', 'lte:100'], 'effective_from' => [$required, 'date'], 'effective_until' => ['nullable', 'date', 'after_or_equal:effective_from'], 'status' => $status],
            'farm-state-registrations' => ['producer_id' => [$required, 'exists:producers,id'], 'farm_id' => [$required, 'exists:farms,id'], 'state_registration' => [$required, 'string', 'max:50', Rule::unique('farm_state_registrations')->ignore($id)], 'description' => ['nullable', 'string'], 'status' => $status],
        };
    }

    private function normalize(string $catalog, array $data, Request $request): array
    {
        if ($catalog === 'transport-trucks' && isset($data['license_plate'])) {
            $data['license_plate'] = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $data['license_plate']));
        }
        if ($catalog === 'transport-drivers' && isset($data['cpf'])) {
            $data['cpf'] = preg_replace('/\D/', '', $data['cpf']);
        }
        return $data;
    }

    private function validateBusinessRules(string $catalog, array $data, ?int $id = null): void
    {
        if ($catalog === 'farm-state-registrations') {
            $valid = DB::table('farms')->where('id', $data['farm_id'])->where('producer_id', $data['producer_id'])->where('status', 'A')->exists();
            if (!$valid) throw ValidationException::withMessages(['farm_id' => ['A fazenda deve estar ativa e pertencer ao produtor.']]);
        }
        if ($catalog === 'scale-channels' && (float) $data['minimum_weight'] >= (float) $data['maximum_weight']) {
            throw ValidationException::withMessages(['minimum_weight' => ['O peso mínimo deve ser menor que a capacidade máxima.']]);
        }
        if ($catalog === 'discount-types' && ($data['generates_impurity'] ?? false) && empty($data['grain_impurity_type_id'])) {
            throw ValidationException::withMessages(['grain_impurity_type_id' => ['Informe o tipo de impureza gerado por este desconto.']]);
        }
        if ($catalog === 'technical-loss-configs') {
            $overlap = TechnicalLossConfig::query()->where('producer_id', $data['producer_id'])->where('culture_id', $data['culture_id'])
                ->when($id, fn ($q) => $q->where('id', '!=', $id))->where('status', 'A')
                ->whereDate('effective_from', '<=', $data['effective_until'] ?? '9999-12-31')
                ->where(fn ($q) => $q->whereNull('effective_until')->orWhereDate('effective_until', '>=', $data['effective_from']))->exists();
            if ($overlap) throw ValidationException::withMessages(['effective_from' => ['Já existe configuração vigente para este produtor, produto e safra no período.']]);
        }
    }
}
