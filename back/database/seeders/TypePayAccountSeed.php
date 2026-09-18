<?php

namespace Database\Seeders;

use App\Models\Registrations\Financial\TypePayAccount;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TypePayAccountSeed extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        TypePayAccount::create(['name' => 'BOLETO', 'abbreviation' => 'BO']);
        TypePayAccount::create(['name' => 'DINHEIRO', 'abbreviation' => 'DI']);
        TypePayAccount::create(['name' => 'CHEQUE', 'abbreviation' => 'CH']);
        TypePayAccount::create(['name' => 'TRANSFERÊNCIA', 'abbreviation' => 'TR']);
        TypePayAccount::create(['name' => 'DIESEL', 'abbreviation' => 'DE']);
        TypePayAccount::create(['name' => 'SOJA', 'abbreviation' => 'SO']);
    }
}
