<?php
namespace App\Http\Requests\Releases\Fuel;
use Illuminate\Foundation\Http\FormRequest;
class FuelTransferRequest extends FormRequest { public function authorize(): bool{return true;} public function rules(): array{return ['source_station_id'=>'required|integer|exists:fuel_stations,id','source_tank_id'=>'nullable|integer|exists:fuel_tanks,id','destination_station_id'=>'required|integer|exists:fuel_stations,id','destination_tank_id'=>'nullable|integer|exists:fuel_tanks,id','product_id'=>'required|integer|exists:products,id','transfer_date'=>'required|date','quantity'=>'required|numeric|gt:0','document_number'=>'nullable|string|max:100','observation'=>'nullable|string|max:500'];} }
