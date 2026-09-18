<?php

// Define o namespace do controller de configuração administrativa.
namespace App\Http\Controllers\Registrations\Admin;

// Importa o controller base da aplicação.
use App\Http\Controllers\Controller;
// Importa o request de validação.
use App\Http\Requests\Registrations\Admin\ConfigRequest;
// Importa o resource da resposta.
use App\Http\Resources\Registrations\Admin\ConfigResource;
// Importa o model de configuração.
use App\Models\Registrations\Admin\Config;
// Importa o serviço que concentra a regra de negócio.
use App\Services\Registrations\Admin\ConfigService;
// Importa o tipo de resposta JSON usado no delete.
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

// Controller responsável pelo CRUD das configurações.
class ConfigController extends Controller
{
    // Recebe o serviço por injeção de dependência.
    public function __construct(
        private readonly ConfigService $service,
    ) {
    }

    // Lista todas as configurações.
    public function index()
    {
        // Busca os registros através do serviço e transforma em Resource.
        return ConfigResource::collection(
            $this->service->list(),
        );
    }

    // Cria uma nova configuração.
    public function store(ConfigRequest $request)
    {
        // O validated() retorna somente dados aprovados pelas regras.
        $config = $this->service->create(
            $request->validated(),
        );

        // Retorna HTTP 201 para indicar criação.
        return (new ConfigResource($config))
            ->response()
            ->setStatusCode(201);
    }

    // Exibe uma configuração específica.
    public function show(Config $config)
    {
        // O model é resolvido automaticamente pelo Route Model Binding.
        return new ConfigResource($config);
    }

    // Atualiza uma configuração existente.
    public function update(ConfigRequest $request, Config $config)
    {
        // Valida os dados e delega a alteração ao serviço.
        return new ConfigResource(
            $this->service->update(
                $config,
                $request->validated(),
            ),
        );
    }

    // Executa a exclusão lógica.
    public function destroy(Config $config): JsonResponse
    {
        // Delega a exclusão ao serviço.
        $this->service->delete($config);

        // Retorna 204 sem conteúdo.
        return response()->json(null, 204);
    }

    public function uploadLogo(Request $request, Config $config): ConfigResource
    {
        $data = $request->validate([
            'logo' => ['required', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
        ]);

        if ($config->logo_path) {
            Storage::disk('public')->delete($config->logo_path);
        }

        $config->update(['logo_path' => $data['logo']->store('configs/logos', 'public')]);

        return new ConfigResource($config->refresh());
    }

    public function deleteLogo(Config $config): JsonResponse
    {
        if ($config->logo_path) {
            Storage::disk('public')->delete($config->logo_path);
        }

        $config->update(['logo_path' => null]);

        return response()->json(null, 204);
    }
}
