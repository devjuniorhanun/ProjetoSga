<?php

// Define o namespace do tanque diário.
namespace App\Models\Releases\Agricultural\Services\Defensive;

// Importa o model base.
use Illuminate\Database\Eloquent\Model;
// Importa a relação belongsTo.
use Illuminate\Database\Eloquent\Relations\BelongsTo;
// Importa a relação hasMany.
use Illuminate\Database\Eloquent\Relations\HasMany;
// Importa o operador.
use App\Models\Registrations\Agricultural\Defensive\AgriculturalOperator;

// Representa o tanque operacional de um operador em uma data.
class OperatorTank extends Model
{
    // Define a tabela.
    protected $table = 'operator_tanks';
    // Define os campos preenchíveis.
    protected $fillable = ['operator_id', 'date', 'status'];
    // Converte a data.
    protected function casts(): array { return ['date' => 'date']; }
    // Relaciona ao operador.
    public function operator(): BelongsTo { return $this->belongsTo(AgriculturalOperator::class, 'operator_id'); }
    // Relaciona aos produtos do tanque.
    public function products(): HasMany { return $this->hasMany(OperatorTankProduct::class); }
    // Relaciona aos movimentos.
    public function movements(): HasMany { return $this->hasMany(OperatorTankMovement::class); }
    // Relaciona aos fechamentos.
    public function closings(): HasMany { return $this->hasMany(AgriculturalDefensiveOrderClosing::class); }
    // Relaciona aos documentos de retirada realizados para este tanque.
    public function withdrawals(): HasMany { return $this->hasMany(OperatorTankWithdrawal::class); }
}
