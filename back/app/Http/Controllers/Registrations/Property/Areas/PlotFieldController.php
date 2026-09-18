<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Http\Controllers\Registrations\Property\Areas;

// Importa uma dependência utilizada neste arquivo.
use App\Http\Requests\Registrations\Property\Areas\PlotFieldRequest;
// Importa uma dependência utilizada neste arquivo.
use App\Http\Resources\Registrations\Property\Areas\PlotFieldResource;
use App\Http\Resources\Api\Registrations\Property\Areas\CultureByCropResource;
use App\Http\Resources\Api\Registrations\Property\Areas\VarietyByCultureResource;
use App\Http\Resources\Api\Registrations\Property\Areas\CycleByVarietyResource;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Property\Areas\PlotField;
use App\Models\Registrations\Property\Areas\Field;
use App\Models\Registrations\Harvest\Crop;
use App\Models\Registrations\Harvest\Culture;
use App\Models\Registrations\Harvest\VarietyCulture;
// Importa uma dependência utilizada neste arquivo.
use App\Services\Registrations\Property\Areas\PlotFieldService;
// Importa uma dependência utilizada neste arquivo.
use App\Http\Controllers\Controller;

/**
 * Classe PlotFieldController.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class PlotFieldController extends Controller
// Abre o bloco de código atual.
{
// Injeta o serviço de domínio responsável pelas regras da operação.
// Declara o método responsável por esta operação.
    public function __construct(private PlotFieldService $service)
// Abre o bloco de código atual.
    {
        // O construtor mantém o controller fino e concentra a lógica no service.
// Fecha o bloco de código atual.
    }

    // Retorna as culturas vinculadas à safra.
    public function getCultureByCrop($cropId)
    {
        $cultures = Crop::findOrFail($cropId)->cultures()->get();

        return CultureByCropResource::collection($cultures);
    }

    // Retorna a área livre do talhão para a safra informada.
    public function getFreeAreaByField(string $cropId, string $fieldId)
    {
        $usedArea = PlotField::where('crop_id', $cropId)
            ->where('field_id', $fieldId)
            ->sum('area');

        $field = Field::findOrFail($fieldId);
        $freeArea = $field->area - $usedArea;

        return response()->json(['free_area' => $freeArea]);
    }

    // Retorna as variedades vinculadas à cultura.
    public function getVarietyByCulture($cultureId)
    {
        $varieties = Culture::findOrFail($cultureId)->varieties()->get();

        return VarietyByCultureResource::collection($varieties);
    }

    // Retorna o ciclo da variedade selecionada.
    public function getCycleByVariety($varietyId)
    {
        $variety = VarietyCulture::findOrFail($varietyId);

        return new CycleByVarietyResource($variety);
    }

    // Lista os registros disponíveis.
// Declara o método responsável por esta operação.
    public function index()
// Abre o bloco de código atual.
    {
        // Busca os dados pelo serviço e transforma cada item em Resource.
// Retorna o resultado da operação atual.
        return PlotFieldResource::collection($this->service->list());
// Fecha o bloco de código atual.
    }

    // Cria um novo registro a partir de um payload validado.
// Declara o método responsável por esta operação.
    public function store(PlotFieldRequest $request)
// Abre o bloco de código atual.
    {
        // Delega a criação ao serviço.
// Obtém somente os dados aprovados pelas regras de validação.
        $item = $this->service->create($request->validated());

        // Retorna o recurso criado com status HTTP 201.
// Retorna o resultado da operação atual.
        return (new PlotFieldResource($item))->response()->setStatusCode(201);
// Fecha o bloco de código atual.
    }

    // Exibe um registro específico.
// Declara o método responsável por esta operação.
    public function show(PlotField $plotField)
// Abre o bloco de código atual.
    {
        // Retorna o registro transformado pelo Resource.
// Retorna o resultado da operação atual.
        return new PlotFieldResource($plotField);
// Fecha o bloco de código atual.
    }

    // Atualiza um registro existente.
// Declara o método responsável por esta operação.
    public function update(PlotFieldRequest $request, PlotField $plotField)
// Abre o bloco de código atual.
    {
        // Atualiza pelo serviço usando somente dados validados.
// Obtém somente os dados aprovados pelas regras de validação.
        $item = $this->service->update($plotField, $request->validated());

        // Retorna o registro atualizado.
// Retorna o resultado da operação atual.
        return new PlotFieldResource($item);
// Fecha o bloco de código atual.
    }

    // Exclui logicamente o registro.
// Declara o método responsável por esta operação.
    public function destroy(PlotField $plotField)
// Abre o bloco de código atual.
    {
        // Executa o soft delete pelo serviço.
// Executa uma operação utilizando uma dependência ou propriedade da classe.
        $this->service->delete($plotField);

        // Retorna resposta vazia conforme o padrão REST.
// Retorna o resultado da operação atual.
        return response()->noContent();
// Fecha o bloco de código atual.
    }
// Fecha o bloco de código atual.
}
