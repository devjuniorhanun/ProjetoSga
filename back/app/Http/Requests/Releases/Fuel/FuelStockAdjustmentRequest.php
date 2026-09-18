<?php
namespace App\Http\Requests\Releases\Fuel;
use Illuminate\Foundation\Http\FormRequest;
class FuelStockAdjustmentRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return ['fuel_station_id'=>'required|integer|exists:fuel_stations,id','fuel_tank_id'=>'nullable|integer|exists:fuel_tanks,id','product_id'=>'required|integer|exists:products,id','quantity'=>'required|numeric|gt:0','direction'=>'required|string|size:1|in:I,O','observation'=>'required|string|max:500']; }
}
