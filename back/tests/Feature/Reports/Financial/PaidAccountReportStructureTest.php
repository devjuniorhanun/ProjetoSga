<?php

namespace Tests\Feature\Reports\Financial;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class PaidAccountReportStructureTest extends TestCase
{
    public function test_paid_account_report_files_and_routes_exist(): void
    {
        $this->assertFileExists(base_path('app/Http/Controllers/Reports/Financial/PaidAccountReportController.php'));
        $this->assertFileExists(base_path('app/Http/Requests/Reports/Financial/PaidAccountReportRequest.php'));
        $this->assertFileExists(base_path('app/Http/Requests/Reports/Financial/PaidAccountByCropReportRequest.php'));
        $this->assertFileExists(base_path('app/Services/Reports/Financial/PaidAccountReportService.php'));
        $this->assertFileExists(base_path('app/Services/Reports/Pdf/SimplePdfReport.php'));

        $routes = collect(Route::getRoutes());
        foreach ([
            'api/reports/financial/paid-accounts',
            'api/reports/financial/paid-accounts/pdf',
            'api/reports/financial/paid-accounts/by-cost-center',
            'api/reports/financial/paid-accounts/by-cost-center/pdf',
            'api/reports/financial/paid-accounts/crop-options',
            'api/reports/financial/paid-accounts/by-crop',
            'api/reports/financial/paid-accounts/by-crop/pdf',
        ] as $uri) {
            $this->assertTrue($routes->contains(fn ($route) => $route->uri() === $uri), $uri);
        }
    }

    public function test_internal_pdf_renderer_generates_a_valid_pdf_signature(): void
    {
        $pdf = app(\App\Services\Reports\Pdf\SimplePdfReport::class)->render(
            'Relatório', 'Período de teste',
            [['key' => 'name', 'label' => 'Nome', 'width' => 700, 'chars' => 100]],
            [['name' => 'Centro de custo']],
            ['Total' => 'R$ 10,00']
        );

        $this->assertStringStartsWith('%PDF-1.4', $pdf);
        $this->assertStringContainsString('%%EOF', $pdf);
    }

    public function test_pay_accounts_have_a_direct_crop_dimension(): void
    {
        $migration = file_get_contents(base_path('database/migrations/2026_09_13_000079_create_pay_accounts_table.php'));

        $this->assertStringContainsString("foreignId('crop_id')->constrained()", $migration);
        $this->assertStringContainsString("index(['crop_id', 'document_date'])", $migration);
    }
}
