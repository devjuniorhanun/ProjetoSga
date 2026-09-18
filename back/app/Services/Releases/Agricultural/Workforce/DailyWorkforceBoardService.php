<?php

namespace App\Services\Releases\Agricultural\Workforce;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class DailyWorkforceBoardService
{
    public function list(array $filters)
    {
        return DB::table('daily_workforce_boards')->whereNull('deleted_at')
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('work_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('work_date', '<=', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->orderByDesc('work_date')->paginate(25);
    }

    public function resolve(string $date, int $userId): array
    {
        $board = DB::transaction(function () use ($date, $userId) {
            $existing = DB::table('daily_workforce_boards')->whereDate('work_date', $date)->whereNull('deleted_at')->first();
            if ($existing) return $existing;
            $id = DB::table('daily_workforce_boards')->insertGetId(['work_date' => $date, 'version' => 1,
                'status' => 'A', 'created_by' => $userId, 'updated_by' => $userId, 'created_at' => now(), 'updated_at' => now()]);
            return DB::table('daily_workforce_boards')->find($id);
        });

        return $this->workspace((int) $board->id);
    }

    public function byDate(string $date): array
    {
        $board = DB::table('daily_workforce_boards')->whereDate('work_date', $date)->whereNull('deleted_at')->first();
        return $board ? $this->workspace((int) $board->id) : [
            'board' => null, 'available_employees' => $this->employees(), 'operations' => [],
            'service_suggestions' => $this->serviceSuggestions($date),
        ];
    }

    public function workspace(int $boardId): array
    {
        $board = DB::table('daily_workforce_boards')->where('id', $boardId)->whereNull('deleted_at')->firstOrFail();
        $operations = DB::table('daily_board_operations')->where('daily_workforce_board_id', $boardId)
            ->whereNull('deleted_at')->orderBy('display_order')->orderBy('id')->get();
        $allocations = DB::table('employee_allocations as a')->join('suppliers as s', 's.id', '=', 'a.supplier_id')
            ->where('a.daily_workforce_board_id', $boardId)->orderBy('a.display_order')->orderBy('s.corporate_reason')
            ->get(['a.id','a.daily_board_operation_id','a.supplier_id','a.display_order','a.notes',
                's.corporate_reason as employee_name','s.fantasy_name']);
        $allocated = $allocations->pluck('supplier_id')->all();

        return [
            'board' => $board,
            'available_employees' => collect($this->employees())->reject(fn ($e) => in_array($e->id, $allocated))->values(),
            'operations' => $operations->map(function ($operation) use ($allocations) {
                $operation->source_snapshot = $operation->source_snapshot ? json_decode($operation->source_snapshot, true) : null;
                $operation->allocations = $allocations->where('daily_board_operation_id', $operation->id)->values();
                $operation->allocated_employees = $operation->allocations->count();
                return $operation;
            })->values(),
            'service_suggestions' => $this->serviceSuggestions($board->work_date),
        ];
    }

    public function save(int $boardId, array $data, int $userId): array
    {
        DB::transaction(function () use ($boardId, $data, $userId): void {
            $board = DB::table('daily_workforce_boards')->where('id', $boardId)->whereNull('deleted_at')->lockForUpdate()->firstOrFail();
            if ((int) $board->version !== (int) $data['version']) {
                throw new ConflictHttpException('Este quadro foi alterado por outro usuário. Recarregue antes de salvar.');
            }
            if ($board->status === 'C') throw ValidationException::withMessages(['status' => ['Um quadro cancelado não pode ser alterado.']]);

            $employeeIds = collect($data['operations'])->flatMap(fn ($op) => $op['employee_ids'] ?? []);
            $duplicates = $employeeIds->duplicates()->unique()->values();
            if ($duplicates->isNotEmpty()) throw ValidationException::withMessages([
                'operations' => ['Cada funcionário pode participar de somente uma operação por dia. Funcionários repetidos: '.$duplicates->join(', ').'.'],
            ]);
            $validEmployees = collect($this->employees())->pluck('id')->map(fn ($id) => (int) $id);
            $invalid = $employeeIds->map(fn ($id) => (int) $id)->diff($validEmployees)->unique()->values();
            if ($invalid->isNotEmpty()) throw ValidationException::withMessages([
                'operations' => ['Existem funcionários inexistentes, inativos ou sem o tipo FUNCIONÁRIO: '.$invalid->join(', ').'.'],
            ]);

            $old = DB::table('employee_allocations')->where('daily_workforce_board_id', $boardId)->get()->keyBy('supplier_id');
            $keptOperationIds = [];
            $newAssignments = [];
            $sourceKeys = [];
            foreach ($data['operations'] as $position => $input) {
                $operation = null;
                if (!empty($input['id'])) {
                    $operation = DB::table('daily_board_operations')->where('id', $input['id'])
                        ->where('daily_workforce_board_id', $boardId)->whereNull('deleted_at')->lockForUpdate()->first();
                    if (!$operation) throw ValidationException::withMessages(['operations.'.$position.'.id' => ['A operação não pertence a este quadro.']]);
                }
                $source = $this->validatedSource($input['source_type'], $input['source_id'] ?? null, $board->work_date, $position);
                $sourceKey = $input['source_type'].'-'.($input['source_id'] ?? 'manual-'.$position);
                if ($input['source_type'] !== 'MANUAL' && in_array($sourceKey, $sourceKeys, true)) {
                    throw ValidationException::withMessages(['operations.'.$position.'.source_id' => ['O mesmo serviço não pode aparecer duas vezes no quadro.']]);
                }
                $sourceKeys[] = $sourceKey;
                $payload = ['source_type' => $input['source_type'], 'source_id' => $input['source_id'] ?? null,
                    'agricultural_service_type_id' => $input['agricultural_service_type_id'] ?? null,
                    'title' => $input['title'], 'description' => $input['description'] ?? null,
                    'required_employees' => $input['required_employees'] ?? null, 'display_order' => $input['display_order'] ?? $position,
                    'status' => 'A', 'source_snapshot' => $source ? json_encode($source, JSON_UNESCAPED_UNICODE) : null,
                    'updated_at' => now()];
                if ($operation) {
                    DB::table('daily_board_operations')->where('id', $operation->id)->update($payload);
                    $operationId = (int) $operation->id;
                } else {
                    $operationId = DB::table('daily_board_operations')->insertGetId([...$payload,
                        'daily_workforce_board_id' => $boardId, 'created_at' => now()]);
                }
                $keptOperationIds[] = $operationId;
                foreach ($input['employee_ids'] ?? [] as $employeePosition => $employeeId) {
                    $newAssignments[(int) $employeeId] = ['operation_id' => $operationId, 'display_order' => $employeePosition];
                }
            }

            $removedOperations = DB::table('daily_board_operations')->where('daily_workforce_board_id', $boardId)
                ->whereNull('deleted_at')->when($keptOperationIds, fn ($q) => $q->whereNotIn('id', $keptOperationIds))->pluck('id');
            if ($removedOperations->isNotEmpty()) {
                DB::table('employee_allocations')->whereIn('daily_board_operation_id', $removedOperations)->delete();
                DB::table('daily_board_operations')->whereIn('id', $removedOperations)->update(['deleted_at' => now(), 'updated_at' => now()]);
            }

            $nextVersion = (int) $board->version + 1;
            foreach ($old as $employeeId => $allocation) {
                $next = $newAssignments[(int) $employeeId] ?? null;
                if (!$next || (int) $allocation->daily_board_operation_id !== $next['operation_id']) {
                    $this->history($boardId, (int) $employeeId, (int) $allocation->daily_board_operation_id,
                        $next['operation_id'] ?? null, $next ? 'MOVED' : 'REMOVED', $nextVersion, $userId);
                } elseif ((int) $allocation->display_order !== (int) $next['display_order']) {
                    $this->history($boardId, (int) $employeeId, (int) $allocation->daily_board_operation_id,
                        (int) $allocation->daily_board_operation_id, 'REORDERED', $nextVersion, $userId);
                }
            }
            foreach ($newAssignments as $employeeId => $assignment) {
                if (!$old->has($employeeId)) $this->history($boardId, $employeeId, null, $assignment['operation_id'], 'ALLOCATED', $nextVersion, $userId);
            }

            DB::table('employee_allocations')->where('daily_workforce_board_id', $boardId)->delete();
            foreach ($newAssignments as $employeeId => $assignment) DB::table('employee_allocations')->insert([
                'daily_workforce_board_id' => $boardId, 'daily_board_operation_id' => $assignment['operation_id'],
                'supplier_id' => $employeeId, 'display_order' => $assignment['display_order'], 'allocated_by' => $userId,
                'allocated_at' => now(), 'created_at' => now(), 'updated_at' => now(),
            ]);
            DB::table('daily_workforce_boards')->where('id', $boardId)->update(['notes' => $data['notes'] ?? null,
                'version' => $nextVersion, 'updated_by' => $userId, 'updated_at' => now()]);
        });

        return $this->workspace($boardId);
    }

    public function historyRows(int $boardId)
    {
        return DB::table('employee_allocation_histories as h')->join('suppliers as s', 's.id', '=', 'h.supplier_id')
            ->join('users as u', 'u.id', '=', 'h.changed_by')->where('h.daily_workforce_board_id', $boardId)
            ->orderByDesc('h.id')->get(['h.*','s.corporate_reason as employee_name','u.name as changed_by_name']);
    }

    private function employees(): array
    {
        return DB::table('suppliers as s')->join('supplier_type_supplier as sts', 'sts.supplier_id', '=', 's.id')
            ->join('type_suppliers as ts', 'ts.id', '=', 'sts.type_supplier_id')->where('s.status', 'A')
            ->whereNull('s.deleted_at')->where('ts.status', 'A')->whereNull('ts.deleted_at')
            ->whereRaw('UPPER(ts.name) = ?', ['FUNCIONÁRIO'])->distinct()->orderBy('s.corporate_reason')
            ->get(['s.id','s.corporate_reason as name','s.fantasy_name'])->all();
    }

    private function serviceSuggestions(string $date): array
    {
        $general = DB::table('general_agricultural_services as g')->join('agricultural_service_types as t', 't.id', '=', 'g.agricultural_service_type_id')
            ->leftJoin('farms as f', 'f.id', '=', 'g.farm_id')->whereDate('g.service_date', $date)->whereNull('g.deleted_at')
            ->whereNotIn('g.status', ['COMPLETED','CANCELED'])->get(['g.id as source_id','g.agricultural_service_type_id',
                't.name as title','g.service_number','f.name as farm_name','g.status'])->map(fn ($r) => [...(array) $r, 'source_type' => 'GENERAL']);
        $defensive = DB::table('agricultural_defensive_orders as o')->join('type_operations as t', 't.id', '=', 'o.type_operation_id')
            ->join('fields as f', 'f.id', '=', 'o.field_id')->whereDate('o.application_date', $date)->where('o.status', 'A')
            ->get(['o.id as source_id','t.name as title','o.os_number','f.name as field_name','o.area'])
            ->map(fn ($r) => [...(array) $r, 'source_type' => 'DEFENSIVE', 'agricultural_service_type_id' => null]);
        return $general->concat($defensive)->values()->all();
    }

    private function validatedSource(string $type, ?int $sourceId, string $date, int $position): ?array
    {
        if ($type === 'MANUAL') return null;
        if (!$sourceId) throw ValidationException::withMessages([
            'operations.'.$position.'.source_id' => ['Informe o serviço de origem da operação.'],
        ]);
        $source = $type === 'GENERAL'
            ? DB::table('general_agricultural_services as g')->join('agricultural_service_types as t', 't.id', '=', 'g.agricultural_service_type_id')
                ->leftJoin('farms as f', 'f.id', '=', 'g.farm_id')->where('g.id', $sourceId)->whereDate('g.service_date', $date)
                ->whereNull('g.deleted_at')->first(['g.id','g.service_number','g.service_date','g.status','t.name as service_name','f.name as farm_name'])
            : DB::table('agricultural_defensive_orders as o')->join('type_operations as t', 't.id', '=', 'o.type_operation_id')
                ->join('fields as f', 'f.id', '=', 'o.field_id')->where('o.id', $sourceId)->whereDate('o.application_date', $date)
                ->first(['o.id','o.os_number','o.application_date','o.status','o.area','t.name as operation_name','f.name as field_name']);
        if (!$source) throw ValidationException::withMessages([
            'operations.'.$position.'.source_id' => ['O serviço não existe ou não pertence à data deste quadro.'],
        ]);
        return (array) $source;
    }

    private function history(int $boardId, int $employeeId, ?int $from, ?int $to, string $action, int $version, int $userId): void
    {
        DB::table('employee_allocation_histories')->insert(['daily_workforce_board_id' => $boardId,
            'supplier_id' => $employeeId, 'from_operation_id' => $from, 'to_operation_id' => $to,
            'action' => $action, 'save_version' => $version, 'changed_by' => $userId, 'changed_at' => now(),
            'snapshot' => json_encode(['from' => $from, 'to' => $to]),
        ]);
    }
}
