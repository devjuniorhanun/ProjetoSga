<?php
namespace App\Http\Requests\Releases\Fuel;
use Illuminate\Foundation\Http\FormRequest;
class FuelRegistradoraRequest extends FormRequest { public function authorize(): bool{return true;} public function rules(): array{return ['fuel_station_id'=>'required|integer|exists:fuel_stations,id','product_id'=>'required|integer|exists:products,id','name'=>'required|string|max:100','initial_reading'=>'nullable|numeric|min:0','status'=>'required|string|size:1|in:A,I'];} }
