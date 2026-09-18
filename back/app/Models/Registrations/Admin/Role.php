<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Models\Registrations\Admin;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Model;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

// Declara a classe responsável por esta parte do domínio.
class Role extends Model
// Abre o bloco de código atual.
{
// Define explicitamente o nome da tabela utilizada pelo Eloquent.
    protected $table = 'roles';

// Define os atributos permitidos para preenchimento em massa.
    protected $fillable = ['name', 'abbreviation', 'status'];

// Declara o método responsável por esta operação.
    public function users(): BelongsToMany
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsToMany(User::class)->orderBy('name');
// Fecha o bloco de código atual.
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'permission_role');
    }
// Fecha o bloco de código atual.
}
