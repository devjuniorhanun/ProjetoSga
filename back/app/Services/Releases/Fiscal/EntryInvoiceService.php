<?php

namespace App\Services\Releases\Fiscal;

use App\Models\Releases\Financial\PayAccount;
use App\Models\Releases\Fiscal\EntryInvoice;
use App\Models\Releases\Fiscal\EntryInvoiceInstallment;
use App\Services\Releases\Inventory\ProductStockService;
use App\Services\Releases\Fuel\FuelStockService;
use App\Services\Shared\DocumentSequenceService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EntryInvoiceService
{
    public function __construct(private readonly ProductStockService $stocks, private readonly DocumentSequenceService $numbers, private readonly FuelStockService $fuelStocks) {}

    public function save(array $data, int $userId, ?EntryInvoice $invoice = null): EntryInvoice
    {
        $freightCropIds = collect($data['freights'] ?? [])->pluck('crop_id')->filter()->map(fn ($id): int => (int) $id)->unique()->values();
        if (isset($data['crop_id']) && $freightCropIds->contains(fn (int $id): bool => $id !== (int) $data['crop_id'])) {
            throw ValidationException::withMessages(['freights' => ['Todos os fretes devem pertencer à safra informada na nota.']]);
        }
        if (! isset($data['crop_id']) && $freightCropIds->count() === 1) {
            $data['crop_id'] = $freightCropIds->first();
        }

        return DB::transaction(function () use ($data, $userId, $invoice): EntryInvoice {
            if ($invoice) {
                $invoice = EntryInvoice::query()->lockForUpdate()->findOrFail($invoice->id);
                if ($invoice->status !== 'DRAFT') throw ValidationException::withMessages(['status'=>['Somente nota em rascunho pode ser alterada.']]);
                $invoice->items()->each(function ($item): void { $item->allocations()->delete(); $item->seedLots()->delete(); });
                $invoice->items()->delete(); $invoice->installments()->delete(); $invoice->freights()->delete();
                $invoice->update($this->header($data));
            } else {
                $invoice = EntryInvoice::create([...$this->header($data), 'created_by'=>$userId, 'status'=>'DRAFT']);
            }
            $this->saveChildren($invoice, $data, $userId);
            return $invoice->refresh()->load(['items.allocations','items.seedLots','installments','freights']);
        });
    }

    public function confirm(EntryInvoice $invoice, int $userId): EntryInvoice
    {
        return DB::transaction(function () use ($invoice, $userId): EntryInvoice {
            $invoice = EntryInvoice::query()->lockForUpdate()->findOrFail($invoice->id);
            if ($invoice->status !== 'DRAFT') throw ValidationException::withMessages(['status'=>['Somente nota em rascunho pode ser confirmada.']]);
            $invoice->load(['items.allocations','items.seedLots','installments','freights']);
            if ($invoice->items->isEmpty()) throw ValidationException::withMessages(['items'=>['Informe pelo menos um item.']]);
            $productsValue = round((float) $invoice->items->sum('total_value'), 2);
            $expectedTotal = round($productsValue + (float)$invoice->freight_value + (float)$invoice->insurance_value + (float)$invoice->other_expenses_value - (float)$invoice->discount_value, 2);
            if (abs($productsValue-(float)$invoice->products_value)>.01 || abs($expectedTotal-(float)$invoice->invoice_total)>.01) throw ValidationException::withMessages(['invoice_total'=>['Os totais da nota não correspondem aos itens e acréscimos informados.']]);
            if ($invoice->installments->isEmpty()) throw ValidationException::withMessages(['installments'=>['Informe ao menos uma parcela com vencimento.']]);
            if ($invoice->freight_responsibility === 'FARM_PAYABLE' && $invoice->freights->isEmpty()) throw ValidationException::withMessages(['freights'=>['Informe os dados do frete que será pago pela fazenda.']]);
            $installments = round((float) $invoice->installments->sum('value'), 2);
            if (abs($installments - (float) $invoice->invoice_total) > .01) throw ValidationException::withMessages(['installments'=>['A soma das parcelas deve ser igual ao total da nota.']]);
            $type = DB::table('type_pay_accounts')->where('abbreviation','BO')->where('status','A')->first();
            if (!$type) throw ValidationException::withMessages(['type_pay_account_id'=>['Não existe tipo de pagamento ativo com abreviação BO.']]);
            $centerValid = DB::table('administrative_centers')->where('id',$invoice->administrative_center_id)->where('producer_id',$invoice->producer_id)->where('status','A')->whereNull('deleted_at')->exists();
            if (!$centerValid) throw ValidationException::withMessages(['administrative_center_id'=>['O centro administrativo deve estar ativo e pertencer ao produtor.']]);

            foreach ($invoice->items as $item) {
                if ($item->supplier_product_id && !DB::table('supplier_products')->where('id',$item->supplier_product_id)->where('supplier_id',$invoice->supplier_id)->where('product_id',$item->product_id)->where('status','A')->exists()) throw ValidationException::withMessages(['items'=>['O código do fornecedor não está relacionado ao produto informado.']]);
                if ($invoice->entry_type === 'SEED') {
                    if (abs((float)$item->seedLots->sum('quantity')-(float)$item->quantity)>.001) throw ValidationException::withMessages(['items'=>['A soma dos lotes deve ser igual à quantidade do item.']]);
                    foreach ($item->seedLots as $lot) {
                        $varietyMatchesCulture = DB::table('variety_cultures')->where('id',$lot->variety_culture_id)->where('culture_id',$lot->culture_id)->exists();
                        if (!$varietyMatchesCulture) throw ValidationException::withMessages(['items'=>['A variedade selecionada não pertence à cultura informada.']]);
                        $this->stocks->entry(['product_id'=>$item->product_id,'stock_location_id'=>$lot->stock_location_id,'batch'=>$lot->lot_number,'expiration_date'=>$lot->expiration_date,'treatment_status'=>'UNTREATED','quantity'=>$lot->quantity,'unit_value'=>$item->unit_value,'movement_type'=>'INVOICE_ENTRY','source_type'=>EntryInvoice::class,'source_id'=>$invoice->id,'created_by'=>$userId]);
                    }
                } else {
                    if (abs((float)$item->allocations->sum('quantity')-(float)$item->quantity)>.001) throw ValidationException::withMessages(['items'=>['A soma dos destinos deve ser igual à quantidade do item.']]);
                    foreach ($item->allocations as $allocation) {
                        $location = DB::table('stock_locations')->where('id',$allocation->stock_location_id)->where('status','A')->first();
                        if (!$location) throw ValidationException::withMessages(['stock_location_id'=>['Local de estoque inválido.']]);
                        if ($invoice->entry_type === 'DEFENSIVE' && (!$allocation->batch || !$allocation->manufacturing_date || !$allocation->expiration_date || $allocation->expiration_date < $allocation->manufacturing_date)) throw ValidationException::withMessages(['items'=>['Defensivos exigem lote, data de fabricação e data de vencimento válida.']]);
                        if (in_array($invoice->entry_type, ['FUEL','LUBRICANT'], true)) {
                            if (!$allocation->fuel_station_id || (int)$location->fuel_station_id !== (int)$allocation->fuel_station_id) throw ValidationException::withMessages(['fuel_station_id'=>['Combustível exige um posto compatível com o local de estoque.']]);
                            $physicalStation = DB::table('fuel_stations')->where('id',$allocation->fuel_station_id)->where('station_type','F')->where('status','A')->exists();
                            if (!$physicalStation) throw ValidationException::withMessages(['fuel_station_id'=>['Selecione um posto físico ativo para armazenar o produto.']]);
                        }
                        if ($invoice->entry_type === 'FUEL') {
                            $this->fuelStocks->moveStock((int)$allocation->fuel_station_id,(int)$item->product_id,(float)$allocation->quantity,'E','I',null,'entry_invoice',$invoice->id,(float)$item->unit_value,$userId,'Entrada pela nota fiscal.');
                        } else {
                            $this->stocks->entry(['product_id'=>$item->product_id,'stock_location_id'=>$allocation->stock_location_id,'batch'=>$allocation->batch,'expiration_date'=>$allocation->expiration_date,'quantity'=>$allocation->quantity,'unit_value'=>$item->unit_value,'movement_type'=>'INVOICE_ENTRY','source_type'=>EntryInvoice::class,'source_id'=>$invoice->id,'created_by'=>$userId]);
                        }
                    }
                }
            }
            foreach ($invoice->installments as $installment) {
                $pay = PayAccount::create(['producer_id'=>$invoice->producer_id,'crop_id'=>$invoice->crop_id,'administrative_center_id'=>$invoice->administrative_center_id,'cost_center_id'=>$invoice->cost_center_id,'supplier_id'=>$invoice->supplier_id,'type_pay_account_id'=>$type->id,'document_number'=>$installment->document_number,'document_date'=>$invoice->issue_date,'due_date'=>$installment->due_date,'description'=>"NF {$invoice->invoice_number}/{$invoice->series} - Parcela {$installment->installment_number}",'value'=>$installment->value,'accounted_for'=>'N','status'=>'RI','entry_type'=>PayAccount::ENTRY_ACCOUNT,'source_type'=>EntryInvoiceInstallment::class,'source_id'=>$installment->id]);
                $installment->update(['pay_account_id'=>$pay->id]);
            }
            foreach ($invoice->freights as $freight) $freight->update(['status'=>$invoice->freight_responsibility==='ALREADY_PAID'?'ALREADY_PAID':'OPEN']);
            $invoice->update(['status'=>'CONFIRMED','confirmed_by'=>$userId,'confirmed_at'=>now()]);
            return $invoice->refresh()->load(['items.allocations','items.seedLots','installments','freights']);
        });
    }

    private function header(array $data): array
    {
        $header = collect($data)->only(['entry_type','entry_method','supplier_id','producer_id','administrative_center_id','cost_center_id','crop_id','farm_id','access_key','document_model','invoice_number','series','issue_date','entry_date','operation_nature','products_value','freight_value','insurance_value','discount_value','other_expenses_value','invoice_total','freight_responsibility','observation'])->all();
        $header['farm_id'] = null;
        $header['series'] = $header['series'] ?? '';
        return $header;
    }

    private function saveChildren(EntryInvoice $invoice, array $data, int $userId): void
    {
        foreach ($data['items'] as $index=>$payload) {
            $gross=round((float)$payload['quantity']*(float)$payload['unit_value'],2);
            $total=round($gross-(float)($payload['discount_value']??0)+(float)($payload['freight_value']??0)+(float)($payload['other_expenses_value']??0),2);
            $item=$invoice->items()->create([...collect($payload)->only(['product_id','supplier_product_id','supplier_product_code','description','ncm','cfop','unit','quantity','unit_value','discount_value','freight_value','other_expenses_value'])->all(),'item_number'=>$index+1,'gross_value'=>$gross,'total_value'=>$total]);
            foreach ($payload['allocations']??[] as $allocation) $item->allocations()->create([...$allocation,'batch'=>$allocation['batch']??'']);
            foreach ($payload['seed_lots']??[] as $lot) $item->seedLots()->create($lot);
        }
        foreach ($data['installments'] as $index=>$installment) $invoice->installments()->create([...$installment,'installment_number'=>$index+1]);
        foreach ($data['freights']??[] as $freight) {
            $total=round(((float)$freight['invoice_weight']/1000)*(float)$freight['value_per_ton'],2);
            $invoice->freights()->create([...$freight,'freight_number'=>$this->numbers->next('FRT'),'total_freight_value'=>$total,'paid_value'=>0,'status'=>'DRAFT','created_by'=>$userId]);
        }
    }
}
