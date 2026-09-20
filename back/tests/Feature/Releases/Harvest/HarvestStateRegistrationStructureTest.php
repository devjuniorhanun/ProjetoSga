<?php

namespace Tests\Feature\Releases\Harvest;

use Tests\TestCase;

class HarvestStateRegistrationStructureTest extends TestCase
{
    public function test_harvest_release_uses_the_producer_farm_state_registration(): void
    {
        $controller = file_get_contents(base_path('app/Http/Controllers/Releases/Harvest/HarvestReleaseController.php'));
        $model = file_get_contents(base_path('app/Models/Releases/Harvest/HarvestRelease.php'));
        $routes = file_get_contents(base_path('routes/api.php'));

        $this->assertStringContainsString("'farm_state_registration_id'=>[\$required", $controller);
        $this->assertStringContainsString("->whereColumn('fsr.farm_id', 'f.farm_id')", $controller);
        $this->assertStringContainsString("public function stateRegistrations", $controller);
        $this->assertStringContainsString("'farm_state_registration_id'", $model);
        $this->assertStringContainsString("Route::get('state-registrations'", $routes);
    }

    public function test_legacy_harvest_import_resolves_the_state_registration(): void
    {
        $service = file_get_contents(base_path('app/Services/Imports/LegacyCsvImportService.php'));

        $this->assertStringContainsString("'farm_state_registration_id' => \$stateRegistrationId", $service);
        $this->assertStringContainsString('resolveHarvestStateRegistration', $service);
        $this->assertStringContainsString("\$row['fazenda_id']", $service);
    }
}
