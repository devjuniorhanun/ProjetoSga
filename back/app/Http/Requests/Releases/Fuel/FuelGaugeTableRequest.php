<?php
namespace App\Http\Requests\Releases\Fuel;
use Illuminate\Foundation\Http\FormRequest;
class FuelGaugeTableRequest extends FormRequest { public function authorize(): bool{return true;} public function rules(): array{return ['fuel_tank_id'=>'required|integer|exists:fuel_tanks,id','centimeters'=>'required|numeric|min:0','liters'=>'required|numeric|min:0'];} }
