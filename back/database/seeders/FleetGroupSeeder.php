<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FleetGroupSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['PULVERIZADOR', 'TRATOR', 'TANQUE'] as $name) {
            DB::table('fleet_groups')->updateOrInsert(
                ['name' => $name],
                [
                    'status' => 'A',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }
    }
}
