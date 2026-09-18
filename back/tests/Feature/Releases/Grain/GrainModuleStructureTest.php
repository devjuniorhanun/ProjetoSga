<?php

namespace Tests\Feature\Releases\Grain;

use App\Models\Releases\Grain\GrainBalance;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class GrainModuleStructureTest extends TestCase
{
    public function test_module_files_and_main_routes_exist(): void
    {
        $this->assertFileExists(base_path('app/Models/Registrations/Property/Registration/FarmStateRegistration.php'));
        $this->assertFileExists(base_path('app/Services/Releases/Grain/WeighingService.php'));
        $this->assertFileExists(base_path('app/Services/Releases/Grain/ContractService.php'));
        $this->assertFileExists(base_path('app/Services/Releases/Grain/TechnicalLossService.php'));
        $this->assertFileExists(base_path('database/migrations/2026_09_13_000080_create_grain_registrations_tables.php'));
        $this->assertFileExists(base_path('database/migrations/2026_09_13_000081_create_grain_operations_tables.php'));

        $routes = collect(Route::getRoutes());
        foreach ([
            'api/integrations/scales/readings',
            'api/releases/grain/tickets',
            'api/releases/grain/tickets/{ticket}/capture-weight',
            'api/releases/grain/tickets/{ticket}/available-contracts',
            'api/releases/grain/contracts',
            'api/releases/grain/contract-transfers',
            'api/releases/grain/balances',
            'api/releases/grain/technical-losses/process',
            'api/registrations/property/registration/farm-state-registrations',
        ] as $uri) {
            $this->assertTrue($routes->contains(fn ($route) => $route->uri() === $uri), "Rota ausente: {$uri}");
        }
    }

    public function test_available_contract_balance_uses_physical_commercial_and_technical_limits(): void
    {
        $balance = new GrainBalance([
            'physical_balance' => 100000,
            'pending_impurity_weight' => 1000,
            'commercial_balance' => 99500,
            'contract_balance' => 10000,
            'estimated_technical_reserve' => 500,
        ]);

        $this->assertSame(89000.0, $balance->availableForContract());
    }

    public function test_state_registration_is_not_tied_to_culture(): void
    {
        $controller = file_get_contents(base_path('app/Http/Controllers/Registrations/Grain/GrainCatalogController.php'));
        $model = file_get_contents(base_path('app/Models/Registrations/Property/Registration/FarmStateRegistration.php'));

        $this->assertNotFalse($controller);
        $this->assertNotFalse($model);
        $this->assertDoesNotMatchRegularExpression("/'farm-state-registrations' => \\[[^\\n]*'culture_id'/", $controller);
        $this->assertMatchesRegularExpression("/'farm-state-registrations' => \\[[^\\n]*'state_registration'/", $controller);
        $this->assertStringNotContainsString("'culture_id'", $model);
    }
}
