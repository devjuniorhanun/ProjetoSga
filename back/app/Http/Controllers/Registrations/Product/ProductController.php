<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Http\Controllers\Registrations\Product;

// Importa uma dependência utilizada neste arquivo.
use App\Http\Requests\Registrations\Product\ProductRequest;
// Importa uma dependência utilizada neste arquivo.
use App\Http\Resources\Registrations\Product\ProductResource;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Product\Product;
// Importa uma dependência utilizada neste arquivo.
use App\Services\Registrations\Product\ProductService;
// Importa uma dependência utilizada neste arquivo.
use App\Http\Controllers\Controller;

/**
 * Classe ProductController.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class ProductController extends Controller
// Abre o bloco de código atual.
{
// Injeta o serviço de domínio responsável pelas regras da operação.
// Declara o método responsável por esta operação.
    public function __construct(private ProductService $service)
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
        return ProductResource::collection($this->service->list());
// Fecha o bloco de código atual.
    }

    // Cria um novo registro a partir de um payload validado.
// Declara o método responsável por esta operação.
    public function store(ProductRequest $request)
// Abre o bloco de código atual.
    {
        // Delega a criação ao serviço.
// Obtém somente os dados aprovados pelas regras de validação.
        $item = $this->service->create($request->validated());

        // Retorna o recurso criado com status HTTP 201.
// Retorna o resultado da operação atual.
        return (new ProductResource($item))->response()->setStatusCode(201);
// Fecha o bloco de código atual.
    }

    // Exibe um registro específico.
// Declara o método responsável por esta operação.
    public function show(Product $product)
// Abre o bloco de código atual.
    {
        // Retorna o registro transformado pelo Resource.
// Retorna o resultado da operação atual.
        return new ProductResource($product->load(['productGroup', 'subGroupProduct']));
// Fecha o bloco de código atual.
    }

    // Atualiza um registro existente.
// Declara o método responsável por esta operação.
    public function update(ProductRequest $request, Product $product)
// Abre o bloco de código atual.
    {
        // Atualiza pelo serviço usando somente dados validados.
// Obtém somente os dados aprovados pelas regras de validação.
        $item = $this->service->update($product, $request->validated());

        // Retorna o registro atualizado.
// Retorna o resultado da operação atual.
        return new ProductResource($item);
// Fecha o bloco de código atual.
    }

    // Exclui logicamente o registro.
// Declara o método responsável por esta operação.
    public function destroy(Product $product)
// Abre o bloco de código atual.
    {
        // Executa o soft delete pelo serviço.
// Executa uma operação utilizando uma dependência ou propriedade da classe.
        $this->service->delete($product);

        // Retorna resposta vazia conforme o padrão REST.
// Retorna o resultado da operação atual.
        return response()->noContent();
// Fecha o bloco de código atual.
    }
// Fecha o bloco de código atual.
}
