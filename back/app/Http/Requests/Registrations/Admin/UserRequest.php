<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Http\Requests\Registrations\Admin;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Foundation\Http\FormRequest;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Validation\Rule;

// Declara a classe responsável por esta parte do domínio.
class UserRequest extends FormRequest
// Abre o bloco de código atual.
{
// Declara o método responsável por esta operação.
    public function authorize(): bool { return true; }

// Declara o método responsável por esta operação.
    public function rules(): array
// Abre o bloco de código atual.
    {
// Executa uma operação utilizando uma dependência ou propriedade da classe.
        $userId = $this->route('user')?->id ?? $this->route('user');
// Exige que o campo seja informado.
        $password = $this->isMethod('post') ? ['required', 'string', 'min:6', 'max:100'] : ['nullable', 'string', 'min:6', 'max:100'];

// Retorna o resultado da operação atual.
        return [
// Exige que o campo seja informado.
            'name' => ['required', 'string', 'max:100'],
// Valida que o valor não esteja duplicado no banco, ignorando o registro atual na edição.
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
// Define este campo ou configuração na estrutura atual.
            'password' => $password,
// Exige que o campo seja informado.
            'role_ids' => ['required', 'array', 'min:1'],
// Garante que o valor recebido seja inteiro.
            'role_ids.*' => ['integer', 'distinct', 'exists:roles,id'],
// Valida o campo somente quando ele estiver presente na requisição.
            'status' => ['sometimes', 'in:A,I'],
// Executa a instrução correspondente à regra ou operação atual.
        ];
// Fecha o bloco de código atual.
    }

    // Traduz os nomes técnicos dos campos para mensagens amigáveis.
// Declara o método responsável por esta operação.
    public function attributes(): array
// Abre o bloco de código atual.
    {
        // Retorna os rótulos usados nas mensagens de validação.
// Retorna o resultado da operação atual.
        return [
            // Define o nome amigável de corporate_name.
// Define este campo ou configuração na estrutura atual.
            'corporate_name' => 'razão social',
            // Define o nome amigável de fantasy_name.
// Define este campo ou configuração na estrutura atual.
            'fantasy_name' => 'nome fantasia',
            // Define o nome amigável de payment_type.
// Define este campo ou configuração na estrutura atual.
            'payment_type' => 'tipo de pagamento',
            // Define o nome amigável de status.
// Define este campo ou configuração na estrutura atual.
            'status' => 'status',
            // Define o nome amigável de owner_id.
// Define este campo ou configuração na estrutura atual.
            'owner_id' => 'proprietário',
            // Define o nome amigável de producer_id.
// Define este campo ou configuração na estrutura atual.
            'producer_id' => 'produtor',
            // Define o nome amigável de farm_id.
// Define este campo ou configuração na estrutura atual.
            'farm_id' => 'fazenda',
            // Define o nome amigável de field_id.
// Define este campo ou configuração na estrutura atual.
            'field_id' => 'talhão',
            // Define o nome amigável de crop_id.
// Define este campo ou configuração na estrutura atual.
            'crop_id' => 'safra',
            // Define o nome amigável de culture_id.
// Define este campo ou configuração na estrutura atual.
            'culture_id' => 'cultura',
            // Define o nome amigável de variety_culture_id.
// Define este campo ou configuração na estrutura atual.
            'variety_culture_id' => 'variedade de cultura',
            // Define o nome amigável de name.
// Define este campo ou configuração na estrutura atual.
            'name' => 'nome',
            // Define o nome amigável de total_area.
// Define este campo ou configuração na estrutura atual.
            'total_area' => 'área total',
            // Define o nome amigável de area.
// Define este campo ou configuração na estrutura atual.
            'area' => 'área',
            // Define o nome amigável de block.
// Define este campo ou configuração na estrutura atual.
            'block' => 'bloco',
            // Define o nome amigável de route.
// Define este campo ou configuração na estrutura atual.
            'route' => 'rota',
            // Define o nome amigável de price.
// Define este campo ou configuração na estrutura atual.
            'price' => 'preço',
            // Define o nome amigável de supplier_id.
// Define este campo ou configuração na estrutura atual.
            'supplier_id' => 'fornecedor',
            // Define o nome amigável de type_supplier_id.
// Define este campo ou configuração na estrutura atual.
            'type_supplier_id' => 'tipo de fornecedor',
            // Define o nome amigável de corporate_reason.
// Define este campo ou configuração na estrutura atual.
            'corporate_reason' => 'razão social',
            // Define o nome amigável de type.
// Define este campo ou configuração na estrutura atual.
            'type' => 'tipo',
            // Define o nome amigável de cpf_cnpj.
// Define este campo ou configuração na estrutura atual.
            'cpf_cnpj' => 'CPF/CNPJ',
            // Define o nome amigável de rg_ie.
// Define este campo ou configuração na estrutura atual.
            'rg_ie' => 'RG/IE',
            // Define o nome amigável de supplier_name.
// Define este campo ou configuração na estrutura atual.
            'supplier_name' => 'nome do fornecedor',
            // Define o nome amigável de bank_name.
// Define este campo ou configuração na estrutura atual.
            'bank_name' => 'nome do banco',
            // Define o nome amigável de agency_number.
// Define este campo ou configuração na estrutura atual.
            'agency_number' => 'número da agência',
            // Define o nome amigável de account_number.
// Define este campo ou configuração na estrutura atual.
            'account_number' => 'número da conta',
            // Define o nome amigável de operation_number.
// Define este campo ou configuração na estrutura atual.
            'operation_number' => 'número da operação',
            // Define o nome amigável de pix_key.
// Define este campo ou configuração na estrutura atual.
            'pix_key' => 'chave PIX',
            // Define o nome amigável de account_type.
// Define este campo ou configuração na estrutura atual.
            'account_type' => 'tipo de conta',
            // Define o nome amigável de front.
// Define este campo ou configuração na estrutura atual.
            'front' => 'frente',
            // Define o nome amigável de machine_quantity.
// Define este campo ou configuração na estrutura atual.
            'machine_quantity' => 'quantidade de máquinas',
            // Define o nome amigável de number_feet.
// Define este campo ou configuração na estrutura atual.
            'number_feet' => 'número de pés',
            // Define o nome amigável de code.
// Define este campo ou configuração na estrutura atual.
            'code' => 'código',
            // Define o nome amigável de plate.
// Define este campo ou configuração na estrutura atual.
            'plate' => 'placa',
            // Define o nome amigável de opening_date.
// Define este campo ou configuração na estrutura atual.
            'opening_date' => 'data de abertura',
            // Define o nome amigável de closing_date.
// Define este campo ou configuração na estrutura atual.
            'closing_date' => 'data de encerramento',
            // Define o nome amigável de shipping_cost.
// Define este campo ou configuração na estrutura atual.
            'shipping_cost' => 'custo de transporte',
            // Define o nome amigável de body.
// Define este campo ou configuração na estrutura atual.
            'body' => 'conteúdo',
            // Define o nome amigável de drivers_contract_id.
// Define este campo ou configuração na estrutura atual.
            'drivers_contract_id' => 'contrato de motoristas',
            // Define o nome amigável de driver_id.
// Define este campo ou configuração na estrutura atual.
            'driver_id' => 'motorista',
            // Define o nome amigável de lanyard_contract_id.
// Define este campo ou configuração na estrutura atual.
            'lanyard_contract_id' => 'contrato de colhedores',
            // Define o nome amigável de lanyard_id.
// Define este campo ou configuração na estrutura atual.
            'lanyard_id' => 'colhedor',
            // Define o nome amigável de fleet_group_id.
// Define este campo ou configuração na estrutura atual.
            'fleet_group_id' => 'grupo de frota',
            // Define o nome amigável de fleet_brand_id.
// Define este campo ou configuração na estrutura atual.
            'fleet_brand_id' => 'marca da frota',
            // Define o nome amigável de fleet_model_id.
// Define este campo ou configuração na estrutura atual.
            'fleet_model_id' => 'modelo da frota',
            // Define o nome amigável de fleet_type.
// Define este campo ou configuração na estrutura atual.
            'fleet_type' => 'tipo de frota',
            // Define o nome amigável de year.
// Define este campo ou configuração na estrutura atual.
            'year' => 'ano',
            // Define o nome amigável de chassi.
// Define este campo ou configuração na estrutura atual.
            'chassi' => 'chassi',
            // Define o nome amigável de acquisition_date.
// Define este campo ou configuração na estrutura atual.
            'acquisition_date' => 'data de aquisição',
            // Define o nome amigável de acquisition_value.
// Define este campo ou configuração na estrutura atual.
            'acquisition_value' => 'valor de aquisição',
            // Define o nome amigável de fuel_type.
// Define este campo ou configuração na estrutura atual.
            'fuel_type' => 'tipo de combustível',
            // Define o nome amigável de marking_type.
// Define este campo ou configuração na estrutura atual.
            'marking_type' => 'tipo de medição',
            // Define o nome amigável de starting_meter.
// Define este campo ou configuração na estrutura atual.
            'starting_meter' => 'medição inicial',
            // Define o nome amigável de end_gauge.
// Define este campo ou configuração na estrutura atual.
            'end_gauge' => 'medição final',
            // Define o nome amigável de type_operation_id.
// Define este campo ou configuração na estrutura atual.
            'type_operation_id' => 'tipo de operação',
            // Define o nome amigável de formulation.
// Define este campo ou configuração na estrutura atual.
            'formulation' => 'formulação',
            // Define o nome amigável de abbreviation.
// Define este campo ou configuração na estrutura atual.
            'abbreviation' => 'abreviação',
            // Define o nome amigável de order.
// Define este campo ou configuração na estrutura atual.
            'order' => 'ordem',
            // Define o nome amigável de product_id.
// Define este campo ou configuração na estrutura atual.
            'product_id' => 'produto',
            // Define o nome amigável de type_formulation_id.
// Define este campo ou configuração na estrutura atual.
            'type_formulation_id' => 'tipo de formulação',
            // Define o nome amigável de agricultural_product_id.
// Define este campo ou configuração na estrutura atual.
            'agricultural_product_id' => 'produto agrícola',
            // Define o nome amigável de active_ingredient.
// Define este campo ou configuração na estrutura atual.
            'active_ingredient' => 'ingrediente ativo',
            // Define o nome amigável de concentration.
// Define este campo ou configuração na estrutura atual.
            'concentration' => 'concentração',
            // Define o nome amigável de product_group_id.
// Define este campo ou configuração na estrutura atual.
            'product_group_id' => 'grupo de produtos',
            // Define o nome amigável de sub_group_product_id.
// Define este campo ou configuração na estrutura atual.
            'sub_group_product_id' => 'subgrupo de produtos',
            // Define o nome amigável de stock.
// Define este campo ou configuração na estrutura atual.
            'stock' => 'estoque',
            // Define o nome amigável de stock_location.
// Define este campo ou configuração na estrutura atual.
            'stock_location' => 'localização do estoque',
            // Define o nome amigável de minimum_quantity.
// Define este campo ou configuração na estrutura atual.
            'minimum_quantity' => 'quantidade mínima',
            // Define o nome amigável de drum_box.
// Define este campo ou configuração na estrutura atual.
            'drum_box' => 'quantidade por caixa',
            // Define o nome amigável de gallon_package.
// Define este campo ou configuração na estrutura atual.
            'gallon_package' => 'quantidade por galão',
            // Define o nome amigável de unit.
// Define este campo ou configuração na estrutura atual.
            'unit' => 'unidade',
            // Define o nome amigável de product_code.
// Define este campo ou configuração na estrutura atual.
            'product_code' => 'código do produto',
            // Define o nome amigável de volume.
// Define este campo ou configuração na estrutura atual.
            'volume' => 'volume',
            // Define o nome amigável de cei.
// Define este campo ou configuração na estrutura atual.
            'cei' => 'CEI',
            // Define o nome amigável de state_registration.
// Define este campo ou configuração na estrutura atual.
            'state_registration' => 'inscrição estadual',
            // Define o nome amigável de observations.
// Define este campo ou configuração na estrutura atual.
            'observations' => 'observações',
            // Define o nome amigável de pms.
// Define este campo ou configuração na estrutura atual.
            'pms' => 'PMS',
            // Define o nome amigável de linear_seed.
// Define este campo ou configuração na estrutura atual.
            'linear_seed' => 'sementes por metro linear',
            // Define o nome amigável de start_planting.
// Define este campo ou configuração na estrutura atual.
            'start_planting' => 'início do plantio',
            // Define o nome amigável de final_planting.
// Define este campo ou configuração na estrutura atual.
            'final_planting' => 'finalização do plantio',
            // Define o nome amigável de expected_date.
// Define este campo ou configuração na estrutura atual.
            'expected_date' => 'previsão de colheita',
// Executa a instrução correspondente à regra ou operação atual.
        ];
// Fecha o bloco de código atual.
    }
// Fecha o bloco de código atual.
}
