import { describe, expect, it } from 'vitest';
import {
  assignEmployee,
  availableEmployees,
  buildWorkspacePayload,
  coverageVariant,
  createManualOperation,
  isSuggestionAdded,
  moveOperation,
  reorderOperations,
  toLocalOperations,
  workspaceSignature,
} from './workforce-rules';
import type { WorkforceOperation } from '@/types/workforce';

const base: WorkforceOperation[] = [
  {
    id: '10',
    source_type: 'GENERAL',
    source_id: '25',
    agricultural_service_type_id: '4',
    title: 'Aplicação de calcário',
    description: null,
    required_employees: 5,
    display_order: 1,
    employee_ids: ['12', '18'],
  },
  {
    id: '11',
    source_type: 'MANUAL',
    source_id: null,
    title: 'Organização do armazém',
    description: null,
    required_employees: 2,
    display_order: 0,
    employee_ids: ['7'],
  },
];

describe('workforce-rules', () => {
  it('ordena operações por display_order e cria chaves estáveis', () => {
    const ops = toLocalOperations(base);
    expect(ops.map((o) => o.title)).toEqual(['Organização do armazém', 'Aplicação de calcário']);
    expect(ops[0].key).toBe('op-11');
  });

  it('mantém o funcionário em apenas uma operação', () => {
    const ops = toLocalOperations(base);
    const moved = assignEmployee(ops, '12', 'op-11');
    expect(moved.find((o) => o.key === 'op-11')?.employee_ids).toContain('12');
    expect(moved.find((o) => o.key === 'op-10')?.employee_ids).not.toContain('12');
  });

  it('devolve o funcionário para disponíveis', () => {
    const ops = assignEmployee(toLocalOperations(base), '7', null);
    const available = availableEmployees(
      [
        { id: '7', name: 'João' },
        { id: '12', name: 'Maria' },
        { id: '99', name: 'Ana' },
      ],
      ops,
    );
    expect(available.map((e) => e.id).sort()).toEqual(['7', '99']);
  });

  it('reordena operações reescrevendo display_order', () => {
    const ops = toLocalOperations(base);
    const moved = moveOperation(ops, 'op-10', -1);
    expect(moved.map((o) => o.key)).toEqual(['op-10', 'op-11']);
    expect(moved.map((o) => o.display_order)).toEqual([0, 1]);
    expect(reorderOperations(ops, 'op-11', 'op-10').map((o) => o.key)).toEqual(['op-10', 'op-11']);
  });

  it('impede duplicidade de sugestões', () => {
    const ops = toLocalOperations(base);
    expect(isSuggestionAdded(ops, { source_type: 'GENERAL', source_id: '25', title: 'x' })).toBe(true);
    expect(isSuggestionAdded(ops, { source_type: 'DEFENSIVE', source_id: '25', title: 'x' })).toBe(false);
  });

  it('classifica a cobertura sem bloquear excedente', () => {
    expect(coverageVariant(2, 5)).toBe('below');
    expect(coverageVariant(7, 5)).toBe('ok');
    expect(coverageVariant(3, null)).toBe('neutral');
  });

  it('monta o payload completo com display_order sequencial', () => {
    const ops = [...toLocalOperations(base), createManualOperation({ title: ' Limpeza ' }, 2)];
    const payload = buildWorkspacePayload(3, ' Distribuição ', ops);
    expect(payload.version).toBe(3);
    expect(payload.notes).toBe('Distribuição');
    expect(payload.operations.map((o) => o.display_order)).toEqual([0, 1, 2]);
    expect(payload.operations[2]).toMatchObject({ id: null, source_type: 'MANUAL', source_id: null, title: 'Limpeza' });
  });

  it('detecta alterações não salvas pela assinatura', () => {
    const ops = toLocalOperations(base);
    expect(workspaceSignature(null, ops)).toBe(workspaceSignature(null, toLocalOperations(base)));
    expect(workspaceSignature(null, assignEmployee(ops, '7', 'op-10'))).not.toBe(
      workspaceSignature(null, ops),
    );
  });
});
