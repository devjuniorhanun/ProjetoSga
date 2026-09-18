<?php
namespace Tests\Feature\Releases\Fuel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;
class FuelModuleStructureTest extends TestCase {
    use RefreshDatabase;
    #[Test]
    public function rotas_basicas_do_modulo_estao_registradas(): void {
        $this->assertTrue(collect(\Illuminate\Support\Facades\Route::getRoutes())->contains(fn($route)=>$route->uri()==='api/releases/fuel/stations'));
        $this->assertTrue(collect(\Illuminate\Support\Facades\Route::getRoutes())->contains(fn($route)=>$route->uri()==='api/releases/fuel/refuelings'));
        $this->assertTrue(collect(\Illuminate\Support\Facades\Route::getRoutes())->contains(fn($route)=>$route->uri()==='api/releases/fuel/transfers/{transfer}/confirm'));
        $this->assertDirectoryExists(base_path('app/Models/Releases/Fuel'));
        $this->assertDirectoryDoesNotExist(base_path('app/Models/Entries/Fuel'));
    }
}
