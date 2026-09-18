import { describe, expect, it } from 'vitest';
import { filterMonetaryTypePayAccounts, isMonetaryPayAccountType } from './report-monetary';

describe('tipos monetários dos relatórios financeiros', () => {
  it('aceita apenas as abreviações monetárias oficiais', () => {
    ['BO', 'TR', 'DI', 'CH', 'CHQ', 'CQ', 'LG'].forEach((abbr) => {
      expect(isMonetaryPayAccountType(abbr)).toBe(true);
    });
    expect(isMonetaryPayAccountType('lg')).toBe(true);
    expect(isMonetaryPayAccountType('OL')).toBe(false);
    expect(isMonetaryPayAccountType('SC')).toBe(false);
    expect(isMonetaryPayAccountType(undefined)).toBe(false);
  });

  it('remove tipos físicos e inativos das opções de filtro', () => {
    const types = [
      { id: '1', abbreviation: 'TR', status: 'A' },
      { id: '2', abbreviation: 'OL', status: 'A' },
      { id: '3', abbreviation: 'CH', status: 'I' },
      { id: '4', abbreviation: 'LG', status: 'A' },
    ];
    expect(filterMonetaryTypePayAccounts(types).map((t) => t.id)).toEqual(['1', '4']);
  });
});
