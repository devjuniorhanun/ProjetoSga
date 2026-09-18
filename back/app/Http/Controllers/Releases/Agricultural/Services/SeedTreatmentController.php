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
    public function __construct(private readonly ProductStockService $stocks,private readonly DocumentSequenceService $numbers){}
    public function index(Request $r){return DB::table('seed_treatments')->whereNull('deleted_at')->when($r->status,fn($q,$v)=>$q->where('status',$v))->when($r->crop_id,fn($q,$v)=>$q->where('crop_id',$v))->latest('service_date')->paginate(25);}
    public function show(int $treatment){return $this->detail($treatment);}
 public function store(Request $r){$d=$r->validate($this->rules());return DB::transaction(function()use($d,$r){$id=DB::table('seed_treatments')->insertGetId(['treatment_number'=>$this->numbers->next('TRS'),'service_date'=>$d['service_date'],'crop_id'=>$d['crop_id'],'culture_id'=>$d['culture_id'],'number_of_treatment_batches'=>$d['number_of_treatment_batches'],'total_seed_quantity'=>collect($d['seeds'])->sum('treated_quantity'),'status'=>'DRAFT','observation'=>$d['observation']??null,'created_by'=>$r->user()->id,'created_at'=>now(),'updated_at'=>now()]);foreach($d['seeds']as$s){$stock=DB::table('product_stocks')->where('id',$s['product_stock_id'])->firstOrFail();$profile=DB::table('seed_product_profiles')->where('product_id',$s['product_id'])->where('culture_id',$s['culture_id'])->where('variety_culture_id',$s['variety_culture_id'])->where('status','A')->exists();if(!$profile||(int)$stock->product_id!==(int)$s['product_id']||$stock->batch!==$s['lot_number']||$stock->treatment_status!=='UNTREATED')throw ValidationException::withMessages(['seeds'=>['Semente, variedade, lote e estoque não tratado são incompatíveis.']]);DB::table('seed_treatment_seeds')->insert([...$s,'seed_treatment_id'=>$id,'available_quantity_snapshot'=>$stock->quantity,'created_at'=>now(),'updated_at'=>now()]);}foreach($d['products']as$p)DB::table('seed_treatment_products')->insert([...$p,'seed_treatment_id'=>$id,'recommended_quantity'=>($p['dose_per_batch']??0)*$d['number_of_treatment_batches'],'created_at'=>now(),'updated_at'=>now()]);return response()->json($this->detail($id),201);});}
    public function complete(Request $r,int $treatment)
    {
        return DB::transaction(function()use($r,$treatment){
            $t=DB::table('seed_treatments')->where('id',$treatment)->lockForUpdate()->firstOrFail();
            if($t->status!=='DRAFT')throw ValidationException::withMessages(['status'=>['Tratamento já processado.']]);
            foreach(DB::table('seed_treatment_seeds')->where('seed_treatment_id',$treatment)->get()as$s){
                $source=DB::table('product_stocks')->where('id',$s->product_stock_id)->firstOrFail();
                if((int)$source->product_id!==(int)$s->product_id||$source->treatment_status!=='UNTREATED')throw ValidationException::withMessages(['seeds'=>['O estoque da semente não corresponde ao produto ou já foi tratado.']]);
                $common=['product_id'=>$s->product_id,'stock_location_id'=>$source->stock_location_id,'batch'=>$source->batch,'quantity'=>$s->treated_quantity,'unit_value'=>$source->average_cost,'source_type'=>'SeedTreatment','source_id'=>$treatment,'created_by'=>$r->user()->id];
                $this->stocks->output([...$common,'treatment_status'=>'UNTREATED','movement_type'=>'SEED_TREATMENT_INPUT']);
                $this->stocks->entry([...$common,'treatment_status'=>'TREATED','movement_type'=>'SEED_TREATMENT_OUTPUT']);
            }
            foreach(DB::table('seed_treatment_products')->where('seed_treatment_id',$treatment)->get()as$p){
                $stock=DB::table('product_stocks')->where('id',$p->product_stock_id)->firstOrFail();
                if((int)$stock->product_id!==(int)$p->product_id)throw ValidationException::withMessages(['products'=>['O estoque selecionado não pertence ao produto de tratamento informado.']]);
                $movement=$this->stocks->output(['product_id'=>$p->product_id,'stock_location_id'=>$stock->stock_location_id,'batch'=>$stock->batch,'treatment_status'=>$stock->treatment_status,'quantity'=>$p->real_quantity,'unit_value'=>$stock->average_cost,'movement_type'=>'SEED_TREATMENT_PRODUCT_OUTPUT','source_type'=>'SeedTreatment','source_id'=>$treatment,'created_by'=>$r->user()->id]);
                DB::table('seed_treatment_products')->where('id',$p->id)->update(['stock_movement_id'=>$movement]);
            }
            DB::table('seed_treatments')->where('id',$treatment)->update(['status'=>'COMPLETED','completed_by'=>$r->user()->id,'completed_at'=>now(),'updated_at'=>now()]);
            return $this->detail($treatment);
        });
    }
    private function detail(int$id):array{return ['treatment'=>DB::table('seed_treatments')->find($id),'seeds'=>DB::table('seed_treatment_seeds')->where('seed_treatment_id',$id)->get(),'products'=>DB::table('seed_treatment_products')->where('seed_treatment_id',$id)->get()];}
    private function rules():array{return ['service_date'=>'required|date','crop_id'=>'required|exists:crops,id','culture_id'=>'required|exists:cultures,id','number_of_treatment_batches'=>'required|integer|min:1','observation'=>'nullable|string','seeds'=>'required|array|min:1','seeds.*.product_id'=>'required|exists:products,id','seeds.*.culture_id'=>'required|exists:cultures,id','seeds.*.variety_culture_id'=>'required|exists:variety_cultures,id','seeds.*.product_stock_id'=>'required|distinct|exists:product_stocks,id','seeds.*.lot_number'=>'required|string|max:100','seeds.*.treated_quantity'=>'required|numeric|gt:0','seeds.*.unit'=>'required|string|max:20','seeds.*.treatment_batch_quantity'=>'required|integer|min:1','seeds.*.treatment_batch_number'=>'nullable|string|max:100','products'=>'required|array|min:1','products.*.product_id'=>'required|exists:products,id','products.*.product_stock_id'=>'required|exists:product_stocks,id','products.*.dose_per_batch'=>'nullable|numeric|min:0','products.*.real_quantity'=>'required|numeric|gt:0','products.*.unit'=>'required|string|max:20'];}
}
