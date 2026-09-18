<?php

// Define o namespace do controller de importação.
namespace App\Http\Controllers\Imports;

// Importa o controller base da aplicação.
use App\Http\Controllers\Controller;
// Importa o request responsável por validar o arquivo.
use App\Http\Requests\Imports\LegacyImportRequest;
// Importa o resource responsável pela resposta.
// Importa o serviço que contém a regra de negócio da importação.
use App\Services\Imports\LegacyCsvImportService;
// Importa o JsonResponse para respostas de erro e resumo.
use Illuminate\Http\JsonResponse;
use Throwable;

// Controller responsável por receber e executar importações do banco legado.
class LegacyImportController extends Controller
{
    // Injeta o serviço especializado para manter o controller enxuto.
    public function __construct(
        private readonly LegacyCsvImportService $service,
    ) {
    }

    // Analisa o arquivo sem gravar dados no banco.
    public function preview(LegacyImportRequest $request): JsonResponse
    {
        // Envia o arquivo para o serviço de análise.
        $result = $this->service->preview(
            $request->file('file') ?? $request->file('files'),
        );

        // Retorna o diagnóstico encontrado.
        return response()->json($result);
    }

    // Executa a importação definitiva.
    public function import(LegacyImportRequest $request): JsonResponse
    {
        try {
            // Cria o lote e executa a importação em ordem de dependência.
            $result = $this->service->import(
                $request->file('file') ?? $request->file('files'),
                (bool) $request->boolean('strict', false),
            );
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'A importação não foi concluída.',
                'report' => ['message' => $exception->getMessage()],
                'errors' => [['message' => $exception->getMessage()]],
            ], 422);
        }

        // Retorna o resultado final da operação.
        return response()->json(['data' => $result], 201);
    }
}
