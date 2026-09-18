<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Models\Registrations\Admin;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Model;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\SoftDeletes;

// Declara a classe responsável por esta parte do domínio.
class Config extends Model
// Abre o bloco de código atual.
{
// Habilita a exclusão lógica dos registros deste modelo.
    use SoftDeletes;

// Define explicitamente o nome da tabela utilizada pelo Eloquent.
    protected $table = 'configs';

// Define os atributos permitidos para preenchimento em massa.
    protected $fillable = ['producer_name', 'property_name', 'producer_color', 'property_color', 'logo_path', 'status'];

// Define a conversão automática dos atributos para os tipos esperados.
    protected $casts = ['status' => 'string'];
// Fecha o bloco de código atual.
}
