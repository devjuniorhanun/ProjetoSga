<?php

namespace App\Http\Controllers\Releases\Agricultural\Services\Defensive;

use App\Http\Controllers\Controller;
use App\Http\Requests\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrderClosingRequest;
use App\Http\Requests\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrderRequest;
use App\Http\Requests\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrderProductSequenceRequest;
use App\Http\Requests\Releases\Agricultural\Services\Defensive\OperatorTankMovementRequest;
use App\Http\Requests\Releases\Agricultural\Services\Defensive\OperatorTankWithdrawalRequest;
use App\Http\Resources\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrderResource;
use App\Http\Resources\Releases\Agricultural\Services\Defensive\OperatorTankResource;
use App\Http\Resources\Releases\Agricultural\Services\Defensive\OperatorTankWithdrawalResource;
use App\Http\Resources\Registrations\Vehicle\FleetResource;
use App\Http\Resources\Registrations\Agricultural\Defensive\AgriculturalProductResource;
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrder;
use App\Models\Releases\Agricultural\Services\Defensive\OperatorTankWithdrawal;
use App\Services\Releases\Agricultural\Services\Defensive\DefensiveService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DefensiveServiceController extends Controller
{
    public function __construct(private DefensiveService $service) {}

    public function index()
    {
        return AgriculturalDefensiveOrderResource::collection($this->service->list());
    }

    public function store(AgriculturalDefensiveOrderRequest $request)
    {
        $orders = $this->service->create($request->validated(), $request->user()?->id);
        return response()->json(['data' => AgriculturalDefensiveOrderResource::collection(collect($orders))], 201);
    }

    public function show(AgriculturalDefensiveOrder $order)
    {
        return new AgriculturalDefensiveOrderResource($this->service->find($order));
    }

    public function reorderProducts(
        AgriculturalDefensiveOrderProductSequenceRequest $request,
        AgriculturalDefensiveOrder $order
    ) {
        return new AgriculturalDefensiveOrderResource(
            $this->service->reorderProducts($order, $request->validated('product_ids'))
        );
    }

    public function reissue(AgriculturalDefensiveOrder $order, AgriculturalDefensiveOrderRequest $request)
    {
        $children = $this->service->reissue($order, array_merge($request->validated(), ['previous_os' => $request->input('previous_os', [])]));
        return response()->json(['data' => AgriculturalDefensiveOrderResource::collection(collect($children))], 201);
    }

    public function close(AgriculturalDefensiveOrderClosingRequest $request)
    {
        $order = $this->service->close($request->validated(), $request->user()?->id);
        return new AgriculturalDefensiveOrderResource($order);
    }

    public function activeCrops()
    {
        return response()->json(['data' => $this->service->activeCrops()]);
    }

    public function fleetsByFunction(Request $request)
    {
        $data = $request->validate([
            'function' => ['required', 'string', Rule::in(['O', 'T'])],
        ], [
            'function.required' => 'A função é obrigatória.',
            'function.in' => 'A função deve ser O (Operador) ou T (Tanqueiro).',
        ]);

        return FleetResource::collection(
            $this->service->fleetsByFunction($data['function'])
        );
    }

    public function eligibleProducts()
    {
        return AgriculturalProductResource::collection(
            $this->service->eligibleProducts()
        );
    }

    public function tankOperators(int $crop)
    {
        return response()->json(['data' => $this->service->tankOperators($crop)]);
    }

    public function tankDates(int $crop)
    {
        return response()->json(['data' => $this->service->tankDates($crop)]);
    }

    public function openTankDates(int $crop, int $operator)
    {
        return response()->json(['data' => $this->service->openTankDates($crop, $operator)]);
    }

    public function tankPlanning(Request $request, int $crop, int $operator)
    {
        $data = $request->validate(['date' => ['required', 'date']]);
        return response()->json([
            'data' => $this->service->tankProductPlanning($crop, $operator, $data['date']),
        ]);
    }

    public function tankWithdrawal(OperatorTankWithdrawalRequest $request)
    {
        return new OperatorTankWithdrawalResource(
            $this->service->withdrawForOperator($request->validated(), $request->user()?->id)
        );
    }

    public function withdrawals(Request $request)
    {
        $filters = $request->validate([
            'crop_id' => ['nullable', 'integer', 'exists:crops,id'],
            'operator_id' => ['nullable', 'integer', 'exists:agricultural_operators,id'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        return OperatorTankWithdrawalResource::collection($this->service->withdrawals($filters));
    }

    public function withdrawal(OperatorTankWithdrawal $withdrawal)
    {
        return new OperatorTankWithdrawalResource($this->service->withdrawal($withdrawal));
    }

    public function tank(Request $request, int $operator)
    {
        $date = $request->validate(['date' => ['nullable', 'date']])['date'] ?? now()->toDateString();
        return new OperatorTankResource($this->service->getOrCreateTank($operator, $date));
    }

    public function tankMovement(OperatorTankMovementRequest $request)
    {
        return new OperatorTankResource($this->service->moveTank($request->validated(), $request->user()?->id)->load('products.product'));
    }
}
