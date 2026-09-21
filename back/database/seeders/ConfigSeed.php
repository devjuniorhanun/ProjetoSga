<?php

namespace Database\Seeders;

use App\Models\Registrations\Admin\Config;
use Illuminate\Database\Seeder;

class ConfigSeed extends Seeder
{
    public function run(): void
    {
        $config = Config::create([
            'producer_name' => 'PAULO ROBERTO TITOTO',
            'property_name' => 'FAZENDA SANTA MARTA',
            'producer_color' => '#fbef3c',
            'property_color' => '#DEEBF7',
        ]);
    }
}
