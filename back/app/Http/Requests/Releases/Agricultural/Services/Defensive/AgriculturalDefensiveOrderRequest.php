<?php

// Define o namespace da requisição de OS.
namespace App\Http\Requests\Releases\Agricultural\Services\Defensive;

// Importa a classe base de FormRequest.
use Illuminate\Foundation\Http\FormRequest;
// Importa Rule para listas fechadas.
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Illuminate\Support\Facades\DB;

// Valida a criação e atualização de uma OS.
class AgriculturalDefensiveOrderRequest extends FormRequest
{
    // Permite a validação para usuários já autenticados pela rota.
    public function authorize(): bool { return true; }

    // Define as regras do payload.
    public function rules(): array
    {
        // Retorna as regras de todos os campos.
        return [
            // Exige ao menos um talhão.
            'fields' => ['required', 'array', 'min:1'],
            // Cada talhão precisa ser um objeto/lista.
            'fields.*' => ['required', 'array'],
            // Valida o identificador do talhão.
            'fields.*.field_id' => ['required', 'integer', 'exists:fields,id', 'distinct'],
            // Valida a área de cada talhão.
            'fields.*.area' => ['required', 'numeric', 'gt:0'],
            // Valida a safra.
            'crop_id' => ['required', 'integer', 'exists:crops,id'],
            // Valida a cultura.
            'culture_id' => ['required', 'integer', 'exists:cultures,id'],
            // Valida o tipo de operação.
            'type_operation_id' => ['required', 'integer', 'exists:type_operations,id'],
            // Valida a data da aplicação.
            'application_date' => ['required', 'date'],
            // Valida o volume.
            'pump_volume' => ['required', 'numeric', 'gt:0'],
            // O backend calcula a quantidade por talhão; aceita o valor antigo apenas por compatibilidade.
            'recommended_pump' => ['sometimes', 'nullable', 'numeric', 'gt:0', 'decimal:0,3'],
            // Valida a vazão.
            'flow' => ['required', 'numeric', 'gt:0'],
            // Valida a capacidade.
            'pump_capacity' => ['required', 'numeric', 'gt:0'],
            // Permite os três estados funcionais da O.S.
            'status' => ['sometimes', Rule::in(['A', 'F', 'I'])],
            // Observação operacional opcional.
            'observation' => ['nullable', 'string', 'max:2000'],
            // Exige operadores.
            'operators' => ['required', 'array', 'min:1'],
            // Valida cada operador.
            'operators.*' => ['required', 'array'],
            // Valida o operador.
            'operators.*.operator_id' => ['required', 'integer', 'exists:agricultural_operators,id'],
            // Valida a frota opcional.
            'operators.*.fleet_id' => ['nullable', 'integer', 'exists:fleets,id'],
            // Valida as funções operacionais permitidas.
            'operators.*.function' => ['required', 'string', Rule::in(['O', 'T'])],
            // Exige produtos.
            'products' => ['required', 'array', 'min:1'],
            // Valida cada produto.
            'products.*' => ['required', 'array'],
            // Valida o produto.
            'products.*.product_id' => ['required', 'integer', 'exists:products,id', 'distinct'],
            // Guarda a dose recomendada/histórica.
            'products.*.dose' => ['required', 'numeric', 'gt:0', 'decimal:0,3'],
            // Guarda a quantidade recomendada do produto por bomba.
            'products.*.pump' => ['required', 'numeric', 'gt:0', 'decimal:0,3'],
        ];
    }

    // Confirma no backend se a frota pertence ao grupo permitido pela função.
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            foreach ((array) $this->input('operators', []) as $index => $operator) {
                $function = $operator['function'] ?? null;
                $fleetId = $operator['fleet_id'] ?? null;

                if (! in_array($function, ['O', 'T'], true) || ! $fleetId) {
                    continue;
                }

                $expectedGroup = $function === 'O' ? 'PULVERIZADOR' : 'TRATOR';
                $valid = DB::table('fleets')
                    ->join('fleet_groups', 'fleet_groups.id', '=', 'fleets.fleet_group_id')
                    ->where('fleets.id', $fleetId)
                    ->where('fleets.status', 'A')
                    ->whereNull('fleets.deleted_at')
                    ->where('fleet_groups.status', 'A')
                    ->whereRaw('UPPER(TRIM(fleet_groups.name)) = ?', [$expectedGroup])
                    ->exists();

                if (! $valid) {
                    $label = $function === 'O' ? 'Operador' : 'Tanqueiro';
                    $validator->errors()->add(
                        "operators.{$index}.fleet_id",
                        "A frota selecionada não pertence ao grupo {$expectedGroup} exigido para {$label}."
                    );
                }
            }

            foreach ((array) $this->input('products', []) as $index => $product) {
                $productId = $product['product_id'] ?? null;
                if (! $productId) {
                    continue;
                }

                $valid = DB::table('agricultural_products')
                    ->join('products', 'products.id', '=', 'agricultural_products.product_id')
                    ->join('type_formulations', 'type_formulations.id', '=', 'agricultural_products.type_formulation_id')
                    ->where('agricultural_products.product_id', $productId)
                    ->where('agricultural_products.status', 'A')
                    ->where('products.status', 'A')
                    ->whereNull('products.deleted_at')
                    ->where('type_formulations.status', 'A')
                    ->exists();

                if (! $valid) {
                    $validator->errors()->add(
                        "products.{$index}.product_id",
                        'O produto selecionado precisa possuir cadastro agrícola e tipo de formulação ativos.'
                    );
                }
            }
        });
    }

    // Define mensagens de validação em português brasileiro.
    public function messages(): array
    {
        // Retorna as mensagens customizadas.
        return [
            // Mensagem para campos obrigatórios.
            'required' => 'O campo :attribute é obrigatório.',
            // Mensagem para arrays.
            'array' => 'O campo :attribute deve ser uma lista.',
            // Mensagem para mínimo de itens.
            'min.array' => 'Informe pelo menos um item em :attribute.',
            // Mensagem para inteiros.
            'integer' => 'O campo :attribute deve ser um número inteiro.',
            // Mensagem para números.
            'numeric' => 'O campo :attribute deve ser numérico.',
            // Mensagem para maior que zero.
            'gt.numeric' => 'O campo :attribute deve ser maior que zero.',
            'decimal' => 'O campo :attribute deve possuir no máximo três casas decimais.',
            // Mensagem para existência.
            'exists' => 'O registro selecionado em :attribute não existe.',
            // Mensagem para data.
            'date' => 'O campo :attribute deve ser uma data válida.',
            // Mensagem para valores fechados.
            'in' => 'O valor informado para :attribute é inválido.',
            // Mensagem para duplicidade.
            'distinct' => 'Não informe registros repetidos em :attribute.',
        ];
    }

    // Traduz os nomes técnicos para mensagens amigáveis.
    public function attributes(): array
    {
        // Retorna os nomes públicos.
        return [
            // Nome do array de talhões.
            'fields' => 'talhões',
            // Nome do identificador do talhão.
            'fields.*.field_id' => 'talhão',
            // Nome da área.
            'fields.*.area' => 'área do talhão',
            // Nome da safra.
            'crop_id' => 'safra',
            // Nome da cultura.
            'culture_id' => 'cultura',
            // Nome da operação.
            'type_operation_id' => 'tipo de operação',
            // Nome da data.
            'application_date' => 'data de aplicação',
            // Nome do volume.
            'pump_volume' => 'volume da bomba',
            // Nome da bomba recomendada.
            'recommended_pump' => 'bombas recomendadas',
            // Nome da vazão.
            'flow' => 'vazão',
            // Nome da capacidade.
            'pump_capacity' => 'capacidade da bomba',
            'observation' => 'observação',
            // Nome dos operadores.
            'operators' => 'operadores',
            // Nome do operador individual.
            'operators.*.operator_id' => 'operador',
            // Nome da frota.
            'operators.*.fleet_id' => 'frota',
            // Nome da função.
            'operators.*.function' => 'função',
            // Nome dos produtos.
            'products' => 'produtos',
            // Nome do produto individual.
            'products.*.product_id' => 'produto',
            // Nome da dose.
            'products.*.dose' => 'dose',
            // Nome do pump do produto.
            'products.*.pump' => 'quantidade por bomba',
        ];
    }
}
