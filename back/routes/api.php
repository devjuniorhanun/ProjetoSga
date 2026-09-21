<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\Imports\LegacyImportController;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Registrations\Admin\ConfigController;
use App\Http\Controllers\Registrations\Admin\RoleController;
use App\Http\Controllers\Registrations\Admin\UserController;
use App\Http\Controllers\Registrations\Agricultural\Defensive\ActiveIngredientController;
use App\Http\Controllers\Registrations\Agricultural\Defensive\AgriculturalOperatorController;
use App\Http\Controllers\Registrations\Agricultural\Defensive\AgriculturalProductController;
use App\Http\Controllers\Registrations\Agricultural\Defensive\TypeFormulationController;
use App\Http\Controllers\Registrations\Agricultural\Defensive\TypeOperationController;
use App\Http\Controllers\Registrations\Agricultural\Defensive\OperationDefensiveController;
use App\Http\Controllers\Registrations\Financial\AdministrativeCenterController;
use App\Http\Controllers\Registrations\Financial\CostCenterController;
use App\Http\Controllers\Registrations\Financial\TypePayAccountController;
use App\Http\Controllers\Registrations\Harvest\AgriculturalYearController;
use App\Http\Controllers\Registrations\Harvest\CropController;
use App\Http\Controllers\Registrations\Harvest\CultureController;
use App\Http\Controllers\Registrations\Harvest\VarietyCultureController;
use App\Http\Controllers\Registrations\Property\OwnerController;
use App\Http\Controllers\Registrations\Property\ProducerController;
use App\Http\Controllers\Registrations\Product\ProductController;
use App\Http\Controllers\Registrations\Product\ProductGroupController;
use App\Http\Controllers\Registrations\Product\SubGroupProductController;
use App\Http\Controllers\Registrations\Product\SupplierProductController;
use App\Http\Controllers\Registrations\Property\Areas\FarmController;
use App\Http\Controllers\Registrations\Property\Areas\FieldController;
use App\Http\Controllers\Registrations\Property\Areas\MatrixFreightController;
use App\Http\Controllers\Registrations\Property\Areas\PlotFieldController;
use App\Http\Controllers\Registrations\Supplier\BankSupplierController;
use App\Http\Controllers\Registrations\Supplier\DriverController;
use App\Http\Controllers\Registrations\Supplier\LanyardController;
use App\Http\Controllers\Registrations\Supplier\SupplierController;
use App\Http\Controllers\Registrations\Supplier\TypeSupplierController;
use App\Http\Controllers\Registrations\Supplier\WarehouseController;
use App\Http\Controllers\Registrations\Supplier\Contracts\DriverContractController;
use App\Http\Controllers\Registrations\Supplier\Contracts\DriversContractsController;
use App\Http\Controllers\Registrations\Supplier\Contracts\LanyardContractController;
use App\Http\Controllers\Registrations\Supplier\Contracts\LanyardsContractsController;
use App\Http\Controllers\Registrations\Supplier\Contracts\ServiceContractGenerationController;
use App\Http\Controllers\Registrations\Vehicle\FleetBrandController;
use App\Http\Controllers\Registrations\Vehicle\FleetController;
use App\Http\Controllers\Registrations\Vehicle\FleetGroupController;
use App\Http\Controllers\Registrations\Vehicle\FleetModelController;
use Illuminate\Support\Facades\Route;
// Importa o controller de lançamento de OS de defensivos.

use App\Http\Controllers\Releases\Agricultural\Services\Defensive\DefensiveServiceController;
use App\Http\Controllers\Releases\Financial\PayAccountController;
use App\Http\Controllers\Reports\Financial\PaidAccountReportController;

use App\Http\Controllers\Releases\Fuel\FuelStationController;
use App\Http\Controllers\Releases\Fuel\FuelTankController;
use App\Http\Controllers\Releases\Fuel\FuelStationProductController;
use App\Http\Controllers\Releases\Fuel\FuelRegistradoraController;
use App\Http\Controllers\Releases\Fuel\FuelRegistradoraReadingController;
use App\Http\Controllers\Releases\Fuel\FuelStockMovementController;
use App\Http\Controllers\Releases\Fuel\FuelGaugeTableController;
use App\Http\Controllers\Releases\Fuel\FuelEntryController;
use App\Http\Controllers\Releases\Fuel\FuelTransferController;
use App\Http\Controllers\Releases\Fuel\FuelRefuelingController;
use App\Http\Controllers\Releases\Fuel\FuelMeterReadingController;
use App\Http\Controllers\Releases\Fuel\FuelGaugeReadingController;
use App\Http\Controllers\Releases\Fuel\FuelOilChangeController;
use App\Http\Controllers\Releases\Fuel\FleetMaintenancePlanController;
use App\Http\Controllers\Releases\Fuel\FleetMaintenanceRecordController;
use App\Http\Controllers\Releases\Fuel\FuelDashboardController;
use App\Http\Controllers\Releases\Fuel\FuelStockAdjustmentController;
use App\Http\Controllers\Integrations\Scales\ScaleReadingController;
use App\Http\Controllers\Registrations\Grain\GrainCatalogController;
use App\Http\Controllers\Releases\Grain\AuthorizationController;
use App\Http\Controllers\Releases\Grain\BalanceAssignmentController;
use App\Http\Controllers\Releases\Grain\ContractTransferController;
use App\Http\Controllers\Releases\Grain\GrainBalanceController;
use App\Http\Controllers\Releases\Grain\SaleContractController;
use App\Http\Controllers\Releases\Grain\TechnicalLossController;
use App\Http\Controllers\Releases\Grain\WeighingTicketController;
use App\Http\Controllers\Releases\Grain\StockAdjustmentController;
use App\Http\Controllers\Registrations\InventoryCatalogController;
use App\Http\Controllers\Releases\Inventory\ProductStockController;
use App\Http\Controllers\Releases\Inventory\ProductOutputController;
use App\Http\Controllers\Releases\Fiscal\EntryInvoiceController;
use App\Http\Controllers\Releases\Fiscal\FiscalImportController;
use App\Http\Controllers\Releases\Fiscal\FreightController;
use App\Http\Controllers\Releases\Fiscal\PurchaseReturnController;
use App\Http\Controllers\Releases\Agricultural\Services\GeneralAgriculturalServiceController;
use App\Http\Controllers\Releases\Agricultural\Services\SeedTreatmentController;
use App\Http\Controllers\Releases\Agricultural\Workforce\DailyWorkforceBoardController;
use App\Http\Controllers\Releases\Harvest\HarvestReleaseController;
use App\Http\Controllers\Releases\Harvest\HarvestGrainTransferController;
use App\Http\Controllers\Reports\Harvest\HarvestReportController;
use App\Http\Controllers\Releases\Financial\Advances\HarvestAdvanceController;





Route::get('/health', fn () => response()->json(['status' => 'ok', 'service' => 'api', 'framework' => 'laravel']));

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::pattern('inventoryCatalog', 'stock-locations|product-stock-profiles|seed-product-profiles|agricultural-service-types|freight-rates');
    Route::prefix('registrations/inventory')->group(function (): void {
        Route::get('{inventoryCatalog}', [InventoryCatalogController::class, 'index'])->middleware('permission:inventory.stock.view');
        Route::post('{inventoryCatalog}', [InventoryCatalogController::class, 'store'])->middleware('permission:inventory.stock.manage');
        Route::get('{inventoryCatalog}/{id}', [InventoryCatalogController::class, 'show'])->middleware('permission:inventory.stock.view');
        Route::match(['put','patch'], '{inventoryCatalog}/{id}', [InventoryCatalogController::class, 'update'])->middleware('permission:inventory.stock.manage');
        Route::delete('{inventoryCatalog}/{id}', [InventoryCatalogController::class, 'destroy'])->middleware('permission:inventory.stock.manage');
    });

    Route::prefix('releases/inventory')->group(function (): void {
        Route::get('balances', [ProductStockController::class, 'balances'])->middleware('permission:inventory.stock.view');
        Route::get('movements', [ProductStockController::class, 'movements'])->middleware('permission:inventory.audit.view');
        Route::get('product-outputs', [ProductOutputController::class, 'index']);
        Route::post('product-outputs', [ProductOutputController::class, 'store'])->middleware('permission:inventory.output.create');
        Route::get('product-outputs/{output}', [ProductOutputController::class, 'show']);
        Route::post('product-outputs/{output}/confirm', [ProductOutputController::class, 'confirm'])->middleware('permission:inventory.output.confirm');
        Route::post('product-outputs/{output}/returns', [ProductOutputController::class, 'returnLoan'])->middleware('permission:inventory.output.confirm');
    });

    Route::prefix('releases/fiscal')->group(function (): void {
        Route::get('entry-invoices', [EntryInvoiceController::class, 'index']);
        Route::post('entry-invoices', [EntryInvoiceController::class, 'store']);
        Route::get('entry-invoices/{entryInvoice}', [EntryInvoiceController::class, 'show']);
        Route::put('entry-invoices/{entryInvoice}', [EntryInvoiceController::class, 'update']);
        Route::delete('entry-invoices/{entryInvoice}', [EntryInvoiceController::class, 'destroy']);
        Route::post('entry-invoices/{entryInvoice}/confirm', [EntryInvoiceController::class, 'confirm'])->middleware('permission:fiscal.invoice.confirm');
        Route::post('entry-invoices/import/xml/preview', [FiscalImportController::class, 'preview'])->middleware('permission:fiscal.invoice.import_xml');
        Route::post('import-items/{importItem}/link-product', [FiscalImportController::class, 'linkProduct']);
        Route::get('freights', [FreightController::class, 'index']);
        Route::get('freight-payments', [FreightController::class, 'payments']);
        Route::post('freight-payments', [FreightController::class, 'pay'])->middleware('permission:freight.payment.create');
        Route::get('purchase-returns', [PurchaseReturnController::class, 'index']);
        Route::post('purchase-returns', [PurchaseReturnController::class, 'store']);
        Route::get('purchase-returns/{purchaseReturn}', [PurchaseReturnController::class, 'show']);
        Route::post('purchase-returns/{purchaseReturn}/confirm', [PurchaseReturnController::class, 'confirm'])->middleware('permission:fiscal.return.confirm');
    });

    Route::prefix('releases/agricultural')->group(function (): void {
        Route::prefix('workforce/boards')->group(function (): void {
            Route::get('/', [DailyWorkforceBoardController::class, 'index']);
            Route::get('by-date', [DailyWorkforceBoardController::class, 'byDate']);
            Route::post('resolve', [DailyWorkforceBoardController::class, 'resolve']);
            Route::get('{board}', [DailyWorkforceBoardController::class, 'show']);
            Route::put('{board}/workspace', [DailyWorkforceBoardController::class, 'save']);
            Route::get('{board}/history', [DailyWorkforceBoardController::class, 'history']);
        });
        Route::get('services', [GeneralAgriculturalServiceController::class, 'index']);
        Route::post('services', [GeneralAgriculturalServiceController::class, 'store']);
        Route::get('services/{service}', [GeneralAgriculturalServiceController::class, 'show']);
        Route::put('services/{service}', [GeneralAgriculturalServiceController::class, 'update']);
        Route::post('services/{service}/plan', [GeneralAgriculturalServiceController::class, 'plan']);
        Route::post('services/{service}/start', [GeneralAgriculturalServiceController::class, 'start']);
        Route::post('services/{service}/complete', [GeneralAgriculturalServiceController::class, 'complete'])->middleware('permission:agricultural.service.complete');
        Route::get('seed-treatments', [SeedTreatmentController::class, 'index']);
        Route::post('seed-treatments', [SeedTreatmentController::class, 'store']);
        Route::get('seed-treatments/{treatment}', [SeedTreatmentController::class, 'show']);
        Route::post('seed-treatments/{treatment}/complete', [SeedTreatmentController::class, 'complete'])->middleware('permission:agricultural.seed_treatment.complete');
    });

    Route::prefix('releases/harvest')->group(function (): void {
        Route::get('plot-fields', [HarvestReleaseController::class, 'plotFields'])->middleware('permission:harvest.release.manage');
        Route::get('state-registrations', [HarvestReleaseController::class, 'stateRegistrations'])->middleware('permission:harvest.release.manage');
        Route::get('matrix-freight', [HarvestReleaseController::class, 'matrixFreight'])->middleware('permission:harvest.release.manage');
        Route::apiResource('harvest-releases', HarvestReleaseController::class)->middleware('permission:harvest.release.manage');
        Route::get('grain-transfers/eligible-owners', [HarvestGrainTransferController::class, 'eligibleOwners'])
            ->middleware('permission:harvest.release.manage');
        Route::get('grain-transfers/available-balance', [HarvestGrainTransferController::class, 'availableBalance'])
            ->middleware('permission:harvest.release.manage');
        Route::apiResource('grain-transfers', HarvestGrainTransferController::class)
            ->parameters(['grain-transfers' => 'grainTransfer'])
            ->middleware('permission:harvest.release.manage');
    });

    Route::prefix('reports/harvest')->group(function (): void {
        Route::get('productivity/options', [HarvestReportController::class, 'productivityOptions'])
            ->middleware('permission:harvest.release.manage');
        Route::get('crops/{crop}/consolidated', [HarvestReportController::class, 'consolidated'])
            ->middleware('permission:harvest.release.manage');
        Route::get('crops/{crop}/consolidated/pdf', [HarvestReportController::class, 'consolidatedPdf'])
            ->middleware('permission:harvest.release.manage');
        Route::get('crops/{crop}/productivity/plots', [HarvestReportController::class, 'productivityByPlot'])
            ->middleware('permission:harvest.release.manage');
        Route::get('crops/{crop}/productivity/plots/pdf', [HarvestReportController::class, 'productivityByPlotPdf'])
            ->middleware('permission:harvest.release.manage');
        Route::get('crops/{crop}/productivity/farms', [HarvestReportController::class, 'productivityByFarm'])
            ->middleware('permission:harvest.release.manage');
        Route::get('crops/{crop}/productivity/farms/pdf', [HarvestReportController::class, 'productivityByFarmPdf'])
            ->middleware('permission:harvest.release.manage');
        Route::get('crops/{crop}/productivity/varieties', [HarvestReportController::class, 'productivityByVariety'])
            ->middleware('permission:harvest.release.manage');
        Route::get('crops/{crop}/productivity/varieties/pdf', [HarvestReportController::class, 'productivityByVarietyPdf'])
            ->middleware('permission:harvest.release.manage');
        Route::get('crops/{crop}/productivity/harvesters', [HarvestReportController::class, 'productivityByHarvester'])
            ->middleware('permission:harvest.release.manage');
        Route::get('crops/{crop}/productivity/harvesters/pdf', [HarvestReportController::class, 'productivityByHarvesterPdf'])
            ->middleware('permission:harvest.release.manage');
    });

    Route::prefix('releases/financial/advances')->group(function (): void {
        Route::get('harvest', [HarvestAdvanceController::class, 'index'])->middleware('permission:harvest.advance.view');
        Route::get('harvest/eligible-harvesters', [HarvestAdvanceController::class, 'harvesters'])->middleware('permission:harvest.advance.view');
        Route::get('harvest/transporter-suppliers', [HarvestAdvanceController::class, 'transporterSuppliers'])->middleware('permission:harvest.advance.view');
        Route::get('harvest/driver-suppliers', [HarvestAdvanceController::class, 'driverSuppliers'])->middleware('permission:harvest.advance.view');
        Route::post('harvest', [HarvestAdvanceController::class, 'store'])->middleware('permission:harvest.advance.create');
    });

    // Cadastros do módulo de balança e armazém de grãos.
    Route::pattern('catalog', 'scales|scale-channels|warehouses|storage-locations|transport-drivers|transport-trucks|discount-types|impurity-types|technical-loss-configs');
    Route::prefix('registrations/grain')->group(function (): void {
        Route::get('{catalog}', [GrainCatalogController::class, 'index']);
        Route::post('{catalog}', [GrainCatalogController::class, 'store']);
        Route::get('{catalog}/{id}', [GrainCatalogController::class, 'show']);
        Route::match(['put', 'patch'], '{catalog}/{id}', [GrainCatalogController::class, 'update']);
        Route::delete('{catalog}/{id}', [GrainCatalogController::class, 'destroy']);
    });

    Route::prefix('registrations/property/registration')->group(function (): void {
        Route::get('farm-state-registrations', [GrainCatalogController::class, 'index'])->defaults('catalog', 'farm-state-registrations');
        Route::post('farm-state-registrations', [GrainCatalogController::class, 'store'])->defaults('catalog', 'farm-state-registrations');
        Route::get('farm-state-registrations/{id}', [GrainCatalogController::class, 'show'])->defaults('catalog', 'farm-state-registrations');
        Route::match(['put', 'patch'], 'farm-state-registrations/{id}', [GrainCatalogController::class, 'update'])->defaults('catalog', 'farm-state-registrations');
        Route::delete('farm-state-registrations/{id}', [GrainCatalogController::class, 'destroy'])->defaults('catalog', 'farm-state-registrations');
    });

    Route::prefix('integrations/scales')->group(function (): void {
        Route::post('readings', [ScaleReadingController::class, 'store']);
        Route::get('readings/latest', [ScaleReadingController::class, 'latest']);
    });

    Route::prefix('releases/grain')->group(function (): void {
        Route::get('authorizations', [AuthorizationController::class, 'index']);
        Route::post('authorizations', [AuthorizationController::class, 'store']);
        Route::post('authorizations/{authorization}/approve', [AuthorizationController::class, 'approve'])->middleware('role:SUPER,ADM');
        Route::post('authorizations/{authorization}/reject', [AuthorizationController::class, 'reject'])->middleware('role:SUPER,ADM');

        Route::get('tickets', [WeighingTicketController::class, 'index'])->middleware('permission:grain.scale.view');
        Route::post('tickets', [WeighingTicketController::class, 'store'])->middleware('permission:grain.weighing.create');
        Route::get('tickets/{ticket}', [WeighingTicketController::class, 'show'])->middleware('permission:grain.scale.view');
        Route::get('tickets/{ticket}/print-data', [WeighingTicketController::class, 'printData'])->middleware('permission:grain.scale.view');
        Route::post('tickets/{ticket}/capture-weight', [WeighingTicketController::class, 'captureWeight'])->middleware('permission:grain.weighing.capture');
        Route::put('tickets/{ticket}/discounts', [WeighingTicketController::class, 'discounts'])->middleware('permission:grain.discount.inform');
        Route::get('tickets/{ticket}/available-contracts', [WeighingTicketController::class, 'availableContracts'])->middleware('permission:grain.shipment.create');
        Route::post('tickets/{ticket}/close', [WeighingTicketController::class, 'close'])->middleware('permission:grain.weighing.capture');
        Route::post('tickets/{ticket}/cancel', [WeighingTicketController::class, 'cancel'])->middleware('permission:grain.weighing.cancel.authorize');

        Route::get('buyers', [SaleContractController::class, 'buyers']);
        Route::get('contracts', [SaleContractController::class, 'index']);
        Route::post('contracts', [SaleContractController::class, 'store'])->middleware('permission:grain.contract.create');
        Route::get('contracts/{contract}', [SaleContractController::class, 'show']);
        Route::put('contracts/{contract}', [SaleContractController::class, 'update'])->middleware('permission:grain.contract.update.authorize');
        Route::post('contracts/{contract}/status', [SaleContractController::class, 'changeStatus'])->middleware('permission:grain.contract.update.authorize');

        Route::get('contract-transfers', [ContractTransferController::class, 'index']);
        Route::post('contract-transfers', [ContractTransferController::class, 'store'])->middleware('permission:grain.balance.transfer');
        Route::post('contract-transfers/between-contracts', [ContractTransferController::class, 'betweenContracts'])->middleware('permission:grain.balance.transfer');
        Route::post('contract-transfers/{transfer}/reverse', [ContractTransferController::class, 'reverse'])->middleware('permission:grain.balance.transfer.reverse');
        Route::get('balances', [GrainBalanceController::class, 'index'])->middleware('permission:grain.stock.view');
        Route::get('stock-movements', [GrainBalanceController::class, 'movements'])->middleware('permission:grain.stock.view');
        Route::post('stock-adjustments', [StockAdjustmentController::class, 'store'])->middleware('permission:grain.stock.adjust.authorize');
        Route::get('balance-assignments', [BalanceAssignmentController::class, 'index']);
        Route::post('balance-assignments', [BalanceAssignmentController::class, 'store'])->middleware('permission:grain.balance.assignment.authorize');
        Route::get('technical-losses', [TechnicalLossController::class, 'index'])->middleware('permission:grain.technical_loss.view');
        Route::post('technical-losses/process', [TechnicalLossController::class, 'process'])->middleware('permission:grain.technical_loss.process');
        Route::post('technical-losses/{technicalLoss}/reverse', [TechnicalLossController::class, 'reverse'])->middleware('permission:grain.technical_loss.reverse');
    });

    Route::middleware('role:SUPER,ADM')->group(function (): void {
        // Permite importar os CSVs do sistema antigo somente para administradores.
        Route::post('imports/legacy/preview', [LegacyImportController::class, 'preview']);
        Route::post('imports/legacy', [LegacyImportController::class, 'import']);

        Route::apiResource('registrations/admin/roles', RoleController::class);
        Route::apiResource('registrations/admin/users', UserController::class);
        Route::apiResource('users', UserController::class);
        Route::apiResource('registrations/admin/configs', ConfigController::class);
        Route::apiResource('registrations/harvest/agricultural-years', AgriculturalYearController::class);
        Route::apiResource('registrations/harvest/cultures', CultureController::class);
        Route::get('registrations/harvest/crops/{crop}/cultures', [CropController::class, 'cultures']);
        Route::apiResource('registrations/harvest/crops', CropController::class);
        Route::apiResource('registrations/agricultural/defensive/active-ingredients', ActiveIngredientController::class);
        Route::apiResource('registrations/agricultural/defensive/agricultural-operators', AgriculturalOperatorController::class);
        Route::apiResource('registrations/agricultural/defensive/agricultural-products', AgriculturalProductController::class);
        Route::apiResource('registrations/agricultural/defensive/type-formulations', TypeFormulationController::class);
        Route::apiResource('registrations/agricultural/defensive/operation-defensives', OperationDefensiveController::class);
        Route::apiResource('registrations/agricultural/defensive/type-operations', TypeOperationController::class);
        Route::apiResource('registrations/financial/administrative-centers', AdministrativeCenterController::class);
        Route::apiResource('registrations/financial/cost-centers', CostCenterController::class);
        Route::apiResource('registrations/financial/type-pay-accounts', TypePayAccountController::class);
        // Rotas atuais de proprietário/produtor.
        Route::apiResource('registrations/harvest/property/owners', OwnerController::class);
        Route::apiResource('registrations/harvest/property/producers', ProducerController::class);
        // Aliases para o agrupamento Properties.
        Route::apiResource('registrations/properties/owners', OwnerController::class);
        Route::apiResource('registrations/properties/producers', ProducerController::class);
        Route::apiResource('registrations/product/products', ProductController::class);
        Route::apiResource('registrations/product/product-groups', ProductGroupController::class);
        Route::get('/registrations/products/product-groups/{productGroupId}/sub-group-products', [SubGroupProductController::class, 'getSubGroupProductsByProductGroup']);
        Route::apiResource('registrations/product/sub-group-products', SubGroupProductController::class);
        Route::apiResource('registrations/product/supplier-products', SupplierProductController::class);
        // Rotas legadas mantidas para compatibilidade.
        Route::apiResource('registrations/property/areas/farms', FarmController::class);
        Route::apiResource('registrations/property/areas/fields', FieldController::class);
        Route::apiResource('registrations/property/areas/matrix-freights', MatrixFreightController::class);
        Route::apiResource('registrations/property/areas/plot-fields', PlotFieldController::class);

        // Alias canônico com "properties", usado pelo frontend/documentação.
        Route::get('registrations/properties/areas/farms/free_area/{farmId}', [FarmController::class, 'free_area']);
        Route::get('registrations/properties/areas/fields/free_area/{cropId}/{fieldId}', [PlotFieldController::class, 'getFreeAreaByField']);
        Route::get('registrations/properties/areas/plot-fields/culture/{cropId}', [PlotFieldController::class, 'getCultureByCrop']);
        Route::get('registrations/properties/areas/plot-fields/cycle/{varietyId}', [PlotFieldController::class, 'getCycleByVariety']);
        Route::get('registrations/harvest/cultures/varieties/{cultureId}', [PlotFieldController::class, 'getVarietyByCulture']);

        Route::apiResource('registrations/properties/areas/farms', FarmController::class);
        Route::apiResource('registrations/properties/areas/fields', FieldController::class);
        Route::apiResource('registrations/properties/areas/matrix-freights', MatrixFreightController::class);
        Route::apiResource('registrations/properties/areas/plot-fields', PlotFieldController::class);
        Route::get('registrations/supplier/bankSupplier/{idSupplier}', [SupplierController::class, 'listBankSupplier']);
        Route::apiResource('registrations/suppliers/bankSupplier', BankSupplierController::class);
        Route::apiResource('registrations/supplier/drivers', DriverController::class);
        Route::apiResource('registrations/supplier/lanyards', LanyardController::class);
        Route::apiResource('registrations/supplier/suppliers', SupplierController::class);
        Route::apiResource('registrations/supplier/type-suppliers', TypeSupplierController::class);
        Route::apiResource('registrations/supplier/warehouses', WarehouseController::class);
        Route::apiResource('registrations/supplier/contracts/driver-contracts', DriverContractController::class);
        Route::apiResource('registrations/supplier/contracts/drivers-contracts', DriversContractsController::class);
        Route::apiResource('registrations/supplier/contracts/lanyard-contracts', LanyardContractController::class);
        Route::apiResource('registrations/supplier/contracts/lanyards-contracts', LanyardsContractsController::class);
        Route::apiResource('registrations/vehicle/fleet-brands', FleetBrandController::class);
        Route::apiResource('registrations/vehicle/fleets', FleetController::class);
        Route::apiResource('registrations/vehicle/fleet-groups', FleetGroupController::class);
        Route::apiResource('registrations/vehicle/fleet-models', FleetModelController::class);
    });

    // Consulta as variedades vinculadas a uma cultura.
    Route::get('registrations/harvest/cultures/{culture}/varieties', [VarietyCultureController::class, 'byCulture']);
    Route::apiResource('registrations/harvest/varieties', VarietyCultureController::class);

    Route::prefix('releases/financial')->group(function (): void {
        Route::get('pay-accounts/transfers', [PayAccountController::class, 'transfers']);
        Route::post('pay-accounts/payroll', [PayAccountController::class, 'storePayroll']);
        Route::get('pay-accounts/{payAccount}/receipt', [PayAccountController::class, 'receipt']);
        Route::apiResource('pay-accounts', PayAccountController::class)
            ->parameters(['pay-accounts' => 'payAccount']);
    });

    Route::post('registrations/admin/configs/{config}/logo', [ConfigController::class, 'uploadLogo']);
    Route::delete('registrations/admin/configs/{config}/logo', [ConfigController::class, 'deleteLogo']);

    Route::prefix('registrations/supplier/service-contracts')->group(function (): void {
        Route::get('/', [ServiceContractGenerationController::class, 'index']);
        Route::get('{type}/suppliers', [ServiceContractGenerationController::class, 'supplierOptions']);
        Route::get('{type}/suppliers/{supplier}/participants', [ServiceContractGenerationController::class, 'participants']);
        Route::post('{type}/preview-batch', [ServiceContractGenerationController::class, 'preview']);
        Route::post('{type}/generate-batch', [ServiceContractGenerationController::class, 'generate']);
        Route::get('{type}/{contract}/pdf-data', [ServiceContractGenerationController::class, 'pdfData']);
        Route::get('{type}/{contract}/pdf', [ServiceContractGenerationController::class, 'downloadPdf']);
        Route::post('{type}/{contract}/pdf', [ServiceContractGenerationController::class, 'uploadPdf']);
    });

    Route::prefix('reports/financial/paid-accounts')->group(function (): void {
        Route::get('/crop-options', [PaidAccountReportController::class, 'cropOptions']);
        Route::get('/by-crop', [PaidAccountReportController::class, 'byCrop']);
        Route::get('/by-crop/pdf', [PaidAccountReportController::class, 'byCropPdf']);
        Route::get('/', [PaidAccountReportController::class, 'analytical']);
        Route::get('/pdf', [PaidAccountReportController::class, 'analyticalPdf']);
        Route::get('/by-cost-center', [PaidAccountReportController::class, 'byCostCenter']);
        Route::get('/by-cost-center/pdf', [PaidAccountReportController::class, 'byCostCenterPdf']);
    });
    
    // Módulo pai: Serviços Agrícolas. Primeiro submódulo: Defensivo.
    Route::prefix('releases/agricultural/services/defensive')->group(function (): void {
        // Etapa 3: lista somente as safras ativas.
        Route::get('/crops', [DefensiveServiceController::class, 'activeCrops']);
        // Filtra as frotas por função: O=PULVERIZADOR e T=TRATOR.
        Route::get('/fleets/by-function', [DefensiveServiceController::class, 'fleetsByFunction']);
        // Produtos com cadastro agrícola e formulação ativos.
        Route::get('/products', [DefensiveServiceController::class, 'eligibleProducts']);
        // Etapa 3: operadores que possuem função T em OS abertas da safra.
        Route::get('/crops/{crop}/tank-operators', [DefensiveServiceController::class, 'tankOperators']);
        // Etapa 3: datas disponíveis para a safra.
        Route::get('/crops/{crop}/tank-dates', [DefensiveServiceController::class, 'tankDates']);
        // Datas que ainda possuem OS abertas para o tanqueiro selecionado.
        Route::get('/crops/{crop}/tank-operators/{operator}/open-dates', [DefensiveServiceController::class, 'openTankDates']);
        // Etapa 3: consolida produtos, planejamento e saldo atual do tanque.
        Route::get('/crops/{crop}/tank-operators/{operator}/planning', [DefensiveServiceController::class, 'tankPlanning']);
        // Consolida retiradas, utilizações, devoluções e saldo por produto na safra.
        Route::get('/crops/{crop}/tank-operators/{operator}/consolidation', [DefensiveServiceController::class, 'tankConsolidation']);
        // Etapa 3: retirada consolidada do estoque físico para o tanque.
        Route::post('/tank/withdrawal', [DefensiveServiceController::class, 'tankWithdrawal']);
        Route::post('/tank/withdrawals', [DefensiveServiceController::class, 'tankWithdrawal']);
        // Histórico agrupado das retiradas realizadas.
        Route::get('/tank/withdrawals', [DefensiveServiceController::class, 'withdrawals']);
        Route::get('/tank/withdrawals/{withdrawal}', [DefensiveServiceController::class, 'withdrawal']);
        // Lista as ordens de serviço do submódulo Defensivo.
        Route::get('/orders', [DefensiveServiceController::class, 'index']);
        // Cria uma OS por talhão recebido em fields[].
        Route::post('/orders', [DefensiveServiceController::class, 'store']);
        // Realiza fechamento parcial ou final.
        Route::post('/orders/close', [DefensiveServiceController::class, 'close']);
        // Obtém ou cria o tanque diário do operador.
        Route::get('/tank/operator/{operator}', [DefensiveServiceController::class, 'tank']);
        // Retira produto do estoque ou devolve produto ao estoque.
        Route::post('/tank/movement', [DefensiveServiceController::class, 'tankMovement']);
        // Exibe uma OS.
        Route::get('/orders/{order}', [DefensiveServiceController::class, 'show']);
        // Reordena produtos, permitindo mudanças somente dentro da mesma prioridade de formulação.
        Route::patch('/orders/{order}/products/sequence', [DefensiveServiceController::class, 'reorderProducts']);
        // Cria novas OS filhas durante a edição/reemissão.
        Route::post('/orders/{order}/reissue', [DefensiveServiceController::class, 'reissue']);
    });



    // Módulo de combustíveis, lubrificantes, abastecimentos e manutenção de frota.
    Route::prefix('releases/fuel')->group(function (): void {
        Route::apiResource('stations', FuelStationController::class);
        Route::apiResource('tanks', FuelTankController::class);
        Route::apiResource('station-products', FuelStationProductController::class);
        Route::apiResource('registradoras', FuelRegistradoraController::class);
        Route::apiResource('gauge-tables', FuelGaugeTableController::class);
        Route::get('gauge-readings', [FuelGaugeReadingController::class, 'index']);
        Route::post('gauge-readings', [FuelGaugeReadingController::class, 'store']);
        Route::get('registradora-readings', [FuelRegistradoraReadingController::class, 'index']);
        Route::post('registradora-readings', [FuelRegistradoraReadingController::class, 'store']);
        Route::get('entries', [FuelEntryController::class, 'index']);
        Route::post('entries', [FuelEntryController::class, 'store']);
        Route::get('transfers', [FuelTransferController::class, 'index']);
        Route::post('transfers', [FuelTransferController::class, 'store']);
        Route::post('transfers/{transfer}/confirm', [FuelTransferController::class, 'confirm']);
        Route::get('refuelings', [FuelRefuelingController::class, 'index']);
        Route::post('refuelings', [FuelRefuelingController::class, 'store']);
        Route::post('stock-adjustments', [FuelStockAdjustmentController::class, 'store']);
        Route::get('stock-movements', [FuelStockMovementController::class, 'index']);
        Route::get('meter-readings', [FuelMeterReadingController::class, 'index']);
        Route::post('meter-readings', [FuelMeterReadingController::class, 'store']);
        Route::apiResource('oil-changes', FuelOilChangeController::class);
        Route::apiResource('maintenance-plans', FleetMaintenancePlanController::class);
        Route::apiResource('maintenance-records', FleetMaintenanceRecordController::class);
        Route::get('dashboard/reconciliation', [FuelDashboardController::class, 'reconciliation']);
        Route::get('dashboard/consumption', [FuelDashboardController::class, 'consumption']);
    });

});
