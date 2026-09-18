<?php
namespace App\Http\Requests\Registrations\Agricultural\Defensive;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
class OperationDefensiveRequest extends FormRequest
{
 public function authorize(): bool { return true; }
 public function rules(): array { $id=$this->route('operation_defensive')?->id ?? $this->route('operation_defensive'); return ['name'=>['required','string','max:255',Rule::unique('operation_defensives','name')->ignore($id)],'status'=>['sometimes',Rule::in(['A','I'])]]; }
 public function messages(): array { return ['required'=>'O campo :attribute é obrigatório.','string'=>'O campo :attribute deve ser um texto.','max.string'=>'O campo :attribute não pode ter mais de :max caracteres.','unique'=>'O valor informado para :attribute já está sendo utilizado.','status.in'=>'O status informado é inválido.']; }
 public function attributes(): array { return ['name'=>'nome','status'=>'status']; }
}
