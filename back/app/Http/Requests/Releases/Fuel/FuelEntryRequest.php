<?php
namespace App\Http\Requests\Releases\Fuel;
use Illuminate\Foundation\Http\FormRequest;
class FuelEntryRequest extends FormRequest { public function authorize(): bool{return true;} public function rules(): array{return ['fuel_station_id'=>'required|integer|exists:fuel_stations,id','fuel_tank_id'=>'nullable|integer|exists:fuel_tanks,id','product_id'=>'required|integer|exists:products,id','supplier_id'=>'nullable|integer|exists:suppliers,id','entry_date'=>'required|date','quantity'=>'required|numeric|gt:0','unit_price'=>'nullable|numeric|min:0','total_value'=>'nullable|numeric|min:0','invoice_number'=>'nullable|string|max:100','status'=>'required|string|size:1|in:A,C','observation'=>'nullable|string|max:500'];} }
