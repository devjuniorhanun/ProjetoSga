<?php
namespace App\Http\Requests\Releases\Fuel;
use Illuminate\Foundation\Http\FormRequest;
class FuelOilChangeRequest extends FormRequest { public function authorize(): bool{return true;} public function rules(): array{return ['fleet_id'=>'required|integer|exists:fleets,id','product_id'=>'required|integer|exists:products,id','change_date'=>'required|date','marking_type'=>'required|string|size:1|in:H,K','meter_value'=>'required|numeric|min:0','quantity'=>'nullable|numeric|min:0','next_meter_value'=>'nullable|numeric|min:0','observation'=>'nullable|string|max:500'];} }
