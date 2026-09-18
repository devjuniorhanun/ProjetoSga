<?php

namespace App\Http\Controllers\Releases\Financial;

use App\Http\Controllers\Controller;
use App\Http\Requests\Releases\Financial\PayAccountRequest;
use App\Http\Requests\Releases\Financial\PayrollRequest;
use App\Http\Resources\Releases\Financial\PayAccountResource;
use App\Models\Releases\Financial\PayAccount;
use App\Services\Releases\Financial\PayAccountService;
use Illuminate\Http\Request;

class PayAccountController extends Controller
{
    public function __construct(private PayAccountService $service)
    {
    }

    public function index(Request $request)
    {
        $filters = $request->validate([
            'producer_id' => ['nullable', 'integer'],
            'administrative_center_id' => ['nullable', 'integer'],
            'cost_center_id' => ['nullable', 'integer'],
            'supplier_id' => ['nullable', 'integer'],
            'type_pay_account_id' => ['nullable', 'integer'],
            'document_number' => ['nullable', 'string'],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'accounted_for' => ['nullable', 'in:N,S'],
            'status' => ['nullable', 'in:CA,CO,RI,FA'],
            'entry_type' => ['nullable', 'in:ACCOUNT,PAYROLL,HARVESTER_ADVANCE,TRANSPORTER_ADVANCE'],
            'crop_id' => ['nullable', 'integer', 'exists:crops,id'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
        ]);

        return PayAccountResource::collection($this->service->list($filters));
    }

    public function store(PayAccountRequest $request)
    {
        return (new PayAccountResource($this->service->create($request->validated())))
            ->response()
            ->setStatusCode(201);
    }

    public function storePayroll(PayrollRequest $request)
    {
        return (new PayAccountResource($this->service->createPayroll($request->validated())))
            ->additional(['title' => 'Folha de Pagamento'])
            ->response()
            ->setStatusCode(201);
    }

    public function transfers(Request $request)
    {
        $data = $request->validate(['date' => ['nullable', 'date_format:Y-m-d']]);
        $date = $data['date'] ?? now()->toDateString();

        return PayAccountResource::collection($this->service->transfers($date))
            ->additional(['date' => $date]);
    }

    public function show(PayAccount $payAccount)
    {
        return new PayAccountResource($this->service->find($payAccount));
    }

    public function receipt(PayAccount $payAccount)
    {
        return response()->json(['data' => $this->service->receipt($payAccount)]);
    }

    public function update(PayAccountRequest $request, PayAccount $payAccount)
    {
        return new PayAccountResource($this->service->update($payAccount, $request->validated()));
    }

    public function destroy(PayAccount $payAccount)
    {
        $this->service->delete($payAccount);

        return response()->noContent();
    }
}
