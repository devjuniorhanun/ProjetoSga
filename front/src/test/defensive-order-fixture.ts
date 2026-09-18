import type { AgriculturalDefensiveOrder } from '@/lib/api-services-entries';

export const sampleDefensiveOrder: AgriculturalDefensiveOrder = {
  id: '42',
  os_number: 'OS-2026-0042',
  crop_id: '1',
  culture_id: '2',
  type_operation_id: '3',
  crop_name: 'Safra 2026',
  type_operation_name: 'Pulverização',
  application_date: '2026-09-15T12:00:00',
  pump_volume: 1500,
  flow: 12.3456,
  pump_capacity: 20,
  recommended_pump: 10.25,
  used_bomb: 2.5,
  difference_bomb: 1.2349,
  closing_date: '2026-09-16',
  area: 45.125,
  field_name: 'Talhão Norte',
  status: 'A',
  products: [
    { product_id: '2', product_name: 'Produto B', dose: 1, pump: 2.5, order: 20 },
    { product_id: '1', product_name: 'Produto A', dose: 1, pump: 1.25, order: 10 },
  ],
  operators: [
    { operator_id: '10', fleet_id: '100', operator_name: 'Tanqueiro Um', fleet_name: 'Trator 01', function: 'T' },
    { operator_id: '11', fleet_id: '101', operator_name: 'Aplicador Um', fleet_name: 'Uniport 01', function: 'O' },
    { operator_id: '12', fleet_id: '102', operator_name: 'Tanqueiro Dois', fleet_name: 'Trator 02', function: 'T' },
    { operator_id: '13', fleet_id: '103', operator_name: 'Aplicador Dois', fleet_name: 'Uniport 02', function: 'O' },
  ],
};