<?php

namespace App\Http\Resources\Registrations\Product;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe ProductGroupResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class ProductGroupResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            // Expõe o campo name.
            'name' => $this->name,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
