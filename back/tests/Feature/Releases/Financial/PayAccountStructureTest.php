<?php

namespace Tests\Feature\Releases\Financial;

use Tests\TestCase;

class PayAccountStructureTest extends TestCase
{
    public function test_financial_release_module_files_and_routes_exist(): void
    {
        $this->assertFileExists(base_path('app/Models/Releases/Financial/PayAccount.php'));
        $this->assertFileExists(base_path('app/Services/Releases/Financial/PayAccountService.php'));
        $this->assertFileExists(base_path('app/Http/Controllers/Releases/Financial/PayAccountController.php'));
        $this->assertFileExists(base_path('app/Http/Requests/Releases/Financial/PayAccountRequest.php'));
        $this->assertFileExists(base_path('app/Http/Requests/Releases/Financial/PayrollRequest.php'));
        $this->assertFileExists(base_path('app/Http/Resources/Releases/Financial/PayAccountResource.php'));
        $this->assertFileExists(base_path('database/migrations/2026_09_13_000079_create_pay_accounts_table.php'));

        $routes = collect(\Illuminate\Support\Facades\Route::getRoutes());
        $this->assertTrue($routes->contains(fn ($route) => $route->uri() === 'api/releases/financial/pay-accounts'));
        $this->assertTrue($routes->contains(fn ($route) => $route->uri() === 'api/releases/financial/pay-accounts/transfers'));
        $this->assertTrue($routes->contains(fn ($route) => $route->uri() === 'api/releases/financial/pay-accounts/payroll'));
    }
}
