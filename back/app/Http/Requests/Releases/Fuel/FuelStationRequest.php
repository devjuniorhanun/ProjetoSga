<?php
namespace App\Http\Requests\Releases\Fuel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
class FuelStationRequest extends FormRequest { public function authorize(): bool{return true;} public function rules(): array{return ['name'=>['required','string','max:150'],'code'=>['required','string','max:50',Rule::unique('fuel_stations','code')->ignore($this->route('station'))],'station_type'=>['required','string','size:1',Rule::in(['F','M'])],'status'=>['required','string','size:1',Rule::in(['A','I'])],'description'=>['nullable','string','max:500']];} }
