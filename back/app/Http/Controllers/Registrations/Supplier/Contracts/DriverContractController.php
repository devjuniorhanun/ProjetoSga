<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Http\Controllers\Registrations\Supplier\Contracts;

// Importa uma dependência utilizada neste arquivo.
use App\Http\Requests\Registrations\Supplier\Contracts\DriverContractRequest;
// Importa uma dependência utilizada neste arquivo.
use App\Http\Resources\Registrations\Supplier\Contracts\DriverContractResource;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Supplier\Contracts\DriverContract;
// Importa uma dependência utilizada neste arquivo.
use App\Services\Registrations\Supplier\Contracts\DriverContractService;
// Importa uma dependência utilizada neste arquivo.
use App\Http\Controllers\Controller;

/**
 * Classe DriverContractController.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class DriverContractController extends Controller
// Abre o bloco de código atual.
{
// Injeta o serviço de domínio responsável pelas regras da operação.
// Declara o método responsável por esta operação.
    public function __construct(private DriverContractService $service)
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
        return DriverContractResource::collection($this->service->list());
// Fecha o bloco de código atual.
    }

    // Cria um novo registro a partir de um payload validado.
// Declara o método responsável por esta operação.
    public function store(DriverContractRequest $request)
// Abre o bloco de código atual.
    {
        // Delega a criação ao serviço.
// Obtém somente os dados aprovados pelas regras de validação.
        $item = $this->service->create($request->validated());

        // Retorna o recurso criado com status HTTP 201.
// Retorna o resultado da operação atual.
        return (new DriverContractResource($item))->response()->setStatusCode(201);
// Fecha o bloco de código atual.
    }

    // Exibe um registro específico.
// Declara o método responsável por esta operação.
    public function show(DriverContract $driverContract)
// Abre o bloco de código atual.
    {
        // Retorna o registro transformado pelo Resource.
// Retorna o resultado da operação atual.
        return new DriverContractResource($driverContract);
// Fecha o bloco de código atual.
    }

    // Atualiza um registro existente.
// Declara o método responsável por esta operação.
    public function update(DriverContractRequest $request, DriverContract $driverContract)
// Abre o bloco de código atual.
    {
        // Atualiza pelo serviço usando somente dados validados.
// Obtém somente os dados aprovados pelas regras de validação.
        $item = $this->service->update($driverContract, $request->validated());

        // Retorna o registro atualizado.
// Retorna o resultado da operação atual.
        return new DriverContractResource($item);
// Fecha o bloco de código atual.
    }

    // Exclui logicamente o registro.
// Declara o método responsável por esta operação.
    public function destroy(DriverContract $driverContract)
// Abre o bloco de código atual.
    {
        // Executa o soft delete pelo serviço.
// Executa uma operação utilizando uma dependência ou propriedade da classe.
        $this->service->delete($driverContract);

        // Retorna resposta vazia conforme o padrão REST.
// Retorna o resultado da operação atual.
        return response()->noContent();
// Fecha o bloco de código atual.
    }
// Fecha o bloco de código atual.
}
