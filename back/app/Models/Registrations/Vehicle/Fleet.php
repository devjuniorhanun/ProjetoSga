<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Models\Registrations\Vehicle;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Model;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\SoftDeletes;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Vehicle\FleetGroup;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Vehicle\FleetBrand;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Vehicle\FleetModel;

/**
 * Classe Fleet.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class Fleet extends Model
// Abre o bloco de código atual.
{
// Ativa o recurso SoftDeletes para preservar histórico.
// Habilita a exclusão lógica dos registros deste modelo.
    use SoftDeletes;

    // Define explicitamente o nome da tabela quando queremos deixar o mapeamento evidente.
// Define explicitamente o nome da tabela utilizada pelo Eloquent.
    protected $table = 'fleets';

    // Lista os atributos que podem ser preenchidos em massa com segurança.
// Define os atributos permitidos para preenchimento em massa.
    protected $fillable = [
        // Permite o preenchimento do campo fleet_group_id.
// Define o item atual da coleção ou configuração.
        'fleet_group_id',
        // Permite o preenchimento do campo fleet_brand_id.
// Define o item atual da coleção ou configuração.
        'fleet_brand_id',
        // Permite o preenchimento do campo fleet_model_id.
// Define o item atual da coleção ou configuração.
        'fleet_model_id',
        // Permite o preenchimento do campo name.
// Define o item atual da coleção ou configuração.
        'name',
        // Permite o preenchimento do campo code.
// Define o item atual da coleção ou configuração.
        'code',
        // Permite o preenchimento do campo plate.
// Define o item atual da coleção ou configuração.
        'plate',
        // Permite o preenchimento do campo fleet_type.
// Define o item atual da coleção ou configuração.
        'fleet_type',
        // Permite o preenchimento do campo year.
// Define o item atual da coleção ou configuração.
        'year',
        // Permite o preenchimento do campo chassi.
// Define o item atual da coleção ou configuração.
        'chassi',
        // Permite o preenchimento do campo acquisition_date.
// Define o item atual da coleção ou configuração.
        'acquisition_date',
        // Permite o preenchimento do campo acquisition_value.
// Define o item atual da coleção ou configuração.
        'acquisition_value',
        // Permite o preenchimento do campo fuel_type.
// Define o item atual da coleção ou configuração.
        'fuel_type',
        // Permite o preenchimento do campo marking_type.
// Define o item atual da coleção ou configuração.
        'marking_type',
        // Permite o preenchimento do campo starting_meter.
// Define o item atual da coleção ou configuração.
        'starting_meter',
        // Permite o preenchimento do campo end_gauge.
// Define o item atual da coleção ou configuração.
        'end_gauge',
        // Permite o preenchimento do campo status.
// Define o item atual da coleção ou configuração.
        'status',
// Executa a instrução correspondente à regra ou operação atual.
    ];

    // Converte automaticamente os atributos para os tipos esperados pela aplicação.
// Declara o método responsável por esta operação.
    protected function casts(): array
// Abre o bloco de código atual.
    {
        // Retorna o mapa de conversões do Eloquent.
// Retorna o resultado da operação atual.
        return [
            // Converte acquisition_value para decimal:2.
// Define este campo ou configuração na estrutura atual.
            'acquisition_value' => 'decimal:2',
            // Converte starting_meter para decimal:2.
// Define este campo ou configuração na estrutura atual.
            'starting_meter' => 'decimal:2',
            // Converte end_gauge para decimal:2.
// Define este campo ou configuração na estrutura atual.
            'end_gauge' => 'decimal:2',
            // Converte status para string.
// Garante que o valor recebido seja texto.
            'status' => 'string',
// Executa a instrução correspondente à regra ou operação atual.
        ];
// Fecha o bloco de código atual.
    }

    // Define o relacionamento group do modelo.
// Declara o método responsável por esta operação.
    public function group()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(FleetGroup::class, 'fleet_group_id');
// Fecha o bloco de código atual.
    }

    // Define o relacionamento brand do modelo.
// Declara o método responsável por esta operação.
    public function brand()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(FleetBrand::class, 'fleet_brand_id');
// Fecha o bloco de código atual.
    }

    // Define o relacionamento model do modelo.
// Declara o método responsável por esta operação.
    public function model()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(FleetModel::class, 'fleet_model_id');
// Fecha o bloco de código atual.
    }


    // Registros históricos do horímetro/odômetro usados pelo módulo de combustíveis.
    public function meterReadings()
    {
        return $this->hasMany(\App\Models\Releases\Fuel\FleetMeterReading::class, 'fleet_id');
    }

    // Abastecimentos realizados para esta frota.
    public function fuelRefuelings()
    {
        return $this->hasMany(\App\Models\Releases\Fuel\FuelRefueling::class, 'fleet_id');
    }

    // Trocas de óleo registradas para esta frota.
    public function oilChanges()
    {
        return $this->hasMany(\App\Models\Releases\Fuel\FleetOilChange::class, 'fleet_id');
    }

    // Planos de manutenção associados à frota.
    public function maintenancePlans()
    {
        return $this->hasMany(\App\Models\Releases\Fuel\FleetMaintenancePlan::class, 'fleet_id');
    }

    // Permite exclusão lógica sem apagar fisicamente o registro.
}
