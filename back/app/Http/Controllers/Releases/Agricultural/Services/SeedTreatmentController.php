<?php

namespace App\Http\Controllers\Releases\Agricultural\Services;

use App\Http\Controllers\Controller;
use App\Services\Releases\Inventory\ProductStockService;
use App\Services\Shared\DocumentSequenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SeedTreatmentController extends Controller
{
    public function __construct(private readonly ProductStockService $stocks, private readonly DocumentSequenceService $numbers) {}

    public function index(Request $request)
    {
        return DB::table('seed_treatments')->whereNull('deleted_at')
            ->when($request->status, fn ($query, $status) => $query->where('status', $status))
            ->when($request->crop_id, fn ($query, $cropId) => $query->where('crop_id', $cropId))
            ->latest('service_date')->paginate(25);
    }

    public function show(int $treatment): array { return $this->detail($treatment); }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());

        return DB::transaction(function () use ($data, $request) {
            $seeds = collect($data['seeds'])->map(function (array $seed) use ($data): array {
                $stock = DB::table('product_stocks')->where('id', $seed['product_stock_id'])->lockForUpdate()->firstOrFail();
                $available = round((float) $stock->quantity - (float) $stock->reserved_quantity, 3);
                $compatible = (int) $stock->product_id === (int) $seed['product_id']
                    && (int) $stock->culture_id === (int) $data['culture_id']
                    && (int) $stock->variety_culture_id === (int) $seed['variety_culture_id']
                    && $stock->batch === $seed['lot_number']
                    && $stock->treatment_status === 'UNTREATED';
                if (!$compatible) throw ValidationException::withMessages(['seeds' => ['Produto, cultura, variedade e lote devem corresponder à posição de semente não tratada.']]);
                if ($available < (float) $seed['treated_quantity']) throw ValidationException::withMessages(['seeds' => ["Saldo insuficiente no lote {$stock->batch}. Disponível: {$available}."]]);
                return [...$seed, 'available_quantity_snapshot' => $available];
            });

            $id = DB::table('seed_treatments')->insertGetId([
                'treatment_number' => $this->numbers->next('TRS'), 'service_date' => $data['service_date'],
                'crop_id' => $data['crop_id'], 'culture_id' => $data['culture_id'],
                'number_of_treatment_batches' => $data['number_of_treatment_batches'],
                'total_seed_quantity' => $seeds->sum('treated_quantity'), 'status' => 'DRAFT',
                'observation' => $data['observation'] ?? null, 'created_by' => $request->user()->id,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            foreach ($seeds as $seed) DB::table('seed_treatment_seeds')->insert([...$seed, 'seed_treatment_id' => $id, 'created_at' => now(), 'updated_at' => now()]);
            foreach ($data['products'] as $product) DB::table('seed_treatment_products')->insert([...$product, 'seed_treatment_id' => $id, 'recommended_quantity' => ($product['dose_per_batch'] ?? 0) * $data['number_of_treatment_batches'], 'created_at' => now(), 'updated_at' => now()]);
            return response()->json($this->detail($id), 201);
        });
    }

    public function complete(Request $request, int $treatment): array
    {
        return DB::transaction(function () use ($request, $treatment): array {
            $row = DB::table('seed_treatments')->where('id', $treatment)->lockForUpdate()->firstOrFail();
            if ($row->status !== 'DRAFT') throw ValidationException::withMessages(['status' => ['Tratamento já processado.']]);
            foreach (DB::table('seed_treatment_seeds')->where('seed_treatment_id', $treatment)->get() as $seed) {
                $source = DB::table('product_stocks')->where('id', $seed->product_stock_id)->lockForUpdate()->firstOrFail();
                $available = round((float) $source->quantity - (float) $source->reserved_quantity, 3);
                if ((int) $source->product_id !== (int) $seed->product_id || $source->treatment_status !== 'UNTREATED') throw ValidationException::withMessages(['seeds' => ['O estoque da semente não corresponde ao produto ou já foi tratado.']]);
                if ($available < (float) $seed->treated_quantity) throw ValidationException::withMessages(['seeds' => ["Saldo insuficiente no lote {$source->batch}. Disponível: {$available}."]]);
                $common = ['product_id' => $seed->product_id, 'stock_location_id' => $source->stock_location_id, 'culture_id' => $source->culture_id, 'variety_culture_id' => $source->variety_culture_id, 'batch' => $source->batch, 'sieve' => $source->sieve, 'manufacturing_date' => $source->manufacturing_date, 'expiration_date' => $source->expiration_date, 'quantity' => $seed->treated_quantity, 'unit_value' => $source->average_cost, 'source_type' => 'SeedTreatment', 'source_id' => $treatment, 'created_by' => $request->user()->id];
                $this->stocks->output([...$common, 'product_stock_id' => $source->id, 'treatment_status' => 'UNTREATED', 'movement_type' => 'SEED_TREATMENT_INPUT']);
                $this->stocks->entry([...$common, 'treatment_status' => 'TREATED', 'movement_type' => 'SEED_TREATMENT_OUTPUT']);
            }
            foreach (DB::table('seed_treatment_products')->where('seed_treatment_id', $treatment)->get() as $product) {
                $stock = DB::table('product_stocks')->where('id', $product->product_stock_id)->firstOrFail();
                if ((int) $stock->product_id !== (int) $product->product_id) throw ValidationException::withMessages(['products' => ['O estoque selecionado não pertence ao produto de tratamento informado.']]);
                $movement = $this->stocks->output(['product_stock_id' => $stock->id, 'product_id' => $product->product_id, 'stock_location_id' => $stock->stock_location_id, 'batch' => $stock->batch, 'treatment_status' => $stock->treatment_status, 'quantity' => $product->real_quantity, 'unit_value' => $stock->average_cost, 'movement_type' => 'SEED_TREATMENT_PRODUCT_OUTPUT', 'source_type' => 'SeedTreatment', 'source_id' => $treatment, 'created_by' => $request->user()->id]);
                DB::table('seed_treatment_products')->where('id', $product->id)->update(['stock_movement_id' => $movement]);
            }
            DB::table('seed_treatments')->where('id', $treatment)->update(['status' => 'COMPLETED', 'completed_by' => $request->user()->id, 'completed_at' => now(), 'updated_at' => now()]);
            return $this->detail($treatment);
        });
    }

    private function detail(int $id): array
    {
        return ['treatment' => DB::table('seed_treatments')->find($id), 'seeds' => DB::table('seed_treatment_seeds')->where('seed_treatment_id', $id)->get(), 'products' => DB::table('seed_treatment_products')->where('seed_treatment_id', $id)->get()];
    }

    private function rules(): array
    {
        return ['service_date' => 'required|date', 'crop_id' => 'required|exists:crops,id', 'culture_id' => 'required|exists:cultures,id', 'number_of_treatment_batches' => 'required|integer|min:1', 'observation' => 'nullable|string', 'seeds' => 'required|array|min:1', 'seeds.*.product_id' => 'required|exists:products,id', 'seeds.*.culture_id' => 'required|exists:cultures,id', 'seeds.*.variety_culture_id' => 'required|exists:variety_cultures,id', 'seeds.*.product_stock_id' => 'required|distinct|exists:product_stocks,id', 'seeds.*.lot_number' => 'required|string|max:100', 'seeds.*.treated_quantity' => 'required|numeric|gt:0', 'seeds.*.unit' => 'required|string|max:20', 'seeds.*.treatment_batch_quantity' => 'required|numeric|gt:0', 'seeds.*.treatment_batch_number' => 'nullable|string|max:100', 'products' => 'required|array|min:1', 'products.*.product_id' => 'required|exists:products,id', 'products.*.product_stock_id' => 'required|exists:product_stocks,id', 'products.*.dose_per_batch' => 'nullable|numeric|min:0', 'products.*.real_quantity' => 'required|numeric|gt:0', 'products.*.unit' => 'required|string|max:20'];
    }
}
