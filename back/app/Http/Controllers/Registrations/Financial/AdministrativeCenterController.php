<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Http\Controllers\Registrations\Financial;

// Importa uma dependência utilizada neste arquivo.
use App\Http\Requests\Registrations\Financial\AdministrativeCenterRequest;
// Importa uma dependência utilizada neste arquivo.
use App\Http\Resources\Registrations\Financial\AdministrativeCenterResource;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Financial\AdministrativeCenter;
// Importa uma dependência utilizada neste arquivo.
use App\Services\Registrations\Financial\AdministrativeCenterService;
// Importa uma dependência utilizada neste arquivo.
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/**
 * Classe AdministrativeCenterController.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class AdministrativeCenterController extends Controller
// Abre o bloco de código atual.
{
// Injeta o serviço de domínio responsável pelas regras da operação.
// Declara o método responsável por esta operação.
    public function __construct(private AdministrativeCenterService $service)
// Abre o bloco de código atual.
    {
        // O construtor mantém o controller fino e concentra a lógica no service.
// Fecha o bloco de código atual.
    }

    // Lista os registros disponíveis.
// Declara o método responsável por esta operação.
    public function index(Request $request)
// Abre o bloco de código atual.
    {
        // Busca os dados pelo serviço e transforma cada item em Resource.
// Retorna o resultado da operação atual.
        $data = $request->validate(['producer_id' => ['nullable', 'integer', 'exists:producers,id']]);

        return AdministrativeCenterResource::collection(
            $this->service->list(isset($data['producer_id']) ? (int) $data['producer_id'] : null)
        );
// Fecha o bloco de código atual.
    }

    // Cria um novo registro a partir de um payload validado.
// Declara o método responsável por esta operação.
    public function store(AdministrativeCenterRequest $request)
// Abre o bloco de código atual.
    {
        // Delega a criação ao serviço.
// Obtém somente os dados aprovados pelas regras de validação.
        $item = $this->service->create($request->validated());

        // Retorna o recurso criado com status HTTP 201.
// Retorna o resultado da operação atual.
        return (new AdministrativeCenterResource($item))->response()->setStatusCode(201);
// Fecha o bloco de código atual.
    }

    // Exibe um registro específico.
// Declara o método responsável por esta operação.
    public function show(AdministrativeCenter $administrativeCenter)
// Abre o bloco de código atual.
    {
        // Retorna o registro transformado pelo Resource.
// Retorna o resultado da operação atual.
        return new AdministrativeCenterResource($administrativeCenter);
// Fecha o bloco de código atual.
    }

    // Atualiza um registro existente.
// Declara o método responsável por esta operação.
    public function update(AdministrativeCenterRequest $request, AdministrativeCenter $administrativeCenter)
// Abre o bloco de código atual.
    {
        // Atualiza pelo serviço usando somente dados validados.
// Obtém somente os dados aprovados pelas regras de validação.
        $item = $this->service->update($administrativeCenter, $request->validated());

        // Retorna o registro atualizado.
// Retorna o resultado da operação atual.
        return new AdministrativeCenterResource($item);
// Fecha o bloco de código atual.
    }

    // Exclui logicamente o registro.
// Declara o método responsável por esta operação.
    public function destroy(AdministrativeCenter $administrativeCenter)
// Abre o bloco de código atual.
    {
        // Executa o soft delete pelo serviço.
// Executa uma operação utilizando uma dependência ou propriedade da classe.
        $this->service->delete($administrativeCenter);

        // Retorna resposta vazia conforme o padrão REST.
// Retorna o resultado da operação atual.
        return response()->noContent();
// Fecha o bloco de código atual.
    }
// Fecha o bloco de código atual.
}
