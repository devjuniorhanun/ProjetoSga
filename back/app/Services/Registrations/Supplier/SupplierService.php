<?php

namespace App\Services\Registrations\Supplier;

use App\Models\Registrations\Supplier\Supplier;
use Illuminate\Support\Facades\DB;

/**
 * Classe SupplierService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class SupplierService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return Supplier::query()->with(['types','bankSuppliers','warehouses','drivers','lanyards'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): Supplier
    {
        // Persiste os dados no banco.
        return DB::transaction(function () use ($data): Supplier {
            $typeSupplierIds = $data['type_supplier_ids'];
            unset($data['type_supplier_ids']);

            $supplier = Supplier::create($data);
            $supplier->types()->sync($typeSupplierIds);

            return $supplier->load(['types','bankSuppliers','warehouses','drivers','lanyards']);
        });
    }

    // Atualiza um registro existente.
    public function update(Supplier $item, array $data): Supplier
    {
        return DB::transaction(function () use ($item, $data): Supplier {
            $hasTypeSuppliers = array_key_exists('type_supplier_ids', $data);
            $typeSupplierIds = $data['type_supplier_ids'] ?? [];
            unset($data['type_supplier_ids']);

            $item->update($data);
            if ($hasTypeSuppliers) {
                $item->types()->sync($typeSupplierIds);
            }

            return $item->load(['types','bankSuppliers','warehouses','drivers','lanyards']);
        });
    }

    // Remove logicamente o registro.
    public function delete(Supplier $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
