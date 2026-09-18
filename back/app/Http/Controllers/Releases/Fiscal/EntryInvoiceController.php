<?php

namespace App\Http\Controllers\Releases\Fiscal;

use App\Http\Controllers\Controller;
use App\Models\Releases\Fiscal\EntryInvoice;
use App\Services\Releases\Fiscal\EntryInvoiceService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EntryInvoiceController extends Controller
{
    public function __construct(private readonly EntryInvoiceService $service) {}
    public function index(Request $request) { return EntryInvoice::query()->with(['items','installments','freights'])->when($request->entry_type,fn($q,$v)=>$q->where('entry_type',$v))->when($request->status,fn($q,$v)=>$q->where('status',$v))->when($request->supplier_id,fn($q,$v)=>$q->where('supplier_id',$v))->when($request->producer_id,fn($q,$v)=>$q->where('producer_id',$v))->when($request->invoice_number,fn($q,$v)=>$q->where('invoice_number','like',"%{$v}%"))->latest('entry_date')->paginate(min($request->integer('per_page',25),100)); }
    public function show(EntryInvoice $entryInvoice) { return $entryInvoice->load(['items.allocations','items.seedLots','installments','freights']); }
    public function store(Request $request) { return response()->json($this->service->save($request->validate($this->rules()),$request->user()->id),201); }
    public function update(Request $request, EntryInvoice $entryInvoice) { return $this->service->save($request->validate($this->rules($entryInvoice->id)),$request->user()->id,$entryInvoice); }
    public function destroy(EntryInvoice $entryInvoice) { abort_unless($entryInvoice->status==='DRAFT',422,'Somente rascunho pode ser excluído.'); $entryInvoice->delete(); return response()->noContent(); }
    public function confirm(Request $request, EntryInvoice $entryInvoice) { return $this->service->confirm($entryInvoice,$request->user()->id); }

    private function rules(?int $ignoreId = null): array
    {
        return [
            'entry_type'=>['required',Rule::in(['FUEL','LUBRICANT','DEFENSIVE','INPUT','GENERAL','SEED'])], 'entry_method'=>['sometimes',Rule::in(['MANUAL','XML_IMPORT','EXTERNAL_API'])],
            'supplier_id'=>'required|integer|exists:suppliers,id','producer_id'=>'required|integer|exists:producers,id','administrative_center_id'=>'required|integer|exists:administrative_centers,id','cost_center_id'=>'required|integer|exists:cost_centers,id','farm_id'=>'nullable|integer|exists:farms,id',
            'crop_id'=>'required|integer|exists:crops,id',
            'access_key'=>['nullable','digits:44',Rule::unique('entry_invoices','access_key')->ignore($ignoreId)],'document_model'=>'sometimes|string|max:10','invoice_number'=>'required|string|max:100','series'=>'nullable|string|max:20','issue_date'=>'required|date','entry_date'=>'required|date','operation_nature'=>'nullable|string|max:255',
            'products_value'=>'required|numeric|min:0','freight_value'=>'sometimes|numeric|min:0','insurance_value'=>'sometimes|numeric|min:0','discount_value'=>'sometimes|numeric|min:0','other_expenses_value'=>'sometimes|numeric|min:0','invoice_total'=>'required|numeric|gt:0','freight_responsibility'=>['required',Rule::in(['NO_FREIGHT','ALREADY_PAID','FARM_PAYABLE'])],'observation'=>'nullable|string',
            'items'=>'required|array|min:1','items.*.product_id'=>'required|integer|exists:products,id','items.*.supplier_product_id'=>'nullable|integer|exists:supplier_products,id','items.*.supplier_product_code'=>'nullable|string|max:100','items.*.description'=>'required|string','items.*.ncm'=>'nullable|string|max:20','items.*.cfop'=>'nullable|string|max:10','items.*.unit'=>'required|string|max:20','items.*.quantity'=>'required|numeric|gt:0','items.*.unit_value'=>'required|numeric|min:0','items.*.discount_value'=>'sometimes|numeric|min:0','items.*.freight_value'=>'sometimes|numeric|min:0','items.*.other_expenses_value'=>'sometimes|numeric|min:0',
            'items.*.allocations'=>'sometimes|array','items.*.allocations.*.stock_location_id'=>'required|integer|exists:stock_locations,id','items.*.allocations.*.plot_field_id'=>'nullable|integer|exists:plot_fields,id','items.*.allocations.*.fuel_station_id'=>'nullable|integer|exists:fuel_stations,id','items.*.allocations.*.batch'=>'nullable|string|max:100','items.*.allocations.*.manufacturing_date'=>'nullable|date','items.*.allocations.*.expiration_date'=>'nullable|date','items.*.allocations.*.quantity'=>'required|numeric|gt:0',
            'items.*.seed_lots'=>'sometimes|array','items.*.seed_lots.*.culture_id'=>'required|integer|exists:cultures,id','items.*.seed_lots.*.variety_culture_id'=>'required|integer|exists:variety_cultures,id','items.*.seed_lots.*.stock_location_id'=>'required|integer|exists:stock_locations,id','items.*.seed_lots.*.lot_number'=>'required|string|max:100','items.*.seed_lots.*.quantity'=>'required|numeric|gt:0','items.*.seed_lots.*.unit'=>'required|string|max:20','items.*.seed_lots.*.expiration_date'=>'nullable|date',
            'installments'=>'required|array|min:1','installments.*.document_number'=>'required|string|max:255','installments.*.due_date'=>'required|date','installments.*.value'=>'required|numeric|gt:0',
            'freights'=>'sometimes|array','freights.*.product_id'=>'required|integer|exists:products,id','freights.*.crop_id'=>'required|integer|exists:crops,id','freights.*.carrier_id'=>'required|integer|exists:suppliers,id','freights.*.freight_rate_id'=>'nullable|integer|exists:freight_rates,id','freights.*.driver_name'=>'nullable|string','freights.*.driver_cpf'=>'nullable|string|max:14','freights.*.driver_phone'=>'nullable|string|max:30','freights.*.vehicle_plate'=>'nullable|string|max:10','freights.*.invoice_weight'=>'required|numeric|gt:0','freights.*.value_per_ton'=>'required|numeric|gt:0','freights.*.rate_snapshot'=>'nullable|array',
        ];
    }
}
