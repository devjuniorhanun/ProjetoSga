<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Models\Registrations\Admin;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Foundation\Auth\User as Authenticatable;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Notifications\Notifiable;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
// Importa uma dependência utilizada neste arquivo.
use Laravel\Sanctum\HasApiTokens;

// Declara a classe responsável por esta parte do domínio.
class User extends Authenticatable
// Abre o bloco de código atual.
{
// Importa uma dependência utilizada neste arquivo.
    use HasApiTokens, Notifiable;

// Define explicitamente o nome da tabela utilizada pelo Eloquent.
    protected $table = 'users';

// Define os atributos permitidos para preenchimento em massa.
    protected $fillable = ['name', 'email', 'password', 'status'];

// Executa a instrução correspondente à regra ou operação atual.
    protected $hidden = ['password', 'remember_token'];

// Declara o método responsável por esta operação.
    public function roles(): BelongsToMany
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsToMany(Role::class)->orderBy('name');
// Fecha o bloco de código atual.
    }

// Declara o método responsável por esta operação.
    public function hasAnyRole(array|string $roles): bool
// Abre o bloco de código atual.
    {
// Executa a instrução correspondente à regra ou operação atual.
        $roles = is_array($roles) ? $roles : [$roles];
// Retorna o resultado da operação atual.
        return $this->roles()->whereIn('abbreviation', $roles)->where('status', 'A')->exists();
// Fecha o bloco de código atual.
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->hasAnyRole('SUPER')) {
            return true;
        }

        return $this->roles()
            ->whereHas('permissions', fn ($query) => $query->where('name', $permission))
            ->exists();
    }

// Declara o método responsável por esta operação.
    protected function casts(): array
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return ['email_verified_at' => 'datetime', 'password' => 'hashed'];
// Fecha o bloco de código atual.
    }
// Fecha o bloco de código atual.
}
