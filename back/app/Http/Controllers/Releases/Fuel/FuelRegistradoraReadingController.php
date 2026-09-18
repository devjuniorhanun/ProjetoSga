<?php
namespace App\Http\Controllers\Releases\Fuel;
use App\Http\Controllers\Controller;
use App\Http\Resources\Releases\Fuel\FuelRegistradoraReadingResource;
use App\Models\Releases\Fuel\FuelRegistradoraReading;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FuelRegistradoraReadingController extends Controller
{
    public function index(Request $request)
    {
        return FuelRegistradoraReadingResource::collection(FuelRegistradoraReading::latest('reading_date')->paginate($request->integer('per_page', 20)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'fuel_registradora_id' => 'required|integer|exists:fuel_registradoras,id',
            'reading_date' => 'required|date',
            'start_reading' => 'required|numeric|min:0',
            'end_reading' => 'required|numeric|min:0',
            'observation' => 'nullable|string|max:500',
        ]);
        if ((float) $data['end_reading'] < (float) $data['start_reading']) {
            throw ValidationException::withMessages(['end_reading' => 'A leitura final não pode ser menor que a inicial.']);
        }
        $data['quantity'] = (float) $data['end_reading'] - (float) $data['start_reading'];
        $data['responsible_id'] = auth()->id();
        return (new FuelRegistradoraReadingResource(FuelRegistradoraReading::create($data)))->response()->setStatusCode(201);
    }
}
