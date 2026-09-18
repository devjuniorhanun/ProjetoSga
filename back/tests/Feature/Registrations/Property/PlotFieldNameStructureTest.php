<?php

namespace Tests\Feature\Registrations\Property;

use Tests\TestCase;

class PlotFieldNameStructureTest extends TestCase
{
    public function test_plot_field_name_is_exposed_to_harvest_release(): void
    {
        $migration = file_get_contents(base_path('database/migrations/2026_09_06_000040_create_plot_fields_table.php'));
        $this->assertStringContainsString("string('name', 150)", $migration);

        $model = file_get_contents(base_path('app/Models/Registrations/Property/Areas/PlotField.php'));
        $request = file_get_contents(base_path('app/Http/Requests/Registrations/Property/Areas/PlotFieldRequest.php'));
        $resource = file_get_contents(base_path('app/Http/Resources/Registrations/Property/Areas/PlotFieldResource.php'));
        $harvest = file_get_contents(base_path('app/Http/Controllers/Releases/Harvest/HarvestReleaseController.php'));

        $this->assertStringContainsString("'name'", $model);
        $this->assertStringContainsString("'name' =>", $request);
        $this->assertStringContainsString("'name' => \$this->name", $resource);
        $this->assertStringContainsString("'pf.name as plot_name'", $harvest);
        $this->assertStringContainsString("'f.name as field_name'", $harvest);
        $this->assertStringContainsString("'v.name as variety_name'", $harvest);
    }
}
