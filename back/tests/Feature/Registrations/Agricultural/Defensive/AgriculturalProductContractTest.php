<?php

namespace Tests\Feature\Registrations\Agricultural\Defensive;

use Tests\TestCase;

class AgriculturalProductContractTest extends TestCase
{
    public function test_agricultural_product_supports_multiple_active_ingredients(): void
    {
        $request = file_get_contents(base_path('app/Http/Requests/Registrations/Agricultural/Defensive/AgriculturalProductRequest.php'));
        $service = file_get_contents(base_path('app/Services/Registrations/Agricultural/Defensive/AgriculturalProductService.php'));
        $resource = file_get_contents(base_path('app/Http/Resources/Registrations/Agricultural/Defensive/AgriculturalProductResource.php'));

        $this->assertStringContainsString("'active_ingredient' => ['required', 'array', 'min:1']", $request);
        $this->assertStringContainsString("'active_ingredient.*.active_ingredient'", $request);
        $this->assertStringContainsString("'active_ingredient.*.concentration'", $request);
        $this->assertStringContainsString('createMany($activeIngredients)', $service);
        $this->assertStringContainsString("'product_name' => $this->product?->name", $resource);
        $this->assertStringContainsString("'formulation' => $this->typeFormulation?->abbreviation", $resource);
    }
}
