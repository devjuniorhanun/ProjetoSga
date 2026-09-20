<?php

// Define o namespace do teste funcional.
namespace Tests\Feature\Entries\Agricultural;

// Importa a classe base de testes do Laravel.
use Tests\TestCase;

// Valida estruturalmente o contrato do módulo.
class AgriculturalDefensiveOrderStructureTest extends TestCase
{
    // Confirma que o módulo possui as regras principais no código-fonte.
    public function test_module_contract_is_documented(): void
    {
        // Verifica que o controller existe.
        $this->assertFileExists(base_path('app/Http/Controllers/Releases/Agricultural/Services/Defensive/DefensiveServiceController.php'));
        // Verifica que o service existe.
        $this->assertFileExists(base_path('app/Services/Releases/Agricultural/Services/Defensive/AgriculturalDefensiveOrderService.php'));
        // Verifica que a migration principal existe.
        $this->assertFileExists(base_path('database/migrations/2026_09_08_000048_create_agricultural_defensive_orders_table.php'));
        // Verifica que o fechamento existe.
        $this->assertFileExists(base_path('database/migrations/2026_09_08_000055_create_agricultural_defensive_order_closings_table.php'));
        // Verifica que o histórico de estoque existe.
        $this->assertFileExists(base_path('database/migrations/2026_09_13_000082_create_unified_product_inventory_tables.php'));
        $this->assertFileExists(base_path('database/migrations/2026_09_06_000036_create_agricultural_products_table.php'));
        $this->assertFileExists(base_path('database/migrations/2026_09_11_000077_create_agricultural_defensive_order_operator_products_table.php'));
        $this->assertFileExists(base_path('database/migrations/2026_09_08_000050_create_agricultural_defensive_order_products_table.php'));
        $this->assertFileExists(base_path('app/Services/Releases/Agricultural/Services/Defensive/AgriculturalDefensiveOrderProductSequenceService.php'));
        $this->assertFileExists(base_path('database/migrations/2026_09_15_000088_create_operator_tank_withdrawals_table.php'));
        $this->assertFileExists(base_path('app/Models/Releases/Agricultural/Services/Defensive/OperatorTankWithdrawal.php'));
        $this->assertFileExists(base_path('app/Http/Requests/Releases/Agricultural/Services/Defensive/AgriculturalDefensiveOrderProductSequenceRequest.php'));
        $this->assertFileExists(base_path('docs/Servicos-Agricolas/README.md'));
        $this->assertFileExists(base_path('docs/Servicos-Agricolas/Defensivo/README.md'));
        $this->assertFileExists(base_path('app/Http/Controllers/Registrations/Product/SubGroupProductController.php'));
        $routes = file_get_contents(base_path('routes/api.php'));
        $service = file_get_contents(base_path('app/Services/Releases/Agricultural/Services/Defensive/AgriculturalDefensiveOrderService.php'));
        $request = file_get_contents(base_path('app/Http/Requests/Releases/Agricultural/Services/Defensive/AgriculturalDefensiveOrderRequest.php'));
        $this->assertStringContainsString("'/fleets/by-function'", $routes);
        $this->assertStringContainsString("'/products'", $routes);
        $this->assertStringContainsString("'/crops/{crop}/tank-operators/{operator}/open-dates'", $routes);
        $this->assertStringContainsString("'/tank/withdrawals'", $routes);
        $this->assertStringContainsString("'O' => 'PULVERIZADOR'", $service);
        $this->assertStringContainsString("'T' => 'TRATOR'", $service);
        $this->assertStringContainsString("->whereHas('operator', fn (\$q) => \$q->where('status', 'A'))", $service);
        $this->assertStringContainsString("'id' => \$orderOperator->operator_id", $service);
        $this->assertStringContainsString("'name' => \$orderOperator->operator?->supplier?->fantasy_name", $service);
        $this->assertStringContainsString("'date' => Carbon::parse(\$date)->toDateString()", $service);
        $this->assertStringContainsString("->whereDate('application_date', \$selectedDate)", $service);
        $this->assertStringContainsString("'products' => array_values(\$grouped)", $service);
        $this->assertStringContainsString("->whereDate('application_date', '<=', \$selectedDate)", $service);
        $this->assertStringContainsString("'suggested_withdrawal'", $service);
        $this->assertStringContainsString('OperatorTankWithdrawal::create', $service);
        $this->assertStringContainsString("'used_quantity' => 0.0", $service);
        $this->assertStringContainsString("\$recommendedPump = round(\$requestedArea / (float) \$data['pump_capacity'], 3)", $service);
        $this->assertStringContainsString("'recommended_pump' => \$recommendedPump", $service);
        $this->assertStringContainsString("(float) \$productData['pump'] * \$recommendedPump", $service);
        $this->assertStringContainsString("(float) \$orderProduct->pump * (float) \$order->recommended_pump", $service);
        $this->assertStringContainsString("(float) \$item->pump * (float) \$order->recommended_pump", $service);
        $this->assertStringContainsString("->pluck('date')", $service);
        $this->assertStringContainsString('synchronizeTankBalancesThroughDate', $service);
        $this->assertStringContainsString("'opening_quantity' => \$opening", $service);
        $this->assertStringContainsString("- (float) \$tankProduct->used_quantity", $service);
        $this->assertStringContainsString("- (float) \$tankProduct->returned_quantity", $service);
        $this->assertStringContainsString("round(\$closingBomb * (float) \$item->pump, 3)", $service);
        $this->assertStringContainsString("round(max(\$product['open_quantity'] - \$product['tank_balance'], 0), 3)", $service);
        $this->assertStringContainsString("'decimal:0,3'", $request);
        $this->assertStringContainsString('withValidator', $request);
        $this->assertStringContainsString('cadastro agrícola e tipo de formulação ativos', $request);
        $this->assertStringContainsString('operators.operator.supplier', $service);
    }
}
