<?php
namespace App\Http\Controllers\Releases\Fuel;
use App\Http\Controllers\Controller;
use App\Http\Resources\Releases\Fuel\FuelStockMovementResource;
use App\Models\Releases\Fuel\FuelStockMovement;
use Illuminate\Http\Request;
class FuelStockMovementController extends Controller
{
    public function index(Request $request)
    {
        $query = FuelStockMovement::query()->latest('id');
        if ($request->filled('fuel_station_id')) $query->where('fuel_station_id',$request->integer('fuel_station_id'));
        if ($request->filled('product_id')) $query->where('product_id',$request->integer('product_id'));
        return FuelStockMovementResource::collection($query->paginate($request->integer('per_page',30)));
    }
}
