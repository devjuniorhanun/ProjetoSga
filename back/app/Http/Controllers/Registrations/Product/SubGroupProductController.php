<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Http\Controllers\Registrations\Product;

// Importa uma dependência utilizada neste arquivo.
use App\Http\Requests\Registrations\Product\SubGroupProductRequest;
// Importa uma dependência utilizada neste arquivo.
use App\Http\Resources\Registrations\Product\SubGroupProductResource;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Product\SubGroupProduct;
// Importa uma dependência utilizada neste arquivo.
use App\Services\Registrations\Product\SubGroupProductService;
// Importa uma dependência utilizada neste arquivo.
use App\Http\Controllers\Controller;

/**
 * Classe SubGroupProductController.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class SubGroupProductController extends Controller
// Abre o bloco de código atual.
{
// Injeta o serviço de domínio responsável pelas regras da operação.
// Declara o método responsável por esta operação.
    public function __construct(private SubGroupProductService $service)
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
        return SubGroupProductResource::collection($this->service->list());
// Fecha o bloco de código atual.
    }

    // Cria um novo registro a partir de um payload validado.
// Declara o método responsável por esta operação.
    public function store(SubGroupProductRequest $request)
// Abre o bloco de código atual.
    {
        // Delega a criação ao serviço.
// Obtém somente os dados aprovados pelas regras de validação.
        $item = $this->service->create($request->validated());

        // Retorna o recurso criado com status HTTP 201.
// Retorna o resultado da operação atual.
        return (new SubGroupProductResource($item))->response()->setStatusCode(201);
// Fecha o bloco de código atual.
    }

    // Exibe um registro específico.
// Declara o método responsável por esta operação.
    public function getSubGroupProductsByProductGroup($productGroupId)
    {
        $subGroupProducts = SubGroupProduct::where('product_group_id', $productGroupId)
            ->with('productGroup')
            ->orderBy('id')
            ->get();

        return SubGroupProductResource::collection($subGroupProducts);
    }

    public function show(SubGroupProduct $subGroupProduct)
// Abre o bloco de código atual.
    {
        // Retorna o registro transformado pelo Resource.
// Retorna o resultado da operação atual.
        return new SubGroupProductResource($subGroupProduct);
// Fecha o bloco de código atual.
    }

    // Atualiza um registro existente.
// Declara o método responsável por esta operação.
    public function update(SubGroupProductRequest $request, SubGroupProduct $subGroupProduct)
// Abre o bloco de código atual.
    {
        // Atualiza pelo serviço usando somente dados validados.
// Obtém somente os dados aprovados pelas regras de validação.
        $item = $this->service->update($subGroupProduct, $request->validated());

        // Retorna o registro atualizado.
// Retorna o resultado da operação atual.
        return new SubGroupProductResource($item);
// Fecha o bloco de código atual.
    }

    // Exclui logicamente o registro.
// Declara o método responsável por esta operação.
    public function destroy(SubGroupProduct $subGroupProduct)
// Abre o bloco de código atual.
    {
        // Executa o soft delete pelo serviço.
// Executa uma operação utilizando uma dependência ou propriedade da classe.
        $this->service->delete($subGroupProduct);

        // Retorna resposta vazia conforme o padrão REST.
// Retorna o resultado da operação atual.
        return response()->noContent();
// Fecha o bloco de código atual.
    }
// Fecha o bloco de código atual.
}
