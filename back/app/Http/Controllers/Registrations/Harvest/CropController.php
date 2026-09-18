<?php

// Define o namespace do controller de safras.
namespace App\Http\Controllers\Registrations\Harvest;

use App\Http\Controllers\Controller;
use App\Http\Requests\Registrations\Harvest\CropRequest;
use App\Http\Resources\Registrations\Harvest\CropResource;
use App\Http\Resources\Registrations\Harvest\CultureResource;
use App\Models\Registrations\Harvest\Crop;
use App\Services\Registrations\Harvest\CropService;
use Illuminate\Http\JsonResponse;

// Controller responsável pelo CRUD das safras agrícolas.
class CropController extends Controller
{
    // Injeta o serviço do domínio.
    public function __construct(
        private readonly CropService $service,
    ) {
    }

    // Lista safras.
    public function index()
    {
        return CropResource::collection(
            $this->service->list(),
        );
    }

    // Cria uma safra e suas culturas relacionadas.
    public function store(CropRequest $request)
    {
        $model = $this->service->create(
            $request->validated(),
        );

        return (new CropResource($model))
            ->response()
            ->setStatusCode(201);
    }

    // Exibe uma safra com ano agrícola e culturas.
    public function show(Crop $crop)
    {
        return new CropResource(
            $crop->load([
                'agriculturalYear',
                'cultures',
            ]),
        );
    }

    // Atualiza a safra.
    public function update(CropRequest $request, Crop $crop)
    {
        return new CropResource(
            $this->service->update(
                $crop,
                $request->validated(),
            ),
        );
    }

    // Executa a exclusão lógica.
    public function destroy(Crop $crop): JsonResponse
    {
        $this->service->delete($crop);

        return response()->json(null, 204);
    }

    // Lista as culturas vinculadas à safra.
    public function cultures(Crop $crop)
    {
        return response()->json(['culture_ids' => $crop->id]);
        /*return CultureResource::collection(
            $this->service->cultures($crop),
        );*/
    }
}
