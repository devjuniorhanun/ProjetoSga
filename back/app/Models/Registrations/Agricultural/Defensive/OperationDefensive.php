<?php
namespace App\Models\Registrations\Agricultural\Defensive;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
class OperationDefensive extends Model
{
    use SoftDeletes;
    protected $table = 'operation_defensives';
    protected $fillable = ['name','status'];
    protected function casts(): array { return ['status'=>'string']; }
    public function typeOperations(): HasMany { return $this->hasMany(TypeOperation::class, 'operation_defensive_id'); }
}
