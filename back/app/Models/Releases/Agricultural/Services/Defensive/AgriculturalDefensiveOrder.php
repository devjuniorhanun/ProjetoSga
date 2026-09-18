<?php

// Define o namespace da entidade de lançamento de OS.
namespace App\Models\Releases\Agricultural\Services\Defensive;

// Importa o model base do Eloquent.
use Illuminate\Database\Eloquent\Model;
// Importa a relação de um para muitos.
use Illuminate\Database\Eloquent\Relations\BelongsTo;
// Importa a relação de muitos para muitos.
use Illuminate\Database\Eloquent\Relations\HasMany;
// Importa o model de talhão.
use App\Models\Registrations\Property\Areas\Field;
// Importa o model de safra.
use App\Models\Registrations\Harvest\Crop;
// Importa o model de cultura.
use App\Models\Registrations\Harvest\Culture;
// Importa o model de tipo de operação.
use App\Models\Registrations\Agricultural\Defensive\TypeOperation;
// Importa o model de itens de produto.
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrderProduct;
// Importa o model de operadores.
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrderOperator;
// Importa o model de fechamentos.
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrderClosing;
// Importa o model das referências anteriores.
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrderPreviousOrder;

// Representa uma ordem de serviço individual para um único talhão.
class AgriculturalDefensiveOrder extends Model
{
    // Define explicitamente a tabela.
    protected $table = 'agricultural_defensive_orders';

    // Define os campos que podem ser preenchidos em massa.
    protected $fillable = [
        // Guarda o número público da OS.
        'os_number',
        // Guarda a OS pai quando esta for uma ordem filha.
        'parent_order_id',
        // Guarda o único talhão da OS.
        'field_id',
        // Guarda a área utilizada no talhão.
        'area',
        // Guarda a safra.
        'crop_id',
        // Guarda a cultura.
        'culture_id',
        // Guarda o tipo de operação.
        'type_operation_id',
        // Guarda a data da aplicação.
        'application_date',
        // Guarda o volume da bomba/tanque.
        'pump_volume',
        // Guarda as bombas recomendadas.
        'recommended_pump',
        // Guarda a vazão.
        'flow',
        // Guarda a capacidade da bomba.
        'pump_capacity',
        // Guarda o total real acumulado de bombas.
        'used_bomb',
        // Guarda o status.
        'status',
    ];

    // Define os casts dos campos numéricos e de data.
    protected function casts(): array
    {
        // Retorna o mapa de tipos.
        return [
            // Converte área para decimal.
            'area' => 'decimal:3',
            // Converte a data para o tipo de data do Laravel.
            'application_date' => 'date',
            // Converte volume para decimal.
            'pump_volume' => 'decimal:3',
            // Converte bombas recomendadas para decimal.
            'recommended_pump' => 'decimal:3',
            // Converte vazão para decimal.
            'flow' => 'decimal:3',
            // Converte capacidade para decimal.
            'pump_capacity' => 'decimal:3',
            // Converte bombas reais para decimal.
            'used_bomb' => 'decimal:3',
        ];
    }

    // Define o talhão da OS.
    public function field(): BelongsTo
    {
        // Retorna a relação com Field.
        return $this->belongsTo(Field::class);
    }

    // Define a OS pai.
    public function parentOrder(): BelongsTo
    {
        // Retorna a relação recursiva.
        return $this->belongsTo(self::class, 'parent_order_id');
    }

    // Define as OS filhas.
    public function childOrders(): HasMany
    {
        // Retorna todas as ordens filhas.
        return $this->hasMany(self::class, 'parent_order_id');
    }

    // Define a safra.
    public function crop(): BelongsTo
    {
        // Retorna a relação com Crop.
        return $this->belongsTo(Crop::class);
    }

    // Define a cultura.
    public function culture(): BelongsTo
    {
        // Retorna a relação com Culture.
        return $this->belongsTo(Culture::class);
    }

    // Define o tipo de operação.
    public function typeOperation(): BelongsTo
    {
        // Retorna a relação com TypeOperation.
        return $this->belongsTo(TypeOperation::class);
    }

    // Define os operadores da OS.
    public function operators(): HasMany
    {
        // Retorna os registros intermediários de operadores.
        return $this->hasMany(AgriculturalDefensiveOrderOperator::class);
    }

    // Define os produtos da OS.
    public function products(): HasMany
    {
        // Retorna os produtos planejados/realizados.
        return $this->hasMany(AgriculturalDefensiveOrderProduct::class)->orderBy('sequence');
    }

    // Define os fechamentos da OS.
    public function closings(): HasMany
    {
        // Retorna o histórico de fechamentos.
        return $this->hasMany(AgriculturalDefensiveOrderClosing::class);
    }

    public function operatorProducts(): HasMany
    {
        return $this->hasMany(AgriculturalDefensiveOrderOperatorProduct::class, 'agricultural_defensive_order_id')
            ->orderBy('agricultural_defensive_order_operator_id')
            ->orderBy(
                AgriculturalDefensiveOrderProduct::query()
                    ->select('sequence')
                    ->whereColumn(
                        'agricultural_defensive_order_products.agricultural_defensive_order_id',
                        'agricultural_defensive_order_operator_products.agricultural_defensive_order_id'
                    )
                    ->whereColumn(
                        'agricultural_defensive_order_products.product_id',
                        'agricultural_defensive_order_operator_products.product_id'
                    )
                    ->limit(1)
            );
    }

    // Define as referências a ordens anteriores.
    public function previousOrders(): HasMany
    {
        // Retorna as relações usadas durante a edição/reemissão.
        return $this->hasMany(AgriculturalDefensiveOrderPreviousOrder::class, 'order_id');
    }
}
