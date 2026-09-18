<?php

// Define o namespace do controller de variedades.
namespace App\Http\Controllers\Registrations\Harvest;

use App\Http\Controllers\Controller;
use App\Http\Requests\Registrations\Harvest\VarietyCultureRequest;
use App\Http\Resources\Registrations\Harvest\VarietyCultureResource;
use App\Models\Registrations\Harvest\VarietyCulture;
use App\Services\Registrations\Harvest\VarietyCultureService;

// Controller responsável pelo CRUD de variedades de culturas.
class VarietyCultureController extends Controller
{
    // Injeta o serviço do domínio.
    public function __construct(
        private readonly VarietyCultureService $service,
    ) {
    }

    // Lista variedades.
    public function index()
    {
        return VarietyCultureResource::collection(
            $this->service->list(),
        );
    }

    // Cria uma variedade.
    public function store(VarietyCultureRequest $request)
    {
        $model = $this->service->create(
            $request->validated(),
        );

        return (new VarietyCultureResource($model))
            ->response()
            ->setStatusCode(201);
    }

    // Exibe uma variedade e sua cultura.
    public function show(VarietyCulture $variety)
    {
        return new VarietyCultureResource(
            $variety->load('culture'),
        );
    }

    // Atualiza uma variedade.
    public function update(
        VarietyCultureRequest $request,
        VarietyCulture $variety,
    ) {
        return new VarietyCultureResource(
            $this->service->update(
                $variety,
                $request->validated(),
            ),
        );
    }

    // Executa a exclusão lógica.
    public function destroy(VarietyCulture $variety)
    {
        $this->service->delete($variety);

        return response()->json(null, 204);
    }

    // Lista variedades pertencentes a uma cultura.
    public function byCulture(string $cultureId)
    {
        return VarietyCultureResource::collection(
            $this->service->byCulture($cultureId),
        );
    }
}
