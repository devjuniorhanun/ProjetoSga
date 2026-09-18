<?php
namespace App\Http\Requests\Releases\Fuel;
use Illuminate\Foundation\Http\FormRequest;
class FuelTankRequest extends FormRequest { public function authorize(): bool{return true;} public function rules(): array{return ['fuel_station_id'=>'required|integer|exists:fuel_stations,id','name'=>'required|string|max:100','code'=>'required|string|max:50','capacity'=>'nullable|numeric|min:0','status'=>'required|string|size:1|in:A,I','description'=>'nullable|string|max:500'];} }
