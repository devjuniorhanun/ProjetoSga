<?php

namespace Tests\Feature\Registrations;

use Tests\TestCase;

class UniqueValidationUpdateStructureTest extends TestCase
{
    public function test_resource_requests_use_the_real_snake_case_route_parameters(): void
    {
        $requests = base_path('app/Http/Requests');
        $camelCaseParameters = [
            'typeFormulation', 'operationDefensive', 'typeSupplier',
            'typeOperation', 'typePayAccount', 'subGroupProduct',
            'plotField', 'fleetModel', 'productGroup', 'fleetBrand',
            'fleetGroup', 'costCenter',
        ];

        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($requests));
        foreach ($iterator as $file) {
            if (! $file->isFile() || $file->getExtension() !== 'php') {
                continue;
            }
            $source = file_get_contents($file->getPathname());
            foreach ($camelCaseParameters as $parameter) {
                $this->assertStringNotContainsString(
                    "route('{$parameter}')",
                    $source,
                    "A request {$file->getFilename()} usa um parâmetro de rota incompatível com apiResource.",
                );
            }
        }
    }

    public function test_requested_resource_fields_and_fleet_group_seed_are_present(): void
    {
        $product = file_get_contents(base_path('app/Http/Resources/Registrations/Product/ProductResource.php'));
        $operator = file_get_contents(base_path('app/Http/Resources/Registrations/Agricultural/Defensive/AgriculturalOperatorResource.php'));
        $seed = file_get_contents(base_path('database/seeders/FleetGroupSeeder.php'));

        $this->assertStringContainsString("'group_product_name'", $product);
        $this->assertStringContainsString("'sub_group_product_name'", $product);
        $this->assertStringContainsString("'supplier_name'", $operator);
        $this->assertStringContainsString("'PULVERIZADOR'", $seed);
        $this->assertStringContainsString("'TRATOR'", $seed);
        $this->assertStringContainsString("'TANQUE'", $seed);
    }
}
