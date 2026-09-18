import { describe, expect, it } from 'vitest';
import {
  filterNavigationByRole,
  flattenNavigation,
  navigation,
  normalizeSearchText,
  containsPath,
} from './index';

const hasRole = (...roles: string[]) => (...required: string[]) =>
  required.some((role) => roles.includes(role));

describe('navegação', () => {
  it('não expõe Usuários fora de Administração', () => {
    const users = flattenNavigation(navigation).filter(
      ({ item }) => item.path === '/users' || (item.title === 'Usuários' && !item.hidden),
    );
    expect(users).toHaveLength(1);
    expect(users[0].trail[0].id).toBe('administration');
  });

  it('mantém o nome Locação de Talhões', () => {
    const titles = flattenNavigation(navigation).map(({ item }) => item.title);
    expect(titles).toContain('Locação de Talhões');
  });

  it('esconde Administração de usuários comuns e não deixa grupos vazios', () => {
    const forUser = filterNavigationByRole(navigation, hasRole('USR'));
    expect(forUser.some((item) => item.id === 'administration')).toBe(false);
    const empty = flattenNavigation(forUser).filter(
      ({ item }) => item.children && item.children.length === 0,
    );
    expect(empty).toHaveLength(0);
  });

  it('mostra Perfis somente para SUPER', () => {
    const adm = filterNavigationByRole(navigation, hasRole('ADM'));
    const admIds = flattenNavigation(adm).map(({ item }) => item.id);
    expect(admIds).not.toContain('administration.roles');

    const sup = filterNavigationByRole(navigation, hasRole('SUPER'));
    const supIds = flattenNavigation(sup).map(({ item }) => item.id);
    expect(supIds).toContain('administration.roles');
  });

  it('reconhece a árvore ativa da rota atual', () => {
    const releases = navigation.find((item) => item.id === 'releases')!;
    expect(containsPath(releases, '/entries/agricultural/tanks')).toBe(true);
    expect(containsPath(releases, '/reports/harvest/consolidated')).toBe(false);
  });

  it('pesquisa ignorando acentos e maiúsculas', () => {
    const query = normalizeSearchText('OPERACOES agricolas');
    const found = flattenNavigation(navigation).filter(({ item }) =>
      normalizeSearchText(item.title).includes(query),
    );
    expect(found.length).toBeGreaterThan(0);
  });
});
