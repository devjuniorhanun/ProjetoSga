<?php

namespace Tests\Feature\Releases\Harvest;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class HarvestGrainTransferStructureTest extends TestCase
{
    public function test_transfer_and_harvest_report_structure_exists(): void
    {
        foreach ([
            'app/Models/Releases/Harvest/HarvestGrainTransfer.php',
            'app/Services/Releases/Harvest/HarvestGrainTransferService.php',
            'app/Http/Controllers/Releases/Harvest/HarvestGrainTransferController.php',
            'app/Http/Controllers/Reports/Harvest/HarvestReportController.php',
            'app/Services/Reports/Harvest/HarvestReportService.php',
            'database/migrations/2026_09_13_000087_create_harvest_grain_transfers_table.php',
        ] as $file) $this->assertFileExists(base_path($file));

        $routes = collect(Route::getRoutes());
        foreach ([
            'api/releases/harvest/grain-transfers',
            'api/releases/harvest/grain-transfers/eligible-owners',
            'api/releases/harvest/grain-transfers/available-balance',
            'api/reports/harvest/crops/{crop}/consolidated',
            'api/reports/harvest/crops/{crop}/consolidated/pdf',
            'api/reports/harvest/crops/{crop}/productivity/plots',
            'api/reports/harvest/crops/{crop}/productivity/plots/pdf',
            'api/reports/harvest/crops/{crop}/productivity/farms',
            'api/reports/harvest/crops/{crop}/productivity/farms/pdf',
            'api/reports/harvest/crops/{crop}/productivity/varieties',
            'api/reports/harvest/crops/{crop}/productivity/varieties/pdf',
            'api/reports/harvest/productivity/options',
            'api/reports/harvest/crops/{crop}/productivity/harvesters',
            'api/reports/harvest/crops/{crop}/productivity/harvesters/pdf',
        ] as $uri) $this->assertTrue($routes->contains(fn ($route) => $route->uri() === $uri), $uri);
    }
}
