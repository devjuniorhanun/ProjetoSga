<?php

// Define o namespace do controller de anos agrícolas.
namespace App\Http\Controllers\Registrations\Harvest;

use App\Http\Controllers\Controller;
use App\Http\Requests\Registrations\Harvest\AgriculturalYearRequest;
use App\Http\Resources\Registrations\Harvest\AgriculturalYearResource;
use App\Models\Registrations\Harvest\AgriculturalYear;
use App\Services\Registrations\Harvest\AgriculturalYearService;
use Illuminate\Http\JsonResponse;

// Controller responsável pelo CRUD de anos agrícolas.
class AgriculturalYearController extends Controller
{
    // Injeta o serviço do domínio.
    public function __construct(
        private readonly AgriculturalYearService $service,
    ) {
    }

    // Lista os anos agrícolas.
    public function index()
    {
        return AgriculturalYearResource::collection(
            $this->service->list(),
        );
    }

    // Cria um ano agrícola.
    public function store(AgriculturalYearRequest $request)
    {
        $model = $this->service->create(
            $request->validated(),
        );

        return (new AgriculturalYearResource($model))
            ->response()
            ->setStatusCode(201);
    }

    // Exibe um ano agrícola.
    public function show(AgriculturalYear $agriculturalYear)
    {
        return new AgriculturalYearResource($agriculturalYear);
    }

    // Atualiza um ano agrícola.
    public function update(
        AgriculturalYearRequest $request,
        AgriculturalYear $agriculturalYear,
    ) {
        return new AgriculturalYearResource(
            $this->service->update(
                $agriculturalYear,
                $request->validated(),
            ),
        );
    }

    // Executa a exclusão lógica.
    public function destroy(AgriculturalYear $agriculturalYear): JsonResponse
    {
        $this->service->delete($agriculturalYear);

        return response()->json(null, 204);
    }
}
