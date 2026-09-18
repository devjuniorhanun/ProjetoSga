<?php

namespace Database\Seeders;

use App\Models\Registrations\Admin\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['name' => 'Super Administrador', 'abbreviation' => 'SUPER'],
            ['name' => 'Administrador', 'abbreviation' => 'ADM'],
            ['name' => 'Financeiro', 'abbreviation' => 'FIN'],
            ['name' => 'Defensivo', 'abbreviation' => 'DEF'],
            ['name' => 'Almoxarifado', 'abbreviation' => 'ALM'],
            ['name' => 'Usuário', 'abbreviation' => 'USR'],
            ['name' => 'Operador de Balança', 'abbreviation' => 'BAL'],
        ] as $role) {
            Role::updateOrCreate(['abbreviation' => $role['abbreviation']], $role + ['status' => 'A']);
        }
    }
}
