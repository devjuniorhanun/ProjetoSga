<?php

namespace App\Http\Controllers\Releases\Grain;

use App\Http\Controllers\Controller;
use App\Models\Releases\Grain\AuthorizationRequest;
use App\Services\Releases\Grain\AuthorizationService;
use Illuminate\Http\Request;

class AuthorizationController extends Controller
{
    public function __construct(private readonly AuthorizationService $service) {}
    public function index(Request $request) { return AuthorizationRequest::query()->when($request->status, fn ($q, $v) => $q->where('status', $v))->latest()->paginate(25); }
    public function store(Request $request) {
        $data = $request->validate(['operation_type' => ['required', 'string', 'max:60'], 'resource_type' => ['nullable', 'string'], 'resource_id' => ['nullable', 'integer'], 'reason' => ['required', 'string'], 'payload_before' => ['nullable', 'array'], 'payload_requested' => ['required', 'array'], 'expires_at' => ['nullable', 'date', 'after:now']]);
        return response()->json($this->service->request($data, $request->user()), 201);
    }
    public function approve(Request $request, AuthorizationRequest $authorization) { $data = $request->validate(['reason' => ['nullable', 'string']]); return $this->service->decide($authorization, $request->user(), true, $data['reason'] ?? null); }
    public function reject(Request $request, AuthorizationRequest $authorization) { $data = $request->validate(['reason' => ['required', 'string']]); return $this->service->decide($authorization, $request->user(), false, $data['reason']); }
}
