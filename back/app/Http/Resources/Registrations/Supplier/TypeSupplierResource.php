<?php

namespace App\Http\Resources\Registrations\Supplier;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe TypeSupplierResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class TypeSupplierResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            // Expõe o campo name.
            'name' => $this->name,
            'code' => $this->code,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
