<?php

namespace App\Services\Releases\Grain;

use App\Models\Registrations\Admin\User;
use App\Models\Releases\Grain\AuthorizationRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthorizationService
{
    public function __construct(private readonly DocumentNumberService $numbers) {}

    public function request(array $data, User $user): AuthorizationRequest
    {
        return DB::transaction(fn () => AuthorizationRequest::create([
            ...$data,
            'request_number' => $this->numbers->next('AUT'),
            'requested_by' => $user->id,
            'requested_at' => now(),
            'status' => 'PENDING',
        ]));
    }

    public function decide(AuthorizationRequest $authorization, User $user, bool $approve, ?string $reason): AuthorizationRequest
    {
        return DB::transaction(function () use ($authorization, $user, $approve, $reason): AuthorizationRequest {
            $authorization = AuthorizationRequest::query()->lockForUpdate()->findOrFail($authorization->id);
            if ($authorization->status !== 'PENDING') {
                throw ValidationException::withMessages(['authorization' => ['A solicitação já foi decidida.']]);
            }
            if ($authorization->requested_by === $user->id && !$user->hasAnyRole('SUPER')) {
                throw ValidationException::withMessages(['authorization' => ['O solicitante não pode autorizar a própria operação.']]);
            }
            if ($authorization->requested_by === $user->id && blank($reason)) {
                throw ValidationException::withMessages(['authorization_reason' => ['O SUPER deve justificar a autoautorização.']]);
            }
            $authorization->update($approve ? [
                'status' => 'APPROVED', 'authorized_by' => $user->id,
                'authorized_at' => now(), 'authorization_reason' => $reason,
            ] : [
                'status' => 'REJECTED', 'authorized_by' => $user->id,
                'authorized_at' => now(), 'rejection_reason' => $reason,
            ]);
            return $authorization->refresh();
        });
    }

    public function assertApproved(?int $id, string $operation, ?int $resourceId = null): AuthorizationRequest
    {
        $authorization = AuthorizationRequest::query()->lockForUpdate()->find($id);
        if (!$authorization || $authorization->status !== 'APPROVED' || $authorization->operation_type !== $operation || ($resourceId && $authorization->resource_id !== $resourceId)) {
            throw ValidationException::withMessages(['authorization_request_id' => ['Autorização aprovada e compatível é obrigatória.']]);
        }
        if ($authorization->expires_at?->isPast()) {
            throw ValidationException::withMessages(['authorization_request_id' => ['A autorização está vencida.']]);
        }
        return $authorization;
    }

    public function consume(AuthorizationRequest $authorization): void
    {
        $authorization->update(['status' => 'USED']);
    }

    public function assertPayloadMatches(AuthorizationRequest $authorization, array $expected): void
    {
        $actual = $authorization->payload_requested;
        foreach ($expected as $key => $value) {
            if (!array_key_exists($key, $actual) || !$this->sameValue($actual[$key], $value)) {
                throw ValidationException::withMessages(['authorization_request_id' => ["A autorização não corresponde ao campo {$key} da operação atual."]]);
            }
        }
    }

    private function sameValue(mixed $actual, mixed $expected): bool
    {
        if (is_numeric($actual) && is_numeric($expected)) return abs((float) $actual - (float) $expected) < 0.0005;
        if (is_array($actual) && is_array($expected)) {
            if (array_keys($actual) !== array_keys($expected)) return false;
            foreach ($expected as $key => $value) if (!$this->sameValue($actual[$key], $value)) return false;
            return true;
        }
        return $actual === $expected;
    }
}
