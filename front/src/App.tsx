import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RolesProvider } from "@/contexts/RolesContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AgriculturalYearsList from "@/pages/registrations/crops/agricultural-years/AgriculturalYearsList";
import CulturesList from "@/pages/registrations/crops/cultures/CulturesList";
import CropsList from "@/pages/registrations/crops/crops/CropsList";
import VarietiesList from "@/pages/registrations/crops/varieties/VarietiesList";
import UsersList from "@/pages/registrations/users/UsersList";
import OwnersList from "@/pages/registrations/properties/owners/OwnersList";
import ProducersList from "@/pages/registrations/properties/producers/ProducersList";
import FarmsList from "@/pages/registrations/properties/areas/farms/FarmsList";
import FieldsList from "@/pages/registrations/properties/areas/fields/FieldsList";
import PlotFieldsList from "@/pages/registrations/properties/areas/plot-fields/PlotFieldsList";
import MatrixFreightsList from "@/pages/registrations/properties/areas/matrix-freights/MatrixFreightsList";
import TypeSuppliersList from "@/pages/registrations/suppliers/type-suppliers/TypeSuppliersList";
import SuppliersList from "@/pages/registrations/suppliers/suppliers/SuppliersList";
import WarehousesList from "@/pages/registrations/suppliers/warehouses/WarehousesList";
import LanyardsList from "@/pages/registrations/suppliers/lanyards/LanyardsList";
import DriversList from "@/pages/registrations/suppliers/drivers/DriversList";
import DriverContractsList from "@/pages/registrations/suppliers/contracts/drivers/DriverContractsList";
import LanyardContractsList from "@/pages/registrations/suppliers/contracts/lanyards/LanyardContractsList";
import DriverContractsRelList from "@/pages/registrations/suppliers/contracts/driver-contracts/DriverContractsRelList";
import LanyardContractsRelList from "@/pages/registrations/suppliers/contracts/lanyard-contracts/LanyardContractsRelList";
import TransportContractsGeneratePage from "@/pages/registrations/suppliers/contracts/service-contracts/TransportContractsGeneratePage";
import HarvestContractsGeneratePage from "@/pages/registrations/suppliers/contracts/service-contracts/HarvestContractsGeneratePage";
import GeneratedContractsPage from "@/pages/registrations/suppliers/contracts/service-contracts/GeneratedContractsPage";
import FleetGroupsList from "@/pages/registrations/vehicles/fleet-groups/FleetGroupsList";
import FleetBrandsList from "@/pages/registrations/vehicles/fleet-brands/FleetBrandsList";
import FleetModelsList from "@/pages/registrations/vehicles/fleet-models/FleetModelsList";
import FleetsList from "@/pages/registrations/vehicles/fleets/FleetsList";
import TypeOperationsList from "@/pages/registrations/agricultural/type-operations/TypeOperationsList";
import OperationDefensivesList from "@/pages/registrations/agricultural/operation-defensives/OperationDefensivesList";
import AgriculturalOperatorsList from "@/pages/registrations/agricultural/agricultural-operators/AgriculturalOperatorsList";
import TypeFormulationsList from "@/pages/registrations/agricultural/type-formulations/TypeFormulationsList";
import AgriculturalProductsList from "@/pages/registrations/agricultural/agricultural-products/AgriculturalProductsList";
import ProductGroupsList from "@/pages/registrations/products/product-groups/ProductGroupsList";
import SubGroupProductsList from "@/pages/registrations/products/sub-group-products/SubGroupProductsList";
import PurposeProductsList from "@/pages/registrations/products/purpose-products/PurposeProductsList";
import ProductsList from "@/pages/registrations/products/products/ProductsList";
import SupplierProductsList from "@/pages/registrations/products/supplier-products/SupplierProductsList";
import EntryInvoiceProductsList from "@/pages/entries/products/entry-invoice-products/EntryInvoiceProductsList";
import HarvestReleasesList from "@/pages/entries/harvests/harvest-releases/HarvestReleasesList";
import HarvesterAdvancesPage from "@/pages/entries/financial/advances/HarvesterAdvancesPage";
import TransporterAdvancesPage from "@/pages/entries/financial/advances/TransporterAdvancesPage";

import GrainTransfersList from "@/pages/entries/harvests/grain-transfers/GrainTransfersList";
import PaidAccountsAnalyticalPage from "@/pages/reports/financial/PaidAccountsAnalyticalPage";
import PaidAccountsByCostCenterPage from "@/pages/reports/financial/PaidAccountsByCostCenterPage";
import PaidAccountsByCropPage from "@/pages/reports/financial/PaidAccountsByCropPage";
import HarvestConsolidatedPage from "@/pages/reports/harvest/HarvestConsolidatedPage";
import ProductivityPlotsPage from "@/pages/reports/harvest/ProductivityPlotsPage";
import ProductivityFarmsPage from "@/pages/reports/harvest/ProductivityFarmsPage";
import ProductivityVarietiesPage from "@/pages/reports/harvest/ProductivityVarietiesPage";
import ProductivityHarvestersPage from "@/pages/reports/harvest/ProductivityHarvestersPage";
import DefensiveServicesList from "@/pages/entries/agricultural/defensives/DefensiveServicesList";
import DefensiveServiceOrder from "@/pages/entries/agricultural/defensives/DefensiveServiceOrder";
import OperatorTankPage from "@/pages/entries/agricultural/defensives/OperatorTankPage";
import OperatorTankWithdrawalPrintPage from "@/pages/entries/agricultural/defensives/OperatorTankWithdrawalPrintPage";
import DefensiveClosingsPage from "@/pages/entries/agricultural/defensives/DefensiveClosingsPage";
import DefensiveConsolidationPage from "@/pages/entries/agricultural/defensives/DefensiveConsolidationPage";
import FuelStationsList from "@/pages/entries/fuel/stations/FuelStationsList";
import FuelTanksList from "@/pages/entries/fuel/tanks/FuelTanksList";
import FuelStationProductsList from "@/pages/entries/fuel/station-products/FuelStationProductsList";
import FuelRegistersList from "@/pages/entries/fuel/registers/FuelRegistersList";
import FuelRegisterReadingsList from "@/pages/entries/fuel/registers/FuelRegisterReadingsList";
import FuelGaugeTablePage from "@/pages/entries/fuel/gauge/FuelGaugeTablePage";
import FuelGaugeReadingsList from "@/pages/entries/fuel/gauge/FuelGaugeReadingsList";
import FuelEntriesList from "@/pages/entries/fuel/entries/FuelEntriesList";
import FuelTransfersList from "@/pages/entries/fuel/transfers/FuelTransfersList";
import FuelRefuelingsList from "@/pages/entries/fuel/refuelings/FuelRefuelingsList";
import FuelStockMovementsPage from "@/pages/entries/fuel/stock/FuelStockMovementsPage";
import FuelStockAdjustmentsList from "@/pages/entries/fuel/stock/FuelStockAdjustmentsList";
import FuelReconciliationPage from "@/pages/entries/fuel/reconciliation/FuelReconciliationPage";
import FuelConsumptionPage from "@/pages/entries/fuel/consumption/FuelConsumptionPage";
import FleetMeterReadingsList from "@/pages/entries/fleet/meter-readings/FleetMeterReadingsList";
import FleetOilChangesList from "@/pages/entries/fleet/oil-changes/FleetOilChangesList";
import FleetMaintenancePlansList from "@/pages/entries/fleet/maintenance/FleetMaintenancePlansList";
import FleetMaintenanceRecordsList from "@/pages/entries/fleet/maintenance/FleetMaintenanceRecordsList";
import TypePayAccountsList from "@/pages/registrations/financial/type-pay-accounts/TypePayAccountsList";
import PayAccountsList from "@/pages/entries/financial/pay-accounts/PayAccountsList";
import FinancialTransfersPage from "@/pages/entries/financial/transfers/FinancialTransfersPage";
import PayrollList from "@/pages/entries/financial/payroll/PayrollList";
import AdministrativeCentersList from "@/pages/registrations/financial/administrative-centers/AdministrativeCentersList";
import CostCentersList from "@/pages/registrations/financial/cost-centers/CostCentersList";
import RolesList from "@/pages/registrations/admin/roles/RolesList";
import AdminUsersList from "@/pages/registrations/admin/users/AdminUsersList";
import ProfilePage from "@/pages/profile/ProfilePage";
import ConfigsList from "@/pages/registrations/admin/configs/ConfigsList";
import LegacyImportPage from "@/pages/registrations/admin/imports/LegacyImportPage";
import StockLocationsList from "@/pages/registrations/inventory/StockLocationsList";
import ProductStockProfilesList from "@/pages/registrations/inventory/ProductStockProfilesList";
import SeedProductProfilesList from "@/pages/registrations/inventory/SeedProductProfilesList";
import AgriculturalServiceTypesList from "@/pages/registrations/inventory/AgriculturalServiceTypesList";
import FreightRatesList from "@/pages/registrations/inventory/FreightRatesList";
import GrainScalesList from "@/pages/registrations/grain/GrainScalesList";
import GrainScaleChannelsList from "@/pages/registrations/grain/GrainScaleChannelsList";
import GrainWarehousesList from "@/pages/registrations/grain/GrainWarehousesList";
import GrainStorageLocationsList from "@/pages/registrations/grain/GrainStorageLocationsList";
import GrainTransportDriversList from "@/pages/registrations/grain/GrainTransportDriversList";
import GrainTransportTrucksList from "@/pages/registrations/grain/GrainTransportTrucksList";
import FarmStateRegistrationsList from "@/pages/registrations/grain/FarmStateRegistrationsList";
import GrainDiscountTypesList from "@/pages/registrations/grain/GrainDiscountTypesList";
import GrainImpurityTypesList from "@/pages/registrations/grain/GrainImpurityTypesList";
import GrainTechnicalLossConfigsList from "@/pages/registrations/grain/GrainTechnicalLossConfigsList";
import ScaleDashboardPage from "@/pages/entries/grain/ScaleDashboardPage";
import GrainTicketsList from "@/pages/entries/grain/GrainTicketsList";
import GrainReceivingPage from "@/pages/entries/grain/GrainReceivingPage";
import GrainShippingPage from "@/pages/entries/grain/GrainShippingPage";
import GrainImpurityOutputsPage from "@/pages/entries/grain/GrainImpurityOutputsPage";
import GrainContractsList from "@/pages/entries/grain/GrainContractsList";
import GrainContractTransfersPage from "@/pages/entries/grain/GrainContractTransfersPage";
import GrainBalanceAssignmentsPage from "@/pages/entries/grain/GrainBalanceAssignmentsPage";
import GrainBalancesPage from "@/pages/entries/grain/GrainBalancesPage";
import GrainStockMovementsPage from "@/pages/entries/grain/GrainStockMovementsPage";
import GrainStockAdjustmentsPage from "@/pages/entries/grain/GrainStockAdjustmentsPage";
import GrainTechnicalLossesPage from "@/pages/entries/grain/GrainTechnicalLossesPage";
import GrainAuthorizationsPage from "@/pages/entries/grain/GrainAuthorizationsPage";
import EntryInvoicesPage from "@/pages/entries/fiscal/EntryInvoicesPage";
import FiscalFreightsPage from "@/pages/entries/fiscal/FiscalFreightsPage";
import FreightPaymentsPage from "@/pages/entries/fiscal/FreightPaymentsPage";
import PurchaseReturnsPage from "@/pages/entries/fiscal/PurchaseReturnsPage";
import InventoryBalancesPage from "@/pages/entries/inventory/InventoryBalancesPage";
import InventoryMovementsPage from "@/pages/entries/inventory/InventoryMovementsPage";
import ProductOutputsPage from "@/pages/entries/inventory/ProductOutputsPage";
import SoilPreparationPage from './pages/entries/agricultural/services/SoilPreparationPage';
import InputApplicationPage from './pages/entries/agricultural/services/InputApplicationPage';
import FirebreakMaintenancePage from './pages/entries/agricultural/services/FirebreakMaintenancePage';
import SeedTreatmentsPage from './pages/entries/agricultural/seed-treatments/SeedTreatmentsPage';
import WorkforceBoardPage from './pages/entries/agricultural/workforce/WorkforceBoardPage';
import GrainTicketPrintPage from "@/pages/entries/grain/GrainTicketPrintPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RolesProvider>
        <AuthProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/auth/login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              {/* Safras */}
              <Route path="/registrations/harvest/agricultural-years" element={<AgriculturalYearsList />} />
              <Route path="/registrations/harvest/cultures" element={<CulturesList />} />
              <Route path="/registrations/harvest/crops" element={<CropsList />} />
              <Route path="/registrations/harvest/varieties" element={<VarietiesList />} />
              {/* Propriedades */}
              <Route path="/registrations/properties/owners" element={<OwnersList />} />
              <Route path="/registrations/properties/producers" element={<ProducersList />} />
              <Route path="/registrations/properties/areas/farms" element={<FarmsList />} />
              <Route path="/registrations/properties/areas/fields" element={<FieldsList />} />
              <Route path="/registrations/properties/areas/plot-fields" element={<PlotFieldsList />} />
              <Route path="/registrations/properties/areas/matrix-freights" element={<MatrixFreightsList />} />
              {/* Fornecedores */}
              <Route path="/registrations/suppliers/type-suppliers" element={<TypeSuppliersList />} />
              <Route path="/registrations/suppliers/suppliers" element={<SuppliersList />} />
              <Route path="/registrations/suppliers/warehouses" element={<WarehousesList />} />
              <Route path="/registrations/suppliers/lanyards" element={<LanyardsList />} />
              <Route path="/registrations/suppliers/drivers" element={<DriversList />} />
              <Route path="/registrations/suppliers/contracts/drivers" element={<DriverContractsList />} />
              <Route path="/registrations/suppliers/contracts/lanyards" element={<LanyardContractsList />} />
              <Route path="/registrations/suppliers/contracts/driver-contracts" element={<DriverContractsRelList />} />
              <Route path="/registrations/suppliers/contracts/lanyard-contracts" element={<LanyardContractsRelList />} />
              <Route path="/registrations/suppliers/contracts/service-contracts/transport" element={<TransportContractsGeneratePage />} />
              <Route path="/registrations/suppliers/contracts/service-contracts/harvest" element={<HarvestContractsGeneratePage />} />
              <Route path="/registrations/suppliers/contracts/service-contracts/generated" element={<GeneratedContractsPage />} />
              {/* Veículos */}
              <Route path="/registrations/vehicles/fleet-groups" element={<FleetGroupsList />} />
              <Route path="/registrations/vehicles/fleet-brands" element={<FleetBrandsList />} />
              <Route path="/registrations/vehicles/fleet-models" element={<FleetModelsList />} />
              <Route path="/registrations/vehicles/fleets" element={<FleetsList />} />
              {/* Agrícolas */}
              <Route path="/registrations/agricultural/operation-defensives" element={<OperationDefensivesList />} />
              <Route path="/registrations/agricultural/type-operations" element={<TypeOperationsList />} />
              <Route path="/registrations/agricultural/agricultural-operators" element={<AgriculturalOperatorsList />} />
              <Route path="/registrations/agricultural/type-formulations" element={<TypeFormulationsList />} />
              <Route path="/registrations/agricultural/agricultural-products" element={<AgriculturalProductsList />} />
              {/* Produtos */}
              <Route path="/registrations/products/product-groups" element={<ProductGroupsList />} />
              <Route path="/registrations/products/sub-group-products" element={<SubGroupProductsList />} />
              <Route path="/registrations/products/purpose-products" element={<PurposeProductsList />} />
              <Route path="/registrations/products/products" element={<ProductsList />} />
              <Route path="/registrations/products/supplier-products" element={<SupplierProductsList />} />
              {/* Combustíveis */}
              {/* Financeiro */}
              <Route path="/registrations/financial/administrative-centers" element={<AdministrativeCentersList />} />
              <Route path="/registrations/financial/cost-centers" element={<CostCentersList />} />
              <Route path="/registrations/financial/type-pay-accounts" element={<TypePayAccountsList />} />
              {/* Administração */}
              <Route path="/registrations/admin/roles" element={<RolesList />} />
              <Route path="/registrations/admin/users" element={<AdminUsersList />} />
              <Route path="/registrations/admin/configs" element={<ConfigsList />} />
              <Route path="/registrations/admin/imports" element={<LegacyImportPage />} />
              {/* Lançamentos - Produtos */}
              <Route path="/entries/products/entry-invoice-products" element={<EntryInvoiceProductsList />} />
              {/* Lançamentos - Combustíveis */}
              {/* Lançamentos - Colheitas */}
              <Route path="/entries/harvests/harvest-releases" element={<HarvestReleasesList />} />
              <Route path="/entries/harvests/grain-transfers" element={<GrainTransfersList />} />
              {/* Lançamentos - Financeiro / Adiantamentos */}
              <Route path="/entries/financial/advances/harvesters" element={<HarvesterAdvancesPage />} />
              <Route path="/entries/financial/advances/transporters" element={<TransporterAdvancesPage />} />
              <Route path="/entries/harvests/advances/harvesters" element={<Navigate to="/entries/financial/advances/harvesters" replace />} />
              <Route path="/entries/harvests/advances/drivers" element={<Navigate to="/entries/financial/advances/transporters" replace />} />

              {/* Relatórios */}
              <Route path="/reports/financial/paid-accounts" element={<PaidAccountsAnalyticalPage />} />
              <Route path="/reports/financial/paid-accounts/by-cost-center" element={<PaidAccountsByCostCenterPage />} />
              <Route path="/reports/financial/paid-accounts/by-crop" element={<PaidAccountsByCropPage />} />
              <Route path="/reports/harvest/consolidated" element={<HarvestConsolidatedPage />} />
              <Route path="/reports/harvest/productivity/plots" element={<ProductivityPlotsPage />} />
              <Route path="/reports/harvest/productivity/farms" element={<ProductivityFarmsPage />} />
              <Route path="/reports/harvest/productivity/varieties" element={<ProductivityVarietiesPage />} />
              <Route path="/reports/harvest/productivity/harvesters" element={<ProductivityHarvestersPage />} />
              {/* Lançamentos - Financeiro */}
              <Route path="/entries/financial/pay-accounts" element={<PayAccountsList />} />
              <Route path="/entries/financial/transfers" element={<FinancialTransfersPage />} />
              <Route path="/entries/financial/payroll" element={<PayrollList />} />
              {/* Lançamentos - Agrícola */}
              <Route path="/entries/agricultural/defensives" element={<DefensiveServicesList />} />
              <Route path="/entries/agricultural/defensives/order/:id" element={<DefensiveServiceOrder />} />
              <Route path="/entries/agricultural/tanks" element={<OperatorTankPage />} />
              <Route path="/entries/agricultural/tanks/withdrawals/:id/print" element={<OperatorTankWithdrawalPrintPage />} />
              <Route path="/entries/agricultural/defensives/closings" element={<DefensiveClosingsPage />} />
              <Route path="/entries/agricultural/defensives/consolidation" element={<DefensiveConsolidationPage />} />
              {/* Lançamentos - Combustíveis e Lubrificantes */}
              <Route path="/entries/fuel/stations" element={<FuelStationsList />} />
              <Route path="/entries/fuel/station-tanks" element={<FuelTanksList />} />
              <Route path="/entries/fuel/station-products" element={<FuelStationProductsList />} />
              <Route path="/entries/fuel/registers" element={<FuelRegistersList />} />
              <Route path="/entries/fuel/register-readings" element={<FuelRegisterReadingsList />} />
              <Route path="/entries/fuel/gauge" element={<FuelGaugeTablePage />} />
              <Route path="/entries/fuel/gauge-readings" element={<FuelGaugeReadingsList />} />
              <Route path="/entries/fuel/fuel-entries" element={<FuelEntriesList />} />
              <Route path="/entries/fuel/transfers" element={<FuelTransfersList />} />
              <Route path="/entries/fuel/refuelings" element={<FuelRefuelingsList />} />
              <Route path="/entries/fuel/stock-movements" element={<FuelStockMovementsPage />} />
              <Route path="/entries/fuel/stock-adjustments" element={<FuelStockAdjustmentsList />} />
              <Route path="/entries/fuel/reconciliation" element={<FuelReconciliationPage />} />
              <Route path="/entries/fuel/consumption" element={<FuelConsumptionPage />} />
              {/* Lançamentos - Frota */}
              <Route path="/entries/fleet/meter-readings" element={<FleetMeterReadingsList />} />
              <Route path="/entries/fleet/oil-changes" element={<FleetOilChangesList />} />
              <Route path="/entries/fleet/maintenance-plans" element={<FleetMaintenancePlansList />} />
              <Route path="/entries/fleet/maintenance-records" element={<FleetMaintenanceRecordsList />} />
              {/* Cadastros - Estoque */}
              <Route path="/registrations/inventory/stock-locations" element={<StockLocationsList />} />
              <Route path="/registrations/inventory/product-stock-profiles" element={<ProductStockProfilesList />} />
              <Route path="/registrations/inventory/seed-product-profiles" element={<SeedProductProfilesList />} />
              <Route path="/registrations/inventory/agricultural-service-types" element={<AgriculturalServiceTypesList />} />
              <Route path="/registrations/inventory/freight-rates" element={<FreightRatesList />} />
              {/* Lançamentos - Serviços Agrícolas */}
              <Route path="/entries/agricultural/services/soil-preparation" element={<SoilPreparationPage />} />
              <Route path="/entries/agricultural/services/input-application" element={<InputApplicationPage />} />
              <Route path="/entries/agricultural/services/firebreak-maintenance" element={<FirebreakMaintenancePage />} />
              <Route path="/entries/agricultural/seed-treatments" element={<SeedTreatmentsPage />} />
              <Route path="/entries/agricultural/workforce" element={<WorkforceBoardPage />} />
              {/* Cadastros - Balança e Armazém */}
              <Route path="/registrations/grain/scales" element={<GrainScalesList />} />
              <Route path="/registrations/grain/scale-channels" element={<GrainScaleChannelsList />} />
              <Route path="/registrations/grain/warehouses" element={<GrainWarehousesList />} />
              <Route path="/registrations/grain/storage-locations" element={<GrainStorageLocationsList />} />
              <Route path="/registrations/grain/transport-drivers" element={<GrainTransportDriversList />} />
              <Route path="/registrations/grain/transport-trucks" element={<GrainTransportTrucksList />} />
              <Route path="/registrations/grain/farm-state-registrations" element={<FarmStateRegistrationsList />} />
              <Route path="/registrations/grain/discount-types" element={<GrainDiscountTypesList />} />
              <Route path="/registrations/grain/impurity-types" element={<GrainImpurityTypesList />} />
              <Route path="/registrations/grain/technical-loss-configs" element={<GrainTechnicalLossConfigsList />} />
              {/* Lançamentos - Balança e Armazém */}
              <Route path="/entries/grain/panel" element={<ScaleDashboardPage />} />
              <Route path="/entries/grain/tickets" element={<GrainTicketsList />} />
              <Route path="/entries/grain/tickets/:id/print" element={<GrainTicketPrintPage />} />
              <Route path="/entries/grain/receiving" element={<GrainReceivingPage />} />
              <Route path="/entries/grain/shipping" element={<GrainShippingPage />} />
              <Route path="/entries/grain/impurity-outputs" element={<GrainImpurityOutputsPage />} />
              <Route path="/entries/grain/contracts" element={<GrainContractsList />} />
              <Route path="/entries/grain/contract-transfers" element={<GrainContractTransfersPage />} />
              <Route path="/entries/grain/balance-assignments" element={<GrainBalanceAssignmentsPage />} />
              <Route path="/entries/grain/balances" element={<GrainBalancesPage />} />
              <Route path="/entries/grain/stock-movements" element={<GrainStockMovementsPage />} />
              <Route path="/entries/grain/stock-adjustments" element={<GrainStockAdjustmentsPage />} />
              <Route path="/entries/grain/technical-losses" element={<GrainTechnicalLossesPage />} />
              <Route path="/entries/grain/authorizations" element={<GrainAuthorizationsPage />} />
              {/* Lançamentos - Notas Fiscais e Estoque */}
              <Route path="/entries/fiscal/entry-invoices" element={<EntryInvoicesPage />} />
              <Route path="/entries/fiscal/entry-invoices/fuel" element={<EntryInvoicesPage entryType="FUEL" />} />
              <Route path="/entries/fiscal/entry-invoices/lubricant" element={<EntryInvoicesPage entryType="LUBRICANT" />} />
              <Route path="/entries/fiscal/entry-invoices/defensive" element={<EntryInvoicesPage entryType="DEFENSIVE" />} />
              <Route path="/entries/fiscal/entry-invoices/input" element={<EntryInvoicesPage entryType="INPUT" />} />
              <Route path="/entries/fiscal/entry-invoices/general" element={<EntryInvoicesPage entryType="GENERAL" />} />
              <Route path="/entries/fiscal/entry-invoices/seed" element={<EntryInvoicesPage entryType="SEED" />} />
              <Route path="/entries/fiscal/freights" element={<FiscalFreightsPage />} />
              <Route path="/entries/fiscal/freight-payments" element={<FreightPaymentsPage />} />
              <Route path="/entries/fiscal/purchase-returns" element={<PurchaseReturnsPage />} />
              <Route path="/entries/inventory/balances" element={<InventoryBalancesPage />} />
              <Route path="/entries/inventory/movements" element={<InventoryMovementsPage />} />
              <Route path="/entries/inventory/product-outputs" element={<ProductOutputsPage />} />
              {/* Usuários */}
              <Route path="/users" element={<UsersList />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </RolesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
