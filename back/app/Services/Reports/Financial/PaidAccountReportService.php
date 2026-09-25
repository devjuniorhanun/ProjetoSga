<?php

namespace App\Services\Reports\Financial;

use App\Models\Releases\Financial\PayAccount;
use App\Models\Registrations\Harvest\AgriculturalYear;
use App\Models\Registrations\Harvest\Crop;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class PaidAccountReportService
{
    private const MONETARY_PAYMENT_TYPES = ['BO', 'TR', 'DI', 'CH', 'CHQ', 'CQ', 'LG'];
    private const RELATIONS = [
        'administrativeCenter.farm',
        'costCenter',
        'supplier',
        'producer.owner',
        'typePayAccount',
        'crop.agriculturalYear',
    ];

    public function analytical(array $filters): array
    {
        $accounts = $this->accounts($filters);
        $sections = $accounts->groupBy(fn (PayAccount $account): string => $this->section($account));

        $sectionRows = $sections->map(function (Collection $items, string $code): array {
            $suppliers = $items->groupBy('supplier_id')->map(function (Collection $supplierItems): array {
                $first = $supplierItems->first();

                return [
                    'supplier_id' => $first->supplier_id,
                    'supplier_name' => $first->supplier?->corporate_reason,
                    'total' => $this->money($supplierItems->sum('value')),
                    'items' => $supplierItems->map(fn (PayAccount $item): array => $this->item($item))->values()->all(),
                ];
            })->sortBy('supplier_name', SORT_NATURAL | SORT_FLAG_CASE)->values();

            return [
                'code' => $code,
                'name' => $this->sectionName($code),
                'payments_count' => $items->count(),
                'total' => $this->money($items->sum('value')),
                'suppliers' => $suppliers->all(),
            ];
        })->sortBy(fn (array $row): int => array_search($row['code'], $this->sectionOrder(), true))->values();

        $grandTotal = $this->money($accounts->sum('value'));
        $sectionTotal = $this->money($sectionRows->sum('total'));

        return [
            'report' => 'PAID_ACCOUNTS_ANALYTICAL',
            'period' => $this->period($filters),
            'filters' => $filters,
            'generated_at' => now()->toISOString(),
            'summary' => [
                'payments_count' => $accounts->count(),
                'suppliers_count' => $accounts->pluck('supplier_id')->filter()->unique()->count(),
                'grand_total' => $grandTotal,
                'accounted_total' => $this->money($accounts->where('accounted_for', 'S')->sum('value')),
                'not_accounted_total' => $this->money($accounts->where('accounted_for', 'N')->sum('value')),
            ],
            'sections' => $sectionRows->all(),
            'reconciliation' => [
                'records_total' => $grandTotal,
                'sections_total' => $sectionTotal,
                'difference' => $this->money($grandTotal - $sectionTotal),
                'reconciled' => abs($grandTotal - $sectionTotal) < 0.005,
            ],
        ];
    }

    public function byCostCenter(array $filters): array
    {
        $accounts = $this->accounts($filters);
        $grandTotal = $this->money($accounts->sum('value'));

        $costCenters = $this->dimension($accounts, fn (PayAccount $a) => $a->cost_center_id,
            fn (PayAccount $a) => $a->costCenter?->name ?? 'SEM CENTRO DE CUSTO', $grandTotal, $filters);
        $paymentTypes = $this->dimension($accounts, fn (PayAccount $a) => $a->type_pay_account_id,
            fn (PayAccount $a) => $a->typePayAccount?->name ?? 'SEM TIPO DE PAGAMENTO', $grandTotal, $filters,
            fn (PayAccount $a) => $a->typePayAccount?->abbreviation);
        $statuses = $this->dimension($accounts, fn (PayAccount $a) => $a->status,
            fn (PayAccount $a) => $this->statusName($a->status), $grandTotal, $filters);
        $entryTypes = $this->dimension($accounts, fn (PayAccount $a) => $a->entry_type,
            fn (PayAccount $a) => match ($a->entry_type) {
                'PAYROLL' => 'Folha de Pagamento',
                'HARVESTER_ADVANCE' => 'Adiantamento de Colhedor',
                'TRANSPORTER_ADVANCE' => 'Adiantamento de Transportador',
                default => 'Contas Pagas',
            }, $grandTotal, $filters);

        $totals = [
            'cost_center_total' => $this->money(collect($costCenters)->sum('total')),
            'payment_type_total' => $this->money(collect($paymentTypes)->sum('total')),
            'status_total' => $this->money(collect($statuses)->sum('total')),
            'entry_type_total' => $this->money(collect($entryTypes)->sum('total')),
        ];
        $differences = collect($totals)->map(fn (float $total): float => $this->money($grandTotal - $total));

        return [
            'report' => 'PAID_ACCOUNTS_BY_COST_CENTER',
            'period' => $this->period($filters),
            'filters' => $filters,
            'generated_at' => now()->toISOString(),
            'summary' => [
                'payments_count' => $accounts->count(),
                'cost_centers_count' => count($costCenters),
                'suppliers_count' => $accounts->pluck('supplier_id')->filter()->unique()->count(),
                'accounts_total' => $this->money($accounts->where('entry_type', 'ACCOUNT')->sum('value')),
                'payroll_total' => $this->money($accounts->where('entry_type', 'PAYROLL')->sum('value')),
                'harvester_advance_total' => $this->money($accounts->where('entry_type', 'HARVESTER_ADVANCE')->sum('value')),
                'transporter_advance_total' => $this->money($accounts->where('entry_type', 'TRANSPORTER_ADVANCE')->sum('value')),
                'grand_total' => $grandTotal,
            ],
            'by_cost_center' => $costCenters,
            'by_payment_type' => $paymentTypes,
            'by_status' => $statuses,
            'by_entry_type' => $entryTypes,
            'reconciliation' => [
                ...$totals,
                'differences' => $differences->all(),
                'reconciled' => $differences->every(fn (float $difference): bool => abs($difference) < 0.005),
            ],
        ];
    }

    public function byCrop(array $filters): array
    {
        $crop = Crop::query()
            ->with('agriculturalYear')
            ->whereKey($filters['crop_id'])
            ->where('agricultural_year_id', $filters['agricultural_year_id'])
            ->firstOrFail();

        $report = $this->analytical($filters);
        $report['report'] = 'PAID_ACCOUNTS_BY_CROP';
        $report['agricultural_year'] = [
            'id' => $crop->agriculturalYear->id,
            'name' => $crop->agriculturalYear->name,
        ];
        $report['crop'] = ['id' => $crop->id, 'name' => $crop->name];

        return $report;
    }

    public function cropOptions(?int $agriculturalYearId = null): array
    {
        $years = AgriculturalYear::query()
            ->where('status', 'A')
            ->orderByDesc('opening_date')
            ->get(['id', 'name', 'opening_date', 'closing_date', 'status']);

        $selectedYearId = $agriculturalYearId && $years->contains('id', $agriculturalYearId)
            ? $agriculturalYearId
            : $years->first()?->id;

        $crops = Crop::query()
            ->where('status', 'A')
            ->when($selectedYearId, fn (Builder $query, $id): Builder => $query->where('agricultural_year_id', $id))
            ->orderByDesc('opening_date')
            ->get(['id', 'agricultural_year_id', 'name', 'opening_date', 'closing_date', 'status']);

        return [
            'selected_agricultural_year_id' => $selectedYearId,
            'selected_crop_id' => $crops->first()?->id,
            'agricultural_years' => $years,
            'crops' => $crops,
        ];
    }

    private function accounts(array $filters): Collection
    {
        $from = CarbonImmutable::parse($filters['date_from']);
        $to = CarbonImmutable::parse($filters['date_to']);
        if ($from->diffInDays($to) > 366) {
            throw ValidationException::withMessages(['date_to' => ['O período máximo do relatório é de 12 meses.']]);
        }

        $query = PayAccount::query()->with(self::RELATIONS)
            ->whereBetween('document_date', [$from->toDateString(), $to->toDateString()])
            ->whereHas('typePayAccount', fn (Builder $type): Builder => $type
                ->whereIn('abbreviation', self::MONETARY_PAYMENT_TYPES));

        foreach (['producer_id', 'administrative_center_id', 'cost_center_id', 'supplier_id',
                  'type_pay_account_id', 'accounted_for', 'status', 'entry_type', 'crop_id'] as $field) {
            $query->when($filters[$field] ?? null, fn (Builder $q, $value): Builder => $q->where($field, $value));
        }

        $items = $query->orderBy('supplier_id')->orderBy('document_date')->orderBy('id')->get();
        if (($filters['section'] ?? 'ALL') !== 'ALL') {
            $items = $items->filter(fn (PayAccount $account): bool => $this->section($account) === $filters['section'])->values();
        }

        return $items;
    }

    private function dimension(Collection $accounts, callable $key, callable $name, float $grandTotal,
        array $filters, ?callable $code = null): array
    {
        $rows = $accounts->groupBy($key)->map(function (Collection $items, mixed $groupKey) use ($name, $code, $grandTotal): array {
            $first = $items->first();
            $total = $this->money($items->sum('value'));

            return [
                'id' => $groupKey,
                'name' => $name($first),
                'code' => $code ? $code($first) : $groupKey,
                'payments_count' => $items->count(),
                'total' => $total,
                'percentage' => $grandTotal > 0 ? round(($total / $grandTotal) * 100, 2) : 0.0,
            ];
        });

        return match ($filters['order_by'] ?? 'VALUE_DESC') {
            'NAME_ASC' => $rows->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)->values()->all(),
            'VALUE_ASC' => $rows->sortBy('total')->values()->all(),
            default => $rows->sortByDesc('total')->values()->all(),
        };
    }

    private function item(PayAccount $account): array
    {
        return [
            'id' => $account->id,
            'supplier_id' => $account->supplier_id,
            'supplier_name' => $account->supplier?->corporate_reason,
            'producer_id' => $account->producer_id,
            'producer_name' => $account->producer?->owner?->corporate_name,
            'administrative_center_id' => $account->administrative_center_id,
            'administrative_center_name' => $account->administrativeCenter?->farm?->name,
            'cost_center_id' => $account->cost_center_id,
            'cost_center_name' => $account->costCenter?->name,
            'type_pay_account_id' => $account->type_pay_account_id,
            'type_pay_account_name' => $account->typePayAccount?->name,
            'type_pay_account_abbreviation' => $account->typePayAccount?->abbreviation,
            'document_number' => $account->document_number,
            'document_date' => $account->document_date?->format('Y-m-d'),
            'due_date' => $account->due_date?->format('Y-m-d'),
            'description' => $account->description,
            'value' => $this->money($account->value),
            'accounted_for' => $account->accounted_for,
            'status' => $account->status,
            'entry_type' => $account->entry_type,
            'source_type' => $account->source_type,
            'source_id' => $account->source_id,
            'crop_id' => $account->crop_id,
            'crop_name' => $account->crop?->name,
            'agricultural_year_id' => $account->crop?->agricultural_year_id,
            'agricultural_year_name' => $account->crop?->agriculturalYear?->name,
        ];
    }

    private function section(PayAccount $account): string
    {
        $abbreviation = strtoupper((string) $account->typePayAccount?->abbreviation);
        $source = strtolower((string) $account->source_type);

        return match (true) {
            $account->entry_type === 'PAYROLL' => 'PAYROLL',
            in_array($account->entry_type, ['HARVESTER_ADVANCE', 'TRANSPORTER_ADVANCE'], true) => 'ADVANCE',
            $account->status === 'CA' => 'CASH',
            in_array($abbreviation, ['CH', 'CHQ', 'CQ'], true) => 'CHECK',
            $abbreviation === 'BO' => 'BOLETO',
            $abbreviation === 'TR' => 'TRANSFER',
            default => 'OTHER',
        };
    }

    private function sectionOrder(): array
    {
        return ['BOLETO', 'TRANSFER', 'CASH', 'CHECK', 'ADVANCE', 'PAYROLL', 'OTHER'];
    }

    private function sectionName(string $code): string
    {
        return ['BOLETO' => 'Boletos', 'TRANSFER' => 'Transferências', 'CASH' => 'Caixa',
            'CHECK' => 'Cheques', 'ADVANCE' => 'Adiantamentos', 'PAYROLL' => 'Folha de Pagamento',
            'OTHER' => 'Outros Pagamentos'][$code] ?? $code;
    }

    private function statusName(string $status): string
    {
        return ['CA' => 'Caixa', 'CO' => 'Comércio', 'RI' => 'Ribeirão', 'FA' => 'Fazenda'][$status] ?? $status;
    }

    private function period(array $filters): array
    {
        return ['date_from' => $filters['date_from'], 'date_to' => $filters['date_to']];
    }

    private function money(mixed $value): float
    {
        return round((float) $value, 2);
    }
}
