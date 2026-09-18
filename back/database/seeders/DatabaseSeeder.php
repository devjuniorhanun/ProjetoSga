<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            CulturesSeed::class,
            FleetGroupSeeder::class,
            TypeSupplierSeed::class,
            GrainPermissionSeeder::class,
            FiscalInventoryServicePermissionSeeder::class,
            //TypePayAccountSeed::class,
        ]);
    }
}
