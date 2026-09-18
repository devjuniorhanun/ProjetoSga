<?php

namespace App\Http\Controllers\Registrations\Supplier\Contracts;

use App\Http\Controllers\Controller;
use App\Services\Registrations\Supplier\Contracts\ServiceContractGenerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ServiceContractGenerationController extends Controller
{
    public function __construct(private ServiceContractGenerationService $service) {}

    public function supplierOptions(string $type): JsonResponse
    { return response()->json(['data' => $this->service->supplierOptions($this->type($type))]); }

    public function participants(string $type, int $supplier): JsonResponse
    { return response()->json($this->service->participants($this->type($type), $supplier)); }

    public function preview(Request $request, string $type): JsonResponse
    { $kind=$this->type($type); return response()->json($this->service->preview($kind, $this->validated($request,$kind))); }

    public function generate(Request $request, string $type): JsonResponse
    { $kind=$this->type($type); return response()->json($this->service->generate($kind, $this->validated($request,$kind)), 201); }

    public function index(Request $request): JsonResponse
    {
        $filters=$request->validate(['contract_number'=>['nullable','string','max:40'],
            'contract_type'=>['nullable',Rule::in(['TRANSPORT','HARVEST'])], 'crop_id'=>['nullable','integer','exists:crops,id'],
            'producer_id'=>['nullable','integer','exists:producers,id'], 'supplier_id'=>['nullable','integer','exists:suppliers,id'],
            'status'=>['nullable',Rule::in(['A','I'])]]);
        return response()->json(['data'=>$this->service->history($filters)]);
    }

    public function pdfData(string $type, int $contract): JsonResponse
    { return response()->json(['data'=>$this->service->pdfData($this->type($type),$contract)]); }

    public function uploadPdf(Request $request,string $type,int $contract):JsonResponse
    { $data=$request->validate(['pdf'=>['required','file','mimes:pdf','max:10240']]);
      return response()->json(['data'=>$this->service->savePdf($this->type($type),$contract,$data['pdf'])]); }

    public function downloadPdf(string $type, int $contract)
    {
        $kind = $this->type($type);
        $path = $this->service->pdfPath($kind, $contract);

        return Storage::disk('local')->download($path);
    }

    private function validated(Request $request,string $type):array
    {
        $common=['crop_id'=>['required','integer','exists:crops,id'],'supplier_id'=>['required','integer','exists:suppliers,id'],
            'bank_supplier_id'=>['nullable','integer','exists:bank_suppliers,id'],
            'opening_date'=>['required','date_format:Y-m-d'],'closing_date'=>['required','date_format:Y-m-d','after_or_equal:opening_date'],
            'observations'=>['nullable','string']];
        $specific=$type==='TRANSPORT'
            ? ['shipping_cost'=>['required','numeric','gt:0','decimal:0,2'],'service_hours'=>['nullable','string'],
               'extra_service_description'=>['nullable','string']]
            : ['remuneration_percentage'=>['required','numeric','gt:0','lte:100','decimal:0,4'],
               'fuel_supplied_by'=>['nullable',Rule::in(['CONTRACTING_PARTY','CONTRACTOR'])],
               'meal_allowance_description'=>['nullable','string']];
        return $request->validate(array_merge($common,$specific));
    }

    private function type(string $type):string
    { $value=strtoupper($type); if(!in_array($value,['TRANSPORT','HARVEST'],true)) abort(404); return $value; }
}
