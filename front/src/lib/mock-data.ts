function uuid() {
  return crypto.randomUUID();
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface AgriculturalYear {
  id: string;
  name: string;
  opening_date: string;
  closing_date: string;
  status: 'A' | 'I';
}

export interface Culture {
  id: string;
  name: string;
  status: 'A' | 'I';
}

export interface Crop {
  id: string;
  name: string;
  opening_date: string;
  closing_date: string;
  status: 'A' | 'I';
}

export interface VarietyCulture {
  id: string;
  culture_id: string;
  culture_name?: string;
  name: string;
  technology: string;
  cycle: string;
  status: 'A' | 'I';
}

export const mockUsers: User[] = [
  { id: uuid(), name: 'Administrador', email: 'admin@sisdeve.com', role: 'admin' },
  { id: uuid(), name: 'João Silva', email: 'joao@sisdeve.com', role: 'user' },
  { id: uuid(), name: 'Maria Oliveira', email: 'maria@sisdeve.com', role: 'user' },
];

const cultureIds = [uuid(), uuid(), uuid(), uuid()];

export const mockCultures: Culture[] = [
  { id: cultureIds[0], name: 'Soja', status: 'A' },
  { id: cultureIds[1], name: 'Milho', status: 'A' },
  { id: cultureIds[2], name: 'Algodão', status: 'A' },
  { id: cultureIds[3], name: 'Trigo', status: 'I' },
];

export const mockAgriculturalYears: AgriculturalYear[] = [
  { id: uuid(), name: 'Ano Agrícola 2024/2025', opening_date: '2024-07-01', closing_date: '2025-06-30', status: 'A' },
  { id: uuid(), name: 'Ano Agrícola 2023/2024', opening_date: '2023-07-01', closing_date: '2024-06-30', status: 'I' },
  { id: uuid(), name: 'Ano Agrícola 2025/2026', opening_date: '2025-07-01', closing_date: '2026-06-30', status: 'A' },
];

export const mockCrops: Crop[] = [
  { id: uuid(), name: 'Safra Verão 2024/2025', opening_date: '2024-10-01', closing_date: '2025-03-31', status: 'A' },
  { id: uuid(), name: 'Safrinha 2025', opening_date: '2025-02-01', closing_date: '2025-07-31', status: 'A' },
  { id: uuid(), name: 'Safra Verão 2023/2024', opening_date: '2023-10-01', closing_date: '2024-03-31', status: 'I' },
];

export const mockVarieties: VarietyCulture[] = [
  { id: uuid(), culture_id: cultureIds[0], culture_name: 'Soja', name: 'TMG 2381', technology: 'IPRO', cycle: 'Precoce', status: 'A' },
  { id: uuid(), culture_id: cultureIds[0], culture_name: 'Soja', name: 'M8644 IPRO', technology: 'IPRO', cycle: 'Médio', status: 'A' },
  { id: uuid(), culture_id: cultureIds[1], culture_name: 'Milho', name: 'DKB 390', technology: 'VT PRO 3', cycle: 'Precoce', status: 'A' },
  { id: uuid(), culture_id: cultureIds[1], culture_name: 'Milho', name: 'AG 9045', technology: 'VT PRO', cycle: 'Super Precoce', status: 'A' },
  { id: uuid(), culture_id: cultureIds[2], culture_name: 'Algodão', name: 'FM 985 GLTP', technology: 'GLT', cycle: 'Médio', status: 'A' },
  { id: uuid(), culture_id: cultureIds[3], culture_name: 'Trigo', name: 'TBIO Toruk', technology: 'Convencional', cycle: 'Médio', status: 'I' },
];

// Simple in-memory store for CRUD operations
class MockStore<T extends { id: string }> {
  private items: T[];

  constructor(initial: T[]) {
    this.items = [...initial];
  }

  getAll(): T[] {
    return [...this.items];
  }

  getById(id: string): T | undefined {
    return this.items.find(item => item.id === id);
  }

  create(item: Omit<T, 'id'>): T {
    const newItem = { ...item, id: crypto.randomUUID() } as T;
    this.items.push(newItem);
    return newItem;
  }

  update(id: string, data: Partial<T>): T | undefined {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return undefined;
    this.items[index] = { ...this.items[index], ...data };
    return this.items[index];
  }

  delete(id: string): boolean {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return false;
    this.items.splice(index, 1);
    return true;
  }

  count(): number {
    return this.items.length;
  }
}

export const usersStore = new MockStore<User>(mockUsers);
export const agriculturalYearsStore = new MockStore<AgriculturalYear>(mockAgriculturalYears);
export const culturesStore = new MockStore<Culture>(mockCultures);
export const cropsStore = new MockStore<Crop>(mockCrops);
export const varietiesStore = new MockStore<VarietyCulture>(mockVarieties);
