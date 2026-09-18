<?php

// Define o namespace do controller de culturas.
namespace App\Http\Controllers\Registrations\Harvest;

use App\Http\Controllers\Controller;
use App\Http\Requests\Registrations\Harvest\CultureRequest;
use App\Http\Resources\Registrations\Harvest\CultureResource;
use App\Models\Registrations\Harvest\Culture;
use App\Services\Registrations\Harvest\CultureService;
use Illuminate\Http\JsonResponse;

// Controller responsável pelo CRUD de culturas.
class CultureController extends Controller
{
    // Injeta o serviço do domínio.
    public function __construct(
        private readonly CultureService $service,
    ) {
    }

    // Lista culturas.
    public function index()
    {
        return CultureResource::collection(
            $this->service->list(),
        );
    }

    // Cria uma cultura.
    public function store(CultureRequest $request)
    {
        $model = $this->service->create(
            $request->validated(),
        );

        return (new CultureResource($model))
            ->response()
            ->setStatusCode(201);
    }

    // Exibe uma cultura.
    public function show(Culture $culture)
    {
        return new CultureResource($culture);
    }

    // Atualiza uma cultura.
    public function update(CultureRequest $request, Culture $culture)
    {
        return new CultureResource(
            $this->service->update(
                $culture,
                $request->validated(),
            ),
        );
    }

    // Executa a exclusão lógica.
    public function destroy(Culture $culture): JsonResponse
    {
        $this->service->delete($culture);

        return response()->json(null, 204);
    }
}
