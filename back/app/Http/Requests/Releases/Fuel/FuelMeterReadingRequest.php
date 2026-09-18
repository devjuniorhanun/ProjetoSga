<?php
namespace App\Http\Requests\Releases\Fuel;
use Illuminate\Foundation\Http\FormRequest;
class FuelMeterReadingRequest extends FormRequest { public function authorize(): bool{return true;} public function rules(): array{return ['fleet_id'=>'required|integer|exists:fleets,id','reading_date'=>'required|date','marking_type'=>'required|string|size:1|in:H,K','initial_value'=>'nullable|numeric|min:0','final_value'=>'required|numeric|min:0','observation'=>'nullable|string|max:500'];} }
