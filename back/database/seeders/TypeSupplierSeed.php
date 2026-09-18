<?php

namespace Database\Seeders;

use App\Models\Registrations\Supplier\TypeSupplier;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TypeSupplierSeed extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (['ARMAZÉNS GERAIS', 'COLHEDOR', 'FUNCIONÁRIO', 'GERAL', 'INSUMOS', 'TRANSPORTADOR', 'SEMENTES', 'ADUBO', 'CALCÁRIO', 'GESSO', 'COMBUSTIVEIS', 'LUBRIFICANTES'] as $name) {
            TypeSupplier::firstOrCreate(['name' => $name], ['status' => 'A']);
        }

        TypeSupplier::updateOrCreate(['name' => 'COMPRADOR'], ['code' => 'BUYER', 'status' => 'A']);
    }
}
