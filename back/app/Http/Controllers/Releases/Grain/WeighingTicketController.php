<?php

namespace App\Http\Controllers\Releases\Grain;

use App\Http\Controllers\Controller;
use App\Models\Releases\Grain\WeighingTicket;
use App\Services\Releases\Grain\AuthorizationService;
use App\Services\Releases\Grain\GrainBalanceService;
use App\Services\Releases\Grain\WeighingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class WeighingTicketController extends Controller
{
    public function __construct(private readonly WeighingService $service, private readonly AuthorizationService $authorizations, private readonly GrainBalanceService $balances) {}

    public function index(Request $request) {
        return WeighingTicket::query()->with(['discounts', 'allocations'])
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->when($request->operation_type, fn ($q, $v) => $q->where('operation_type', $v))
            ->when($request->grain_transport_truck_id, fn ($q, $v) => $q->where('grain_transport_truck_id', $v))
            ->latest()->paginate(min((int) $request->input('per_page', 25), 100));
    }
    public function show(WeighingTicket $ticket) { return $ticket->load(['discounts', 'allocations']); }
    public function printData(WeighingTicket $ticket) { abort_unless(in_array($ticket->status, ['CLOSED', 'CANCELED'], true), 422, 'Somente tickets fechados ou cancelados podem ser impressos.'); return $ticket->load(['discounts.discountType', 'allocations']); }
    public function store(Request $request) {
        $data = $request->validate([
            'operation_type' => ['required', Rule::in(['ENTRY', 'EXIT', 'IMPURITY_OUTPUT'])], 'ownership_type' => ['required', Rule::in(['OW', 'TP'])],
            'producer_id' => ['required', 'exists:producers,id'], 'farm_id' => ['required', 'exists:farms,id'],
            'farm_state_registration_id' => ['required', 'exists:farm_state_registrations,id'], 'crop_id' => ['required', 'exists:crops,id'],
            'culture_id' => ['required', 'exists:cultures,id'], 'buyer_id' => ['required_if:operation_type,EXIT', 'nullable', 'exists:suppliers,id'],
            'grain_warehouse_id' => ['required', 'exists:grain_warehouses,id'], 'grain_storage_location_id' => ['required', 'exists:grain_storage_locations,id'],
            'grain_transport_driver_id' => ['nullable', 'exists:grain_transport_drivers,id'], 'grain_transport_truck_id' => ['required', 'exists:grain_transport_trucks,id'], 'notes' => ['nullable', 'string'],
        ]);
        return response()->json($this->service->create($data, $request->user()->id), 201);
    }
    public function captureWeight(Request $request, WeighingTicket $ticket) {
        $data = $request->validate(['stage' => ['required', Rule::in(['FIRST', 'SECOND'])], 'source' => ['required', Rule::in(['AUTOMATIC', 'MANUAL'])], 'reading_id' => ['required_if:source,AUTOMATIC', 'nullable', 'exists:grain_scale_readings,id'], 'weight' => ['required_if:source,MANUAL', 'nullable', 'numeric', 'gt:0'], 'grain_scale_id' => ['required_if:source,MANUAL', 'nullable', 'exists:grain_scales,id'], 'grain_scale_channel_id' => ['required_if:source,MANUAL', 'nullable', 'exists:grain_scale_channels,id'], 'authorization_request_id' => ['required_if:source,MANUAL', 'nullable', 'exists:grain_authorization_requests,id']]);
        return $this->service->capture($ticket, $data, $request->user()->id);
    }
    public function discounts(Request $request, WeighingTicket $ticket) {
        $data = $request->validate(['discounts' => ['required', 'array'], 'discounts.*.grain_discount_type_id' => ['required', 'distinct', 'exists:grain_discount_types,id'], 'discounts.*.percentage' => ['required', 'numeric', 'between:0,100'], 'discounts.*.discount_weight' => ['nullable', 'numeric', 'min:0'], 'discounts.*.justification' => ['nullable', 'string'], 'authorization_request_id' => ['nullable', 'exists:grain_authorization_requests,id']]);
        return $this->service->saveDiscounts($ticket, $data['discounts'], $request->user()->id, $data['authorization_request_id'] ?? null);
    }
    public function availableContracts(WeighingTicket $ticket): array { return $this->service->previewAllocation($ticket); }
    public function close(Request $request, WeighingTicket $ticket) {
        $data = $request->validate(['authorization_request_id' => ['nullable', 'exists:grain_authorization_requests,id'], 'operator_name' => ['required_if:operation_type,IMPURITY_OUTPUT', 'nullable', 'string'], 'vehicle_description' => ['nullable', 'string'], 'destination' => ['nullable', 'string'], 'impurity_items' => ['nullable', 'array'], 'impurity_items.*.grain_impurity_type_id' => ['required', 'exists:grain_impurity_types,id'], 'impurity_items.*.source_entry_ticket_id' => ['required', 'exists:grain_weighing_tickets,id'], 'impurity_items.*.quantity' => ['required', 'numeric', 'gt:0']]);
        if ($ticket->operation_type === 'IMPURITY_OUTPUT' && blank($data['operator_name'] ?? null)) {
            return response()->json(['message' => 'O operador é obrigatório para saída de impureza.', 'errors' => ['operator_name' => ['O operador é obrigatório.']]], 422);
        }
        return $this->service->close($ticket, $data, $request->user()->id);
    }
    public function cancel(Request $request, WeighingTicket $ticket) {
        $data = $request->validate(['authorization_request_id' => ['required', 'exists:grain_authorization_requests,id'], 'reason' => ['required', 'string']]);
        return DB::transaction(function () use ($request, $ticket, $data) {
            $ticket = WeighingTicket::query()->lockForUpdate()->findOrFail($ticket->id);
            $authorization = $this->authorizations->assertApproved($data['authorization_request_id'], 'CANCEL_TICKET', $ticket->id);
            abort_if($ticket->status === 'CANCELED', 422, 'Ticket já cancelado.');
            if ($ticket->status === 'CLOSED') {
                $balance = $this->balances->lockedForTicket($ticket);
                $physical = $ticket->operation_type === 'ENTRY' ? -(float) $ticket->net_weight : (float) $ticket->commercial_net_weight;
                $commercial = $ticket->operation_type === 'ENTRY' ? -(float) $ticket->commercial_net_weight : ($ticket->operation_type === 'EXIT' ? (float) $ticket->commercial_net_weight : 0);
                if ($ticket->operation_type === 'EXIT') {
                    foreach ($ticket->allocations()->get() as $allocation) {
                        DB::table('grain_sale_contracts')->where('id', $allocation->grain_sale_contract_id)->decrement('shipped_weight', $allocation->allocated_weight);
                        $contract = DB::table('grain_sale_contracts')->where('id', $allocation->grain_sale_contract_id)->first();
                        DB::table('grain_sale_contracts')->where('id', $allocation->grain_sale_contract_id)->update(['status' => $contract->shipped_weight > 0 ? 'PARTIAL' : 'OPEN']);
                    }
                    $balance->increment('contract_balance', (float) $ticket->commercial_net_weight);
                }
                if ($ticket->operation_type === 'ENTRY') {
                    $used = DB::table('grain_impurity_output_items')->join('grain_impurity_outputs', 'grain_impurity_outputs.id', '=', 'grain_impurity_output_items.grain_impurity_output_id')->where('grain_impurity_outputs.status', 'CLOSED')->where('grain_impurity_output_items.source_entry_ticket_id', $ticket->id)->exists();
                    if ($used) abort(422, 'Cancele primeiro as saídas de impureza vinculadas a este recebimento.');
                    $pending = (float) DB::table('grain_entry_discounts')->join('grain_discount_types', 'grain_discount_types.id', '=', 'grain_entry_discounts.grain_discount_type_id')->where('grain_entry_discounts.grain_weighing_ticket_id', $ticket->id)->where('grain_discount_types.generates_impurity', true)->sum('grain_entry_discounts.discount_weight');
                    $balance->decrement('pending_impurity_weight', $pending);
                }
                if ($ticket->operation_type === 'IMPURITY_OUTPUT') {
                    $balance->increment('pending_impurity_weight', (float) $ticket->net_weight);
                    DB::table('grain_impurity_outputs')->where('grain_weighing_ticket_id', $ticket->id)->update(['status' => 'CANCELED']);
                }
                $this->balances->move($balance->refresh(), ['grain_weighing_ticket_id' => $ticket->id, 'movement_type' => 'REVERSAL', 'physical_quantity' => $physical, 'commercial_quantity' => $commercial, 'reason' => $data['reason'], 'created_by' => $request->user()->id]);
            }
            $ticket->update(['status' => 'CANCELED', 'canceled_by' => $request->user()->id, 'canceled_at' => now(), 'cancellation_reason' => $data['reason']]);
            $this->authorizations->consume($authorization);
            return $ticket->refresh();
        });
    }
}
