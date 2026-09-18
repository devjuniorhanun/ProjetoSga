<?php

namespace App\Http\Controllers\Registrations;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class InventoryCatalogController extends Controller
{
    private const TABLES=['stock-locations'=>'stock_locations','product-stock-profiles'=>'product_stock_profiles','seed-product-profiles'=>'seed_product_profiles','agricultural-service-types'=>'agricultural_service_types','freight-rates'=>'freight_rates'];
    public function index(Request $request,string $catalog){$table=$this->table($catalog);$q=DB::table($table);if(in_array($catalog,['stock-locations','agricultural-service-types','freight-rates'],true))$q->whereNull($table.'.deleted_at');foreach(['status','product_id','entry_type','invoice_entry_type','location_type','service_category','crop_id','carrier_id'] as $f)if($request->filled($f))$q->where($f,$request->$f);return $q->orderBy('id')->paginate(min($request->integer('per_page',25),100));}
    public function store(Request $request,string $catalog){$data=$request->validate($this->rules($catalog));$data['created_at']=now();$data['updated_at']=now();if(in_array($catalog,['freight-rates'],true))$data['created_by']=$request->user()->id;$id=DB::table($this->table($catalog))->insertGetId($data);return response()->json(DB::table($this->table($catalog))->find($id),201);}
    public function show(string $catalog,int $id){return DB::table($this->table($catalog))->findOrFail($id);}
    public function update(Request $request,string $catalog,int $id){$data=$request->validate($this->rules($catalog,true,$id));$data['updated_at']=now();DB::table($this->table($catalog))->where('id',$id)->update($data);return DB::table($this->table($catalog))->findOrFail($id);}
    public function destroy(string $catalog,int $id){$table=$this->table($catalog);$data=['updated_at'=>now()];if(in_array($catalog,['stock-locations','agricultural-service-types','freight-rates'],true))$data['deleted_at']=now();else $data['status']='I';DB::table($table)->where('id',$id)->update($data);return response()->noContent();}
    private function table(string $catalog):string{abort_unless(isset(self::TABLES[$catalog]),404);return self::TABLES[$catalog];}
    private function rules(string $catalog,bool $update=false,?int $id=null):array{$r=$update?'sometimes':'required';$status=['sometimes',Rule::in(['A','I'])];return match($catalog){
        'stock-locations'=>['name'=>[$r,'string'],'code'=>[$r,'string','max:60',Rule::unique('stock_locations')->ignore($id)],'location_type'=>[$r,Rule::in(['FUEL_STATION','HEADQUARTERS','WAREHOUSE','DEPOT','PLOT_FIELD','OTHER'])],'producer_id'=>'nullable|exists:producers,id','administrative_center_id'=>'nullable|exists:administrative_centers,id','farm_id'=>'nullable|exists:farms,id','plot_field_id'=>'nullable|exists:plot_fields,id','fuel_station_id'=>'nullable|exists:fuel_stations,id','maximum_capacity'=>'nullable|numeric|gt:0','status'=>$status,'notes'=>'nullable|string'],
        'product-stock-profiles'=>['product_id'=>[$r,'exists:products,id',Rule::unique('product_stock_profiles')->ignore($id)],'invoice_entry_type'=>[$r,Rule::in(['FUEL','LUBRICANT','DEFENSIVE','INPUT','GENERAL','SEED'])],'default_destination_type'=>[$r,Rule::in(['FUEL_STATION','GENERAL_LOCATION','PLOT_FIELD','SELECTABLE'])],'controls_stock'=>'sometimes|boolean','allows_freight'=>'sometimes|boolean','requires_batch'=>'sometimes|boolean','requires_expiration_date'=>'sometimes|boolean','status'=>$status],
        'seed-product-profiles'=>['product_id'=>[$r,'exists:products,id',Rule::unique('seed_product_profiles')->ignore($id)],'culture_id'=>[$r,'exists:cultures,id'],'variety_culture_id'=>[$r,'exists:variety_cultures,id'],'seed_category'=>'nullable|string|max:50','seed_class'=>'nullable|string|max:50','default_unit'=>[$r,'string','max:20'],'status'=>$status],
        'agricultural-service-types'=>['name'=>[$r,'string'],'code'=>[$r,'string','max:60',Rule::unique('agricultural_service_types')->ignore($id)],'service_category'=>[$r,Rule::in(['SOIL_PREPARATION','INPUT_APPLICATION','FIREBREAK_MAINTENANCE'])],'requires_input'=>'sometimes|boolean','allows_fixed_rate'=>'sometimes|boolean','allows_variable_rate'=>'sometimes|boolean','requires_fleet'=>'sometimes|boolean','requires_implement'=>'sometimes|boolean','status'=>$status,'description'=>'nullable|string'],
        'freight-rates'=>['crop_id'=>[$r,'exists:crops,id'],'carrier_id'=>[$r,'exists:suppliers,id'],'product_id'=>[$r,'exists:products,id'],'value_per_ton'=>[$r,'numeric','gt:0'],'effective_from'=>[$r,'date'],'effective_until'=>'nullable|date|after_or_equal:effective_from','status'=>$status,'notes'=>'nullable|string'],
    };}
}
