<?php
namespace App\Http\Requests\Releases\Fuel;
use Illuminate\Foundation\Http\FormRequest;
class FuelMaintenanceRecordRequest extends FormRequest { public function authorize(): bool{return true;} public function rules(): array{return ['fleet_id'=>'required|integer|exists:fleets,id','maintenance_plan_id'=>'nullable|integer|exists:fleet_maintenance_plans,id','maintenance_date'=>'required|date','marking_type'=>'required|string|size:1|in:H,K','meter_value'=>'required|numeric|min:0','next_meter_value'=>'nullable|numeric|min:0','cost'=>'nullable|numeric|min:0','description'=>'nullable|string|max:500'];} }
