<?php

namespace App\Http\Controllers\Releases\Agricultural\Workforce;

use App\Http\Controllers\Controller;
use App\Services\Releases\Agricultural\Workforce\DailyWorkforceBoardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DailyWorkforceBoardController extends Controller
{
    public function __construct(private readonly DailyWorkforceBoardService $service) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate(['date_from' => ['nullable','date'], 'date_to' => ['nullable','date','after_or_equal:date_from'],
            'status' => ['nullable', Rule::in(['A','F','C'])]]);
        return response()->json($this->service->list($filters));
    }

    public function byDate(Request $request): JsonResponse
    {
        $data = $request->validate(['date' => ['required','date_format:Y-m-d']]);
        return response()->json(['data' => $this->service->byDate($data['date'])]);
    }

    public function resolve(Request $request): JsonResponse
    {
        $data = $request->validate(['work_date' => ['required','date_format:Y-m-d']]);
        return response()->json(['data' => $this->service->resolve($data['work_date'], $request->user()->id)], 201);
    }

    public function show(int $board): JsonResponse
    {
        return response()->json(['data' => $this->service->workspace($board)]);
    }

    public function save(Request $request, int $board): JsonResponse
    {
        $data = $request->validate([
            'version' => ['required','integer','min:1'], 'notes' => ['nullable','string'], 'operations' => ['required','array'],
            'operations.*.id' => ['nullable','integer'],
            'operations.*.source_type' => ['required', Rule::in(['MANUAL','GENERAL','DEFENSIVE'])],
            'operations.*.source_id' => ['nullable','integer'],
            'operations.*.agricultural_service_type_id' => ['nullable','integer','exists:agricultural_service_types,id'],
            'operations.*.title' => ['required','string','max:255'], 'operations.*.description' => ['nullable','string'],
            'operations.*.required_employees' => ['nullable','integer','min:0'],
            'operations.*.display_order' => ['nullable','integer','min:0'], 'operations.*.source_snapshot' => ['nullable','array'],
            'operations.*.employee_ids' => ['present','array'], 'operations.*.employee_ids.*' => ['integer','distinct'],
        ]);
        return response()->json(['data' => $this->service->save($board, $data, $request->user()->id)]);
    }

    public function history(int $board): JsonResponse
    {
        return response()->json(['data' => $this->service->historyRows($board)]);
    }
}
