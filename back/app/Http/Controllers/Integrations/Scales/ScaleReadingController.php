<?php

namespace App\Http\Controllers\Integrations\Scales;

use App\Http\Controllers\Controller;
use App\Models\Registrations\Grain\ScaleChannel;
use App\Models\Releases\Grain\ScaleReading;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ScaleReadingController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate(['grain_scale_id' => ['required', 'exists:grain_scales,id'], 'grain_scale_channel_id' => ['required', 'exists:grain_scale_channels,id'], 'node_code' => ['required', 'string', 'max:50'], 'sequence' => ['required', 'integer', 'min:1'], 'weight' => ['required', 'numeric'], 'unit' => ['required', 'in:kg'], 'stable' => ['required', 'boolean'], 'raw_message' => ['nullable', 'string'], 'read_at' => ['required', 'date']]);
        $channel = ScaleChannel::query()->whereKey($data['grain_scale_channel_id'])->where('grain_scale_id', $data['grain_scale_id'])->where('status', 'A')->first();
        if (!$channel) throw ValidationException::withMessages(['grain_scale_channel_id' => ['Canal inválido para a balança.']]);
        $reading = ScaleReading::query()->firstOrCreate(['node_code' => $data['node_code'], 'sequence' => $data['sequence']], $data);
        return response()->json($reading, $reading->wasRecentlyCreated ? 201 : 200);
    }
    public function latest(Request $request) { $data = $request->validate(['grain_scale_channel_id' => ['required', 'exists:grain_scale_channels,id']]); return ScaleReading::query()->where('grain_scale_channel_id', $data['grain_scale_channel_id'])->latest('read_at')->firstOrFail(); }
}
