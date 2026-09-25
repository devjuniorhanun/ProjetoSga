<?php
namespace App\Http\Controllers\Releases\Inventory;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class ProductStockController extends Controller {
 public function balances(Request $r){return DB::table('product_stocks')->join('products','products.id','=','product_stocks.product_id')->join('stock_locations','stock_locations.id','=','product_stocks.stock_location_id')->leftJoin('cultures','cultures.id','=','product_stocks.culture_id')->leftJoin('variety_cultures','variety_cultures.id','=','product_stocks.variety_culture_id')->when($r->product_id,fn($q,$v)=>$q->where('product_stocks.product_id',$v))->when($r->stock_location_id,fn($q,$v)=>$q->where('product_stocks.stock_location_id',$v))->when($r->culture_id,fn($q,$v)=>$q->where('product_stocks.culture_id',$v))->when($r->variety_culture_id,fn($q,$v)=>$q->where('product_stocks.variety_culture_id',$v))->when($r->treatment_status,fn($q,$v)=>$q->where('product_stocks.treatment_status',$v))->select('product_stocks.*','products.name as product_name','products.unit','products.stock as general_stock','stock_locations.name as location_name','stock_locations.location_type','cultures.name as culture_name','variety_cultures.name as variety_name')->paginate(min($r->integer('per_page',50),100));}
 public function movements(Request $r){return DB::table('product_stock_movements')->when($r->product_id,fn($q,$v)=>$q->where('product_id',$v))->when($r->stock_location_id,fn($q,$v)=>$q->where('stock_location_id',$v))->when($r->movement_type,fn($q,$v)=>$q->where('movement_type',$v))->latest('occurred_at')->paginate(min($r->integer('per_page',50),100));}
}
