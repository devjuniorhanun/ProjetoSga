import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import api from './api';
import {
  agriculturalYearsService,
  cropsService,
  culturesService,
  farmsService,
  fieldsService,
  matrixFreightsService,
  ownersService,
  plotFieldsService,
  producersService,
  suppliersService,
  usersService,
  varietiesService,
  driversService,
  lanyardsService,
  typeSuppliersService,
  warehousesService,
} from './api-services';
import { rolesService, adminUsersService, configsService } from './api-services-admin';
import {
  contractDriversService,
  contractLanyardsService,
  driverContractsService,
  lanyardContractsService,
} from './api-services-contracts';
import { bankSuppliersService } from './api-services-bank';
import {
  productGroupsService,
  productsService,
  subGroupProductsService,
  supplierProductsService,
} from './api-services-products';
import {
  INVENTORY_BASE,
  agriculturalServiceTypesService,
  freightRatesService,
  stockLocationsService,
} from './api-services-inventory';
import { AUTH_ENDPOINTS, systemService } from './api-services-system';

describe('rotas canônicas do backend', () => {
  it('administração', () => {
    expect(rolesService.endpoint).toBe('/registrations/admin/roles');
    expect(adminUsersService.endpoint).toBe('/registrations/admin/users');
    expect(configsService.endpoint).toBe('/registrations/admin/configs');
    expect(usersService.endpoint).toBe('/registrations/admin/users');
  });

  it('safras e propriedades', () => {
    expect(agriculturalYearsService.endpoint).toBe('/registrations/harvest/agricultural-years');
    expect(culturesService.endpoint).toBe('/registrations/harvest/cultures');
    expect(cropsService.endpoint).toBe('/registrations/harvest/crops');
    expect(varietiesService.endpoint).toBe('/registrations/harvest/varieties');
    expect(ownersService.endpoint).toBe('/registrations/properties/owners');
    expect(producersService.endpoint).toBe('/registrations/properties/producers');
    expect(farmsService.endpoint).toBe('/registrations/properties/areas/farms');
    expect(fieldsService.endpoint).toBe('/registrations/properties/areas/fields');
    expect(plotFieldsService.endpoint).toBe('/registrations/properties/areas/plot-fields');
    expect(matrixFreightsService.endpoint).toBe('/registrations/properties/areas/matrix-freights');
  });

  it('produtos e fornecedores', () => {
    expect(productsService.endpoint).toBe('/registrations/product/products');
    expect(productGroupsService.endpoint).toBe('/registrations/product/product-groups');
    expect(subGroupProductsService.endpoint).toBe('/registrations/product/sub-group-products');
    expect(supplierProductsService.endpoint).toBe('/registrations/product/supplier-products');
    expect(suppliersService.endpoint).toBe('/registrations/supplier/suppliers');
    expect(typeSuppliersService.endpoint).toBe('/registrations/supplier/type-suppliers');
    expect(driversService.endpoint).toBe('/registrations/supplier/drivers');
    expect(lanyardsService.endpoint).toBe('/registrations/supplier/lanyards');
    expect(warehousesService.endpoint).toBe('/registrations/supplier/warehouses');
  });

  it('contratos e bancos', () => {
    expect(contractDriversService.endpoint).toBe('/registrations/supplier/contracts/drivers-contracts');
    expect(contractLanyardsService.endpoint).toBe('/registrations/supplier/contracts/lanyards-contracts');
    expect(driverContractsService.endpoint).toBe('/registrations/supplier/contracts/driver-contracts');
    expect(lanyardContractsService.endpoint).toBe('/registrations/supplier/contracts/lanyard-contracts');
    expect(bankSuppliersService.lookupEndpoint).toBe('/registrations/supplier/bankSupplier');
    expect(bankSuppliersService.endpoint).toBe('/registrations/suppliers/bankSupplier');
  });

  it('catálogos de estoque', () => {
    expect(INVENTORY_BASE).toBe('/registrations/inventory');
    expect(stockLocationsService.endpoint).toBe('/registrations/inventory/stock-locations');
    expect(agriculturalServiceTypesService.endpoint).toBe(
      '/registrations/inventory/agricultural-service-types',
    );
    expect(freightRatesService.endpoint).toBe('/registrations/inventory/freight-rates');
  });

  it('autenticação e healthcheck', async () => {
    expect(AUTH_ENDPOINTS).toEqual({
      login: '/auth/login',
      me: '/auth/me',
      logout: '/auth/logout',
      health: '/health',
    });
    vi.mocked(api.get).mockResolvedValue({ data: { status: 'ok' } });
    await expect(systemService.health()).resolves.toEqual({ status: 'ok' });
    expect(api.get).toHaveBeenCalledWith('/health');
  });
});

describe('catálogos de estoque', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lê listas simples, Resource e paginadas', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: { data: [{ id: 1 }], current_page: 2 } } });
    const page = await stockLocationsService.list({ per_page: 25 });
    expect(page.items).toHaveLength(1);
    expect(page.meta?.current_page).toBe(2);
  });
});
