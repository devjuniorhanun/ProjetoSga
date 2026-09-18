<?php
namespace App\Http\Requests\Releases\Fuel;
use Illuminate\Foundation\Http\FormRequest;
class FuelGaugeReadingRequest extends FormRequest { public function authorize(): bool{return true;} public function rules(): array{return ['fuel_tank_id'=>'required|integer|exists:fuel_tanks,id','reading_at'=>'required|date','centimeters'=>'required|numeric|min:0','observation'=>'nullable|string|max:500'];} }
