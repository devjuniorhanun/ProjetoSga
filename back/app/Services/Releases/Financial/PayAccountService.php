<?php

namespace App\Services\Releases\Financial;

use App\Models\Registrations\Financial\AdministrativeCenter;
use App\Models\Registrations\Financial\CostCenter;
use App\Models\Releases\Financial\PayAccount;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Models\Registrations\Admin\Config;

class PayAccountService
{
    private const RELATIONS = [
        'administrativeCenter.farm',
        'administrativeCenter.producer.owner',
        'costCenter',
        'supplier',
        'producer.owner',
        'typePayAccount',
        'crop.agriculturalYear',
    ];

    public function list(array $filters): LengthAwarePaginator
    {
        $query = PayAccount::query()->with(self::RELATIONS);

        $this->applyFilters($query, $filters);

        return $query
            ->orderByDesc('document_date')
            ->orderByDesc('id')
            ->paginate(min(max((int) ($filters['per_page'] ?? 25), 1), 100))
            ->withQueryString();
    }

    public function find(PayAccount $payAccount): PayAccount
    {
        return $payAccount->load(self::RELATIONS);
    }

    public function create(array $data): PayAccount
    {
        return DB::transaction(function () use ($data): PayAccount {
            unset($data['agricultural_year_id']);
            $data['entry_type'] = PayAccount::ENTRY_ACCOUNT;
            $data['accounted_for'] ??= 'N';
            $data['status'] ??= 'RI';
            $this->validateAdministrativeCenter($data);

            return $this->find(PayAccount::create($data));
        });
    }

    public function createPayroll(array $data): PayAccount
    {
        return DB::transaction(function () use ($data): PayAccount {
            unset($data['agricultural_year_id']);
            if (!CostCenter::query()->whereKey(1)->exists()) {
                throw ValidationException::withMessages([
                    'cost_center_id' => ['O centro de custo padrão da Folha de Pagamento (ID 1) não existe.'],
                ]);
            }

            $data['cost_center_id'] = 1;
            $data['due_date'] = $data['document_date'];
            $data['entry_type'] = PayAccount::ENTRY_PAYROLL;
            $data['accounted_for'] ??= 'N';
            $data['status'] ??= 'RI';
            $this->validateAdministrativeCenter($data);

            return $this->find(PayAccount::create($data));
        });
    }

    public function update(PayAccount $payAccount, array $data): PayAccount
    {
        return DB::transaction(function () use ($payAccount, $data): PayAccount {
            unset($data['agricultural_year_id']);
            unset($data['entry_type']);

            if ($payAccount->entry_type === PayAccount::ENTRY_PAYROLL) {
                if (!CostCenter::query()->whereKey(1)->exists()) {
                    throw ValidationException::withMessages([
                        'cost_center_id' => ['O centro de custo padrão da Folha de Pagamento (ID 1) não existe.'],
                    ]);
                }

                $data['cost_center_id'] = 1;
                $data['due_date'] = $data['document_date'] ?? $payAccount->document_date->format('Y-m-d');
            }

            $merged = array_merge($payAccount->only([
                'producer_id',
                'administrative_center_id',
            ]), $data);
            $this->validateAdministrativeCenter($merged);

            $payAccount->update($data);

            return $this->find($payAccount->refresh());
        });
    }

    public function delete(PayAccount $payAccount): void
    {
        $payAccount->delete();
    }

    public function transfers(string $date)
    {
        return PayAccount::query()
            ->with([
                ...self::RELATIONS,
                'supplier.bankSuppliers' => fn ($query) => $query
                    ->where('status', 'A')
                    ->orderBy('id'),
            ])
            ->whereDate('document_date', $date)
            ->whereHas('typePayAccount', fn (Builder $query): Builder => $query
                ->where('abbreviation', 'TR'))
            ->orderBy('supplier_id')
            ->orderBy('document_number')
            ->get();
    }

    public function receipt(PayAccount $payAccount): array
    {
        $account = $payAccount->load([
            ...self::RELATIONS,
            'supplier.bankSuppliers' => fn ($query) => $query->where('status', 'A')->orderBy('id'),
        ]);
        $abbreviation = strtoupper((string) $account->typePayAccount?->abbreviation);
        $monetary = in_array($abbreviation, ['BO','TR','DI','CH','CHQ','CQ','LG'], true);
        $unit = $monetary ? 'R$' : match ($abbreviation) {
            'DL' => 'LT',
            'GR' => 'SC',
            default => $abbreviation,
        };
        $config = Config::query()->where('status', 'A')->latest('id')->first();

        return [
            'receipt_number' => $account->id,
            'document_number' => $account->document_number,
            'document_date' => $account->document_date?->format('Y-m-d'),
            'description' => $account->description,
            'value' => (float) $account->value,
            'is_monetary' => $monetary,
            'unit' => $unit,
            'payment_method' => ['id' => $account->type_pay_account_id,
                'name' => $account->typePayAccount?->name, 'abbreviation' => $abbreviation],
            'payer' => ['id' => $account->producer_id,
                'name' => $account->producer?->owner?->corporate_name,
                'farm' => $account->administrativeCenter?->farm?->name],
            'payee' => ['id' => $account->supplier_id, 'name' => $account->supplier?->corporate_reason,
                'cpf_cnpj' => $account->supplier?->cpf_cnpj],
            'bank_account' => $abbreviation === 'TR'
                ? $account->supplier?->bankSuppliers?->first()
                : null,
            'crop' => ['id' => $account->crop_id, 'name' => $account->crop?->name],
            'logo_url' => $config?->logo_path ? asset('storage/'.$config->logo_path) : null,
        ];
    }

    private function applyFilters(Builder $query, array $filters): void
    {
        $exactFilters = [
            'producer_id',
            'administrative_center_id',
            'cost_center_id',
            'supplier_id',
            'type_pay_account_id',
            'accounted_for',
            'status',
            'entry_type',
            'crop_id',
        ];

        foreach ($exactFilters as $field) {
            $query->when($filters[$field] ?? null, fn (Builder $q, $value): Builder => $q->where($field, $value));
        }

        $query->when($filters['document_number'] ?? null, fn (Builder $q, $value): Builder => $q
            ->where('document_number', 'like', '%' . $value . '%'));
        $query->when($filters['date'] ?? null, fn (Builder $q, $value): Builder => $q
            ->whereDate('document_date', $value));
        $query->when($filters['date_from'] ?? null, fn (Builder $q, $value): Builder => $q
            ->whereDate('document_date', '>=', $value));
        $query->when($filters['date_to'] ?? null, fn (Builder $q, $value): Builder => $q
            ->whereDate('document_date', '<=', $value));
    }

    private function validateAdministrativeCenter(array $data): void
    {
        $valid = AdministrativeCenter::query()
            ->whereKey($data['administrative_center_id'])
            ->where('producer_id', $data['producer_id'])
            ->where('status', 'A')
            ->exists();

        if (!$valid) {
            throw ValidationException::withMessages([
                'administrative_center_id' => ['O centro administrativo deve estar ativo e pertencer ao produtor selecionado.'],
            ]);
        }
    }
}
