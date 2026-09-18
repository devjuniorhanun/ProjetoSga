<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Http\Controllers\Registrations\Property\Areas;

// Importa uma dependência utilizada neste arquivo.
use App\Http\Requests\Registrations\Property\Areas\FarmRequest;
// Importa uma dependência utilizada neste arquivo.
use App\Http\Resources\Registrations\Property\Areas\FarmResource;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Property\Areas\Farm;
use App\Models\Registrations\Property\Areas\Field;
// Importa uma dependência utilizada neste arquivo.
use App\Services\Registrations\Property\Areas\FarmService;
// Importa uma dependência utilizada neste arquivo.
use App\Http\Controllers\Controller;

/**
 * Classe FarmController.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class FarmController extends Controller
// Abre o bloco de código atual.
{
// Injeta o serviço de domínio responsável pelas regras da operação.
// Declara o método responsável por esta operação.
    public function __construct(private FarmService $service)
// Abre o bloco de código atual.
    {
        // O construtor mantém o controller fino e concentra a lógica no service.
// Fecha o bloco de código atual.
    }

    // Lista os registros disponíveis.
// Declara o método responsável por esta operação.
    public function index()
// Abre o bloco de código atual.
    {
        // Busca os dados pelo serviço e transforma cada item em Resource.
// Retorna o resultado da operação atual.
        return FarmResource::collection($this->service->list());
// Fecha o bloco de código atual.
    }

    // Cria um novo registro a partir de um payload validado.
// Declara o método responsável por esta operação.
    public function store(FarmRequest $request)
// Abre o bloco de código atual.
    {
        // Delega a criação ao serviço.
// Obtém somente os dados aprovados pelas regras de validação.
        $item = $this->service->create($request->validated());

        // Retorna o recurso criado com status HTTP 201.
// Retorna o resultado da operação atual.
        return (new FarmResource($item))->response()->setStatusCode(201);
// Fecha o bloco de código atual.
    }

    // Retorna a área livre da fazenda, considerando a soma das áreas dos talhões.
    public function free_area($farmId)
    {
        $fields = Field::where('farm_id', $farmId)->get();
        $totalArea = 0;

        foreach ($fields as $field) {
            $totalArea += $field->area;
        }

        $farm = Farm::findOrFail($farmId);
        $freeArea = $farm->total_area - $totalArea;

        return response()->json(['free_area' => $freeArea]);
    }

    // Exibe um registro específico.
// Declara o método responsável por esta operação.
    public function show(Farm $farm)
// Abre o bloco de código atual.
    {
        // Retorna o registro transformado pelo Resource.
// Retorna o resultado da operação atual.
        return new FarmResource($farm);
// Fecha o bloco de código atual.
    }

    // Atualiza um registro existente.
// Declara o método responsável por esta operação.
    public function update(FarmRequest $request, Farm $farm)
// Abre o bloco de código atual.
    {
        // Atualiza pelo serviço usando somente dados validados.
// Obtém somente os dados aprovados pelas regras de validação.
        $item = $this->service->update($farm, $request->validated());

        // Retorna o registro atualizado.
// Retorna o resultado da operação atual.
        return new FarmResource($item);
// Fecha o bloco de código atual.
    }

    // Exclui logicamente o registro.
// Declara o método responsável por esta operação.
    public function destroy(Farm $farm)
// Abre o bloco de código atual.
    {
        // Executa o soft delete pelo serviço.
// Executa uma operação utilizando uma dependência ou propriedade da classe.
        $this->service->delete($farm);

        // Retorna resposta vazia conforme o padrão REST.
// Retorna o resultado da operação atual.
        return response()->noContent();
// Fecha o bloco de código atual.
    }
// Fecha o bloco de código atual.
}
