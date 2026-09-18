<?php
namespace App\Http\Requests\Releases\Fuel;
use Illuminate\Foundation\Http\FormRequest;
class FuelMaintenancePlanRequest extends FormRequest { public function authorize(): bool{return true;} public function rules(): array{return ['fleet_id'=>'required|integer|exists:fleets,id','name'=>'required|string|max:150','marking_type'=>'required|string|size:1|in:H,K','interval_value'=>'required|numeric|gt:0','base_meter_value'=>'nullable|numeric|min:0','status'=>'required|string|size:1|in:A,I'];} }
