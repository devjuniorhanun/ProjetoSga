<?php

namespace App\Http\Controllers\Releases\Fiscal;

use App\Http\Controllers\Controller;
use App\Models\Releases\Financial\PayAccount;
use App\Services\Shared\DocumentSequenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class FreightController extends Controller
{
    public function __construct(private readonly DocumentSequenceService $numbers) {}

    public function index(Request $request)
    {
        return DB::table('invoice_freights')->join('entry_invoices', 'entry_invoices.id', '=', 'invoice_freights.entry_invoice_id')
            ->when($request->carrier_id, fn ($q, $v) => $q->where('invoice_freights.carrier_id', $v))
            ->when($request->product_id, fn ($q, $v) => $q->where('invoice_freights.product_id', $v))
            ->when($request->status, fn ($q, $v) => $q->where('invoice_freights.status', $v))
            ->select('invoice_freights.*', 'entry_invoices.invoice_number', 'entry_invoices.series')->paginate(50);
    }

    public function payments(Request $request) { return DB::table('freight_payments')->latest()->paginate(25); }

    public function pay(Request $request)
    {
        $data = $request->validate([
            'carrier_id' => 'required|exists:suppliers,id', 'producer_id' => 'required|exists:producers,id',
            'administrative_center_id' => 'required|exists:administrative_centers,id', 'cost_center_id' => 'required|exists:cost_centers,id',
            'payment_method' => ['required', Rule::in(['BO', 'TR'])], 'document_number' => 'required|string|max:255',
            'document_date' => 'required|date', 'due_date' => 'required|date', 'items' => 'required|array|min:1',
            'items.*.invoice_freight_id' => 'required|distinct|exists:invoice_freights,id',
            'items.*.value' => 'required|numeric|gt:0',
        ]);

        return DB::transaction(function () use ($data, $request) {
            $type = DB::table('type_pay_accounts')->where('abbreviation', $data['payment_method'])->where('status', 'A')->first();
            if (! $type) throw ValidationException::withMessages(['payment_method' => ['Tipo de pagamento ativo não encontrado.']]);

            $rows = []; $cropIds = []; $total = 0;
            foreach ($data['items'] as $item) {
                $freight = DB::table('invoice_freights')->where('id', $item['invoice_freight_id'])->lockForUpdate()->first();
                if ($freight->carrier_id != $data['carrier_id'] || in_array($freight->status, ['PAID', 'ALREADY_PAID', 'CANCELED'])) {
                    throw ValidationException::withMessages(['items' => ['Frete incompatível ou indisponível.']]);
                }
                $open = round($freight->total_freight_value - $freight->paid_value, 2);
                if ($item['value'] > $open + .001) throw ValidationException::withMessages(['items' => ['Pagamento superior ao saldo de um frete.']]);
                $rows[] = [$freight, $item, $open]; $cropIds[] = (int) $freight->crop_id; $total += (float) $item['value'];
            }
            $cropIds = array_values(array_unique($cropIds));
            if (count($cropIds) !== 1) {
                throw ValidationException::withMessages(['items' => ['Agrupe no mesmo pagamento somente fretes pertencentes à mesma safra.']]);
            }

            $paymentId = DB::table('freight_payments')->insertGetId([
                ...collect($data)->except('items')->all(), 'payment_number' => $this->numbers->next('PGF'),
                'total_value' => round($total, 2), 'status' => 'CONFIRMED', 'created_by' => $request->user()->id,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            $payAccount = PayAccount::create([
                'crop_id' => $cropIds[0], 'supplier_id' => $data['carrier_id'], 'producer_id' => $data['producer_id'],
                'administrative_center_id' => $data['administrative_center_id'], 'cost_center_id' => $data['cost_center_id'],
                'type_pay_account_id' => $type->id, 'document_number' => $data['document_number'],
                'document_date' => $data['document_date'], 'due_date' => $data['due_date'],
                'description' => 'Pagamento de fretes '.$this->numbers->next('REF'), 'value' => round($total, 2),
                'accounted_for' => 'N', 'status' => 'RI', 'entry_type' => PayAccount::ENTRY_ACCOUNT,
                'source_type' => 'FreightPayment', 'source_id' => $paymentId,
            ]);
            DB::table('freight_payments')->where('id', $paymentId)->update(['pay_account_id' => $payAccount->id]);

            foreach ($rows as [$freight, $item, $open]) {
                $after = round($open - $item['value'], 2);
                DB::table('freight_payment_items')->insert([
                    'freight_payment_id' => $paymentId, 'invoice_freight_id' => $freight->id, 'value' => $item['value'],
                    'balance_before' => $open, 'balance_after' => $after, 'created_at' => now(), 'updated_at' => now(),
                ]);
                DB::table('invoice_freights')->where('id', $freight->id)->update([
                    'paid_value' => DB::raw('paid_value + '.(float) $item['value']),
                    'status' => $after <= .001 ? 'PAID' : 'PARTIALLY_PAID', 'updated_at' => now(),
                ]);
            }
            return response()->json(DB::table('freight_payments')->find($paymentId), 201);
        });
    }
}
