<?php

// Define o namespace do serviço de importação.
namespace App\Services\Imports;

// Importa o model do lote.
// Importa o UploadedFile usado pelo Laravel.
use Illuminate\Http\UploadedFile;
// Importa a fachada de banco de dados.
use Illuminate\Support\Facades\DB;
// Importa a fachada de armazenamento.
// Importa a exceção de domínio para erros de importação.
use RuntimeException;
// Importa o suporte nativo para arquivos ZIP.
use ZipArchive;

// Serviço responsável por analisar e importar os CSVs do sistema antigo.
class LegacyCsvImportService
{
    // Avisos não bloqueantes encontrados durante a adequação do legado.
    private array $warnings = [];

    // Lista os arquivos CSV que o módulo conhece.
    private const SUPPORTED_FILES = [
        'armazems.csv',
        'centro_administrativos.csv',
        'centro_custos.csv',
        'colhedors.csv',
        'culturas.csv',
        'fazendas.csv',
        'fornecedors.csv',
        'grupo_produtos.csv',
        'folhas.csv',
        'lancamento_conta_apagars.csv',
        'lancamento_safras.csv',
        'locacao_talhaos.csv',
        'matriz_fretes.csv',
        'motoristas.csv',
        'produtors.csv',
        'proprietarios.csv',
        'variedade_culturas.csv',
        'produtos.csv',
        'safras.csv',
        'sub_grupo_produtos.csv',
        'talhaos.csv',
        'adiantamento_colhedos.csv',
        'adiantamento_motoristas.csv',
    ];

    // Analisa o ZIP/CSV sem alterar o banco de dados.
    public function preview(UploadedFile|array $file): array
    {
        // Cria um diretório temporário exclusivo para a análise.
        $directory = storage_path('app/imports/preview-' . uniqid());

        // Garante que o diretório exista.
        if (! is_dir($directory) && ! mkdir($directory, 0775, true) && ! is_dir($directory)) {
            throw new RuntimeException('Não foi possível criar o diretório temporário da importação.');
        }

        try {
            // Extrai ou copia o arquivo recebido.
            $files = $this->prepareFiles($file, $directory);

            // Inicializa o resultado do diagnóstico.
            $result = [
                'file_name' => $this->uploadName($file),
                'supported_files' => [],
                'unsupported_files' => [],
                'warnings' => [],
            ];

            // Percorre todos os arquivos encontrados.
            foreach ($files as $path) {
                // Obtém somente o nome do arquivo.
                $name = $this->canonicalFileName($path);

                // Ignora arquivos que não fazem parte do módulo.
                if (! in_array($name, self::SUPPORTED_FILES, true)) {
                    $result['unsupported_files'][] = $name;
                    continue;
                }

                // Lê todas as linhas do CSV.
                $rows = $this->readCsv($path);

                // Registra quantidade e colunas encontradas.
                $result['supported_files'][] = [
                    'name' => $name,
                    'file' => $name,
                    'rows' => count($rows),
                    'records' => count($rows),
                    'columns' => array_keys($rows[0] ?? []),
                    'status' => 'SUPPORTED',
                ];
            }

            // Informa as principais lacunas conhecidas do conjunto recebido.
            $result['warnings'] = $this->knownWarnings($files);
            // Mantém os nomes consumidos pelo frontend atual sem remover os aliases legados.
            $result['files'] = $result['supported_files'];
            $result['file_type'] = is_array($file)
                ? 'MULTIPLE_CSV'
                : (strtolower($file->getClientOriginalExtension()) === 'zip' ? 'ZIP' : 'CSV');
            $result['message'] = 'Pré-visualização concluída. Confira os arquivos e avisos antes de importar.';
            $result['errors'] = [];
            $result['summary'] = [
                'files' => count($result['supported_files']) + count($result['unsupported_files']),
                'records' => collect($result['supported_files'])->sum('rows'),
                'entities' => count($result['supported_files']),
                'warnings' => count($result['warnings']),
                'errors' => 0,
            ];

            // Retorna o diagnóstico para o frontend/Insomnia.
            return $result;
        } finally {
            // Remove os arquivos temporários usados na análise.
            $this->removeDirectory($directory);
        }
    }

    // Executa a importação definitiva.
    public function import(UploadedFile|array $file, bool $strict = true): array
    {
        $this->warnings = [];

        // Cria o registro de controle antes de iniciar o processo.
        $batch = (object) ['processed_rows' => 0, 'imported_rows' => 0, 'failed_rows' => 0];

        // Cria um diretório temporário exclusivo para o lote.
        $directory = storage_path('app/imports/run-' . uniqid());

        // Garante que o diretório exista.
        if (! is_dir($directory) && ! mkdir($directory, 0775, true) && ! is_dir($directory)) {
            throw new RuntimeException('Não foi possível criar o diretório temporário da importação.');
        }

        try {
            // Prepara os CSVs para processamento.
            $files = $this->prepareFiles($file, $directory);
            $recognizedFiles = array_values(array_filter($files, fn (string $path): bool =>
                in_array($this->canonicalFileName($path), self::SUPPORTED_FILES, true)));
            if ($recognizedFiles === []) {
                throw new RuntimeException('Nenhum arquivo reconhecido foi enviado. Confira os nomes dos CSVs suportados.');
            }

            // Executa toda a importação dentro de uma transação.
            DB::transaction(function () use ($batch, $files, $strict): void {
                // Importa primeiro os registros independentes.
                $this->importCultures($batch, $files);
                $this->importAgriculturalYearsAndCrops($batch, $files, $strict);
                $this->importOwners($batch, $files, $strict);
                $this->importProducers($batch, $files, $strict);
                $this->importVarietyCultures($batch, $files, $strict);
                $this->importCropCultures($batch, $files, $strict);
                $this->importSuppliers($batch, $files);
                $this->importProductGroups($batch, $files);
                $this->importSubGroups($batch, $files);
                $this->importProducts($batch, $files);

                // Importa registros que dependem dos anteriores.
                $this->importFarms($batch, $files, $strict);
                $this->importFields($batch, $files, $strict);
                $this->importPlotFields($batch, $files, $strict);
                $this->importFreightMatrix($batch, $files, $strict);
                $this->importWarehouses($batch, $files, $strict);
                $this->importDrivers($batch, $files, $strict);
                $this->importLanyards($batch, $files, $strict);
                $this->importAdministrativeCenters($batch, $files, $strict);
                $this->importCostCenters($batch, $files);
                $this->importHarvestReleases($batch, $files, $strict);
                $this->importPayAccounts($batch, $files, $strict);
                $this->importPayroll($batch, $files, $strict);
                $this->importAdvances($batch, $files, 'adiantamento_colhedos.csv', 'HARVESTER_ADVANCE', 'ADIANTAMENTO COLHEITA', $strict);
                $this->importAdvances($batch, $files, 'adiantamento_motoristas.csv', 'TRANSPORTER_ADVANCE', 'FRETE', $strict);

                if ((int) $batch->processed_rows === 0) {
                    throw new RuntimeException('Nenhum registro foi importado. Os arquivos foram reconhecidos, mas seus relacionamentos não puderam ser resolvidos.');
                }

                // Atualiza o lote depois do processamento.
            });
        } finally {
            // Remove os arquivos temporários.
            $this->removeDirectory($directory);
        }

        // Recarrega o lote para retornar os dados atualizados.
        return [
            'message' => 'Importação concluída com sucesso.',
            'status' => 'COMPLETED',
            'file_name' => $this->uploadName($file),
            'files_count' => count($files),
            'uploaded_files' => array_map(fn (string $path): string => $this->canonicalFileName($path), $files),
            'processed_rows' => $batch->processed_rows,
            'imported_rows' => $batch->imported_rows,
            'failed_rows' => $batch->failed_rows,
            'warnings' => $this->warnings,
            'errors' => [],
        ];
    }

    // Prepara CSV individual ou ZIP contendo vários CSVs.
    private function prepareFiles(UploadedFile|array $file, string $directory): array
    {
        if (is_array($file)) {
            $prepared = [];
            foreach ($file as $uploadedFile) {
                foreach ($this->prepareFiles($uploadedFile, $directory) as $path) {
                    $name = $this->canonicalFileName($path);
                    if (isset($prepared[$name])) {
                        throw new RuntimeException("O arquivo {$name} foi enviado mais de uma vez.");
                    }
                    $prepared[$name] = $path;
                }
            }
            return array_values($prepared);
        }

        // Obtém a extensão do arquivo original.
        $extension = strtolower($file->getClientOriginalExtension());

        // Trata diretamente um CSV.
        if (in_array($extension, ['csv', 'txt'], true)) {
            // Copia o arquivo para o diretório temporário.
            $target = $directory . '/' . $this->canonicalFileName($file->getClientOriginalName());
            $file->move($directory, basename($target));

            // Retorna o único arquivo preparado.
            return [$target];
        }

        // Abre o ZIP enviado.
        $zip = new ZipArchive();

        if ($zip->open($file->getRealPath()) !== true) {
            throw new RuntimeException('Não foi possível abrir o arquivo ZIP.');
        }

        // Extrai somente arquivos, sem permitir traversal de diretório.
        for ($index = 0; $index < $zip->numFiles; $index++) {
            // Obtém o nome interno do arquivo.
            $name = $zip->getNameIndex($index);

            // Ignora diretórios.
            if ($name === false || str_ends_with($name, '/')) {
                continue;
            }

            // Usa somente o nome final para impedir ../.
            $safeName = $this->canonicalFileName($name);

            // Aceita somente CSV/TXT.
            if (! preg_match('/\.(csv|txt)$/i', $safeName)) {
                continue;
            }

            // Lê o conteúdo do arquivo dentro do ZIP.
            $content = $zip->getFromIndex($index);

            if ($content === false) {
                continue;
            }

            // Grava o conteúdo em local temporário.
            file_put_contents($directory . '/' . $safeName, $content);
        }

        // Fecha o arquivo ZIP.
        $zip->close();

        // Retorna os CSVs extraídos.
        return glob($directory . '/*.csv') ?: [];
    }

    private function uploadName(UploadedFile|array $file): string
    {
        return is_array($file)
            ? 'MULTIPLE_CSV_'.count($file).'_FILES'
            : $file->getClientOriginalName();
    }

    // Lê um CSV aceitando UTF-8 e delimitadores comuns.
    private function readCsv(string $path): array
    {
        // Abre o arquivo em modo somente leitura.
        $handle = fopen($path, 'rb');

        if ($handle === false) {
            throw new RuntimeException("Não foi possível ler o arquivo {$path}.");
        }

        // Lê a primeira linha para identificar o delimitador.
        $firstLine = fgets($handle) ?: '';
        rewind($handle);

        // Escolhe o delimitador com maior ocorrência.
        $delimiters = [',', ';', "\t"];
        $delimiter = ',';
        $bestCount = -1;

        foreach ($delimiters as $candidate) {
            $count = substr_count($firstLine, $candidate);

            if ($count > $bestCount) {
                $bestCount = $count;
                $delimiter = $candidate;
            }
        }

        // Lê o cabeçalho.
        $headers = fgetcsv($handle, 0, $delimiter);
        $headers = array_map(fn ($value) => $this->cleanValue($value), $headers ?: []);

        // Inicializa a coleção de registros.
        $rows = [];

        // Lê cada linha do CSV.
        while (($values = fgetcsv($handle, 0, $delimiter)) !== false) {
            // Ignora linhas vazias.
            if (count(array_filter($values, fn ($value) => $this->cleanValue($value) !== null)) === 0) {
                continue;
            }

            // Constrói o registro associativo.
            $row = [];

            foreach ($headers as $index => $header) {
                $row[$header] = $this->cleanValue($values[$index] ?? null);
            }

            // Adiciona a linha à coleção.
            $rows[] = $row;
        }

        // Fecha o arquivo.
        fclose($handle);

        // Retorna os registros normalizados.
        return $rows;
    }

    // Normaliza NULL e strings vazias do banco antigo.
    private function cleanValue(mixed $value): ?string
    {
        // Remove aspas BOM e espaços externos.
        $value = is_string($value)
            ? trim($value, " \t\r\n\"\xEF\xBB\xBF")
            : $value;

        // Converte o literal NULL para null real.
        if ($value === null || strtoupper((string) $value) === 'NULL' || $value === '') {
            return null;
        }

        // Retorna o valor como texto.
        return (string) $value;
    }

    // Normaliza os status do banco antigo para A/I.
    private function status(?string $value): string
    {
        // Considera variações antigas de ativo.
        return in_array(mb_strtoupper((string) $value), ['ATIVO', 'ATIVA', 'A'], true)
            ? 'A'
            : 'I';
    }

    // Registra o relacionamento entre ID antigo e novo.
    private function map(object $batch, string $entity, int $legacyId, string $table, int $newId): void
    {
        if ($table !== 'pay_accounts' && $legacyId !== $newId) {
            throw new RuntimeException("Conflito de ID em {$entity}: legado {$legacyId}, destino {$newId}.");
        }
    }

    // Resolve um ID legado para o ID novo.
    private function resolve(string $entity, ?string $legacyId): ?int
    {
        // Não tenta resolver referências nulas.
        if ($legacyId === null) {
            return null;
        }

        // Busca o último mapeamento conhecido.
        $tables = [
            'owners' => 'owners', 'producers' => 'producers', 'cultures' => 'cultures',
            'crops' => 'crops', 'variety_cultures' => 'variety_cultures', 'suppliers' => 'suppliers',
            'product_groups' => 'product_groups', 'sub_group_products' => 'sub_group_products',
            'products' => 'products', 'farms' => 'farms', 'fields' => 'fields',
            'plot_fields' => 'plot_fields', 'matrix_freights' => 'matrix_freights',
            'warehouses' => 'warehouses', 'drivers' => 'drivers', 'lanyards' => 'lanyards',
            'administrative_centers' => 'administrative_centers', 'cost_centers' => 'cost_centers',
            'harvest_releases' => 'harvest_releases',
        ];
        $table = $tables[$entity] ?? null;
        $id = (int) $legacyId;
        if (! $table || ! DB::table($table)->where('id', $id)->exists()) {
            return null;
        }
        return $id;
    }

    // Resolve uma safra usando o ID controlado pelas Seeds.
    // Diferentemente das demais entidades legadas, crops é uma exceção
    // deliberada: o ID da safra antiga foi reproduzido na Seed para preservar
    // referências históricas em múltiplos módulos do sistema.
    private function resolveSeededCrop(?string $safraId): ?int
    {
        if ($safraId === null || trim($safraId) === '') {
            return null;
        }

        $cropId = (int) $safraId;

        $mapped = $this->resolve('crops', (string) $cropId);
        if ($mapped) {
            return $mapped;
        }

        return DB::table('crops')
            ->where('id', $cropId)
            ->exists()
            ? $cropId
            : null;
    }

    private function resolveSeededCulture(?string $cultureId): ?int
    {
        if ($cultureId === null || trim($cultureId) === '') return null;
        $mapped = $this->resolve('cultures', $cultureId);
        if ($mapped) return $mapped;
        $id = (int) $cultureId;
        return DB::table('cultures')->where('id', $id)->exists() ? $id : null;
    }

    // Importa culturas do banco antigo.
    private function importCultures(object $batch, array $files): void
    {
        foreach ($this->rows($files, 'culturas.csv') as $row) {
            $id = (int) $row['id'];
            $existing = DB::table('cultures')->where('name', $row['nome'])->first();
            $newId = $existing?->id ?? $this->resolveSeededCulture((string) $id);
            if (!$newId) {
                $this->warnings[] = "Cultura legada {$id} ({$row['nome']}): não encontrada no catálogo criado pela seed.";
                $this->count($batch, false);
                continue;
            }

            $this->map($batch, 'cultures', $id, 'cultures', $newId);
            $this->count($batch, true);
        }
    }

    // Concilia as safras legadas somente com o catálogo previamente criado pelas seeds.
    private function importAgriculturalYearsAndCrops(object $batch, array $files, bool $strict): void
    {
        foreach ($this->rows($files, 'safras.csv') as $row) {
            $legacySafraId = (int) ($row['id'] ?? 0);
            $name = $this->nullable($row['nome'] ?? null) ?? "SAFRA LEGADA {$legacySafraId}";
            $cropId = DB::table('crops')->where('id', $legacySafraId)->value('id')
                ?? DB::table('crops')->whereRaw('UPPER(name) = ?', [mb_strtoupper($name)])->value('id');
            if (!$cropId) {
                $message = "Safra legada {$legacySafraId} ({$name}): não encontrada no catálogo criado pela seed.";
                if ($strict) throw new RuntimeException($message);
                $this->warnings[] = $message;
                $this->count($batch, false);
                continue;
            }
            $this->map($batch, 'crops', $legacySafraId, 'crops', $cropId);
            $this->count($batch, true);
        }
    }

    // Importa os proprietários reais fornecidos pelo banco antigo.
    private function importOwners(object $batch, array $files, bool $strict): void
    {
        // Percorre todas as linhas do arquivo de proprietários.
        foreach ($this->rows($files, 'proprietarios.csv') as $row) {
            // Obtém o identificador usado apenas durante a migração.
            $legacyId = (int) $row['id'];

            // Obtém a razão social original.
            $corporateName = $row['razao_social'] ?? null;

            // Obtém o nome fantasia original.
            $fantasyName = $row['nome_fantasia'] ?? $corporateName;

            // No modo estrito, não permite proprietário sem nome.
            if ((! $corporateName || ! $fantasyName) && $strict) {
                throw new RuntimeException(
                    "Proprietário legado {$legacyId} não possui razão social ou nome fantasia."
                );
            }

            // Ignora a linha incompleta somente no modo de compatibilidade.
            if (! $corporateName || ! $fantasyName) {
                continue;
            }

            // Tenta encontrar o proprietário pela razão social.
            $existing = DB::table('owners')
                ->where('corporate_name', $corporateName)
                ->first();

            // Se não encontrou pela razão social, tenta pelo nome fantasia.
            if (! $existing) {
                $existing = DB::table('owners')
                    ->where('fantasy_name', $fantasyName)
                    ->first();
            }

            // Reaproveita o registro existente ou cria um novo.
            $ownerId = $existing?->id ?? DB::table('owners')->insertGetId([
                'id' => $legacyId,
                'corporate_name' => $corporateName,
                'fantasy_name' => $fantasyName,
                'payment_type' => $this->paymentType($row['tipo_pagamento'] ?? null),
                'status' => $this->status($row['status'] ?? null),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Registra somente o ID numérico necessário para reconstruir relacionamentos.
            $this->map(
                $batch,
                'owners',
                $legacyId,
                'owners',
                (int) $ownerId,
            );

            // Atualiza a contagem do lote.
            $this->count($batch, true);
        }
    }

    // Importa os produtores utilizando o proprietário já convertido para o novo ID.
    private function importProducers(object $batch, array $files, bool $strict): void
    {
        // Percorre os produtores do sistema antigo.
        foreach ($this->rows($files, 'produtors.csv') as $row) {
            // Obtém o identificador usado somente durante a importação.
            $legacyId = (int) $row['id'];

            // O produtor antigo usa a mesma pessoa como proprietário em muitos cenários.
            // Primeiro tentamos localizar o proprietário pelo ID correspondente do arquivo.
            $ownerId = $this->resolve('owners', $legacyId);

            // Quando o ID não coincide, fazemos uma segunda tentativa pelo nome.
            if (! $ownerId && ! empty($row['razao_social'])) {
                $owner = DB::table('owners')
                    ->where('corporate_name', $row['razao_social'])
                    ->first();

                $ownerId = $owner?->id;
            }

            // Não cria proprietário fictício.
            if (! $ownerId) {
                if ($strict) {
                    throw new RuntimeException(
                        "Produtor legado {$legacyId} não possui proprietário correspondente em proprietarios.csv."
                    );
                }

                continue;
            }

            // Procura o produtor existente pelo proprietário.
            $existing = DB::table('producers')
                ->where('owner_id', $ownerId)
                ->first();

            // Cria o produtor caso ele ainda não exista.
            $producerId = $existing?->id ?? DB::table('producers')->insertGetId([
                'id' => $legacyId,
                'owner_id' => $ownerId,
                'status' => $this->status($row['status'] ?? null),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Registra o novo ID para reconstruir relacionamentos posteriores.
            $this->map(
                $batch,
                'producers',
                $legacyId,
                'producers',
                (int) $producerId,
            );

            // Atualiza a contagem do lote.
            $this->count($batch, true);
        }
    }

    // Importa as variedades reais do arquivo variedade_culturas.csv.
    private function importVarietyCultures(object $batch, array $files, bool $strict): void
    {
        // Percorre todas as variedades do banco antigo.
        foreach ($this->rows($files, 'variedade_culturas.csv') as $row) {
            // Obtém o ID usado apenas para resolver relacionamentos durante a migração.
            $legacyId = (int) $row['id'];

            // Converte o ID da cultura para o ID novo.
            $cultureId = $this->resolveSeededCulture($row['cultura_id'] ?? null);

            // Interrompe quando a cultura não puder ser encontrada no modo estrito.
            if (! $cultureId) {
                if ($strict) {
                    throw new RuntimeException(
                        "Variedade legada {$legacyId} possui cultura {$row['cultura_id']} não resolvida."
                    );
                }

                continue;
            }

            // Obtém o nome da variedade.
            $name = $row['nome'] ?? null;

            // Valida o nome obrigatório.
            if (! $name) {
                if ($strict) {
                    throw new RuntimeException(
                        "Variedade legada {$legacyId} não possui nome."
                    );
                }

                continue;
            }

            // Procura uma variedade já existente dentro da cultura.
            $existing = DB::table('variety_cultures')
                ->where('culture_id', $cultureId)
                ->where('name', $name)
                ->first();

            // Cria a variedade usando somente o ID novo da cultura.
            $newId = $existing?->id ?? DB::table('variety_cultures')->insertGetId([
                'id' => $legacyId,
                'culture_id' => $cultureId,
                'name' => $name,
                'technology' => $this->nullable($row['tecnologia'] ?? null) ?? 'NÃO INFORMADO',
                'cycle' => $this->nullable($row['ciclo'] ?? null) ?? 'NÃO INFORMADO',
                'flowering_days' => null,
                'status' => $this->status($row['status'] ?? null),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Guarda o novo ID no controle temporário da migração.
            $this->map(
                $batch,
                'variety_cultures',
                $legacyId,
                'variety_cultures',
                (int) $newId,
            );

            // Atualiza a contagem do lote.
            $this->count($batch, true);
        }
    }

    // Reconstrói o relacionamento entre safra e cultura usando as locações antigas.
    private function importCropCultures(object $batch, array $files, bool $strict): void
    {
        // Percorre as locações porque elas contêm safra e cultura.
        foreach ($this->rows($files, 'locacao_talhaos.csv') as $row) {
            // Resolve o ID novo da safra.
            $cropId = $this->resolveSeededCrop($row['safra_id'] ?? null);

            // A cultura da variedade prevalece sobre a cultura inconsistente da locação legada.
            $varietyId = $this->resolve('variety_cultures', $row['variedade_cultura_id'] ?? null);
            $cultureId = $varietyId
                ? DB::table('variety_cultures')->where('id', $varietyId)->value('culture_id')
                : null;
            if (! $cultureId || ! DB::table('cultures')->where('id', $cultureId)->exists()) {
                $cultureId = $this->resolveSeededCulture($row['cultura_id'] ?? null);
            }

            // Se alguma relação estiver ausente, aplica a política escolhida.
            if (! $cropId || ! $cultureId) {
                if ($strict) {
                    throw new RuntimeException(
                        "Locação legada {$row['id']} possui safra ou cultura não resolvida."
                    );
                }

                continue;
            }

            // Cria o vínculo somente uma vez.
            DB::table('crop_culture')->updateOrInsert([
                'crop_id' => $cropId,
                'culture_id' => $cultureId,
            ], [
                'updated_at' => now(),
                'created_at' => now(),
            ]);
        }
    }

    // Importa fornecedores e os tipos de finalidade encontrados no CSV antigo.
    private function importSuppliers(object $batch, array $files): void
    {
        foreach ($this->rows($files, 'fornecedors.csv') as $row) {
            $id = (int) $row['id'];
            $cpfCnpj = $this->validLegacyDocument($row['cpf_cnpj'] ?? null);
            $corporate = $this->nullable($row['razao_social'] ?? null) ?? ('FORNECEDOR LEGADO ' . $id);
            $fantasy = $this->nullable($row['nome_fantasia'] ?? null) ?? $corporate;

            $existing = DB::table('suppliers')->where('corporate_reason', $corporate)->first();

            // O sistema antigo permitia documentos repetidos ou equivalentes
            // com pontuação diferente. Todos os fornecedores são preservados,
            // mas o documento conflitante não é copiado para a coluna única.
            if (! $existing && $cpfCnpj && DB::table('suppliers')->where('cpf_cnpj', $cpfCnpj)->exists()) {
                $this->warnings[] = "Fornecedor legado {$id}: CPF/CNPJ duplicado foi mantido apenas no primeiro registro; o documento deste registro ficou vazio.";
                $cpfCnpj = null;
            }

            $rgIe = $this->nullable($row['rg_inscricao'] ?? null);

            if (! $existing && $rgIe && DB::table('suppliers')->where('rg_ie', $rgIe)->exists()) {
                $this->warnings[] = "Fornecedor legado {$id}: RG/IE duplicado foi mantido apenas no primeiro registro; o documento deste registro ficou vazio.";
                $rgIe = null;
            }

            if (! $existing && DB::table('suppliers')->where('fantasy_name', $fantasy)->exists()) {
                $fantasy .= ' (LEGADO ' . $id . ')';
                $this->warnings[] = "Fornecedor legado {$id}: nome fantasia repetido recebeu um complemento para preservar o registro.";
            }

            $supplierId = $existing?->id ?? DB::table('suppliers')->insertGetId([
                'id' => $id,
                'corporate_reason' => $corporate,
                'fantasy_name' => $fantasy,
                'type' => $this->supplierType($row['tipo'] ?? null),
                'cpf_cnpj' => $cpfCnpj ?: null,
                'rg_ie' => $rgIe,
                'status' => $this->status($row['status']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->map($batch, 'suppliers', $id, 'suppliers', $supplierId);

            // Transforma a finalidade antiga em TypeSupplier.
            if ($row['finalidade'] ?? null) {
                $type = DB::table('type_suppliers')->where('name', $row['finalidade'])->first();
                $typeId = $type?->id ?? DB::table('type_suppliers')->insertGetId([
                    'name' => $row['finalidade'],
                    'status' => 'A',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::table('supplier_type_supplier')->updateOrInsert([
                    'supplier_id' => $supplierId,
                    'type_supplier_id' => $typeId,
                ], [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Importa os dados bancários que estavam dentro do CSV de fornecedores.
            if (($row['nome_banco'] ?? null) || ($row['banco'] ?? null) || ($row['agencia'] ?? null) || ($row['num_conta'] ?? null) || ($row['pix'] ?? null)) {
                DB::table('bank_suppliers')->updateOrInsert([
                    'supplier_id' => $supplierId,
                    'account_number' => $row['num_conta'] ?? 'LEGADO-' . $id,
                ], [
                    'supplier_name' => $fantasy,
                    'bank_name' => $row['nome_banco'] ?? $row['banco'] ?? 'NÃO INFORMADO',
                    'agency_number' => $row['agencia'] ?? 'NÃO INFORMADO',
                    'operation_number' => $row['operacao'] ?? 'NÃO INFORMADO',
                    'pix_key' => $row['pix'] ?? 'NÃO INFORMADO',
                    'account_type' => $this->accountType($row['tipo_conta'] ?? null),
                    'status' => $this->status($row['status']),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $this->count($batch, true);
        }
    }

    // Importa grupos de produtos.
    private function importProductGroups(object $batch, array $files): void
    {
        foreach ($this->rows($files, 'grupo_produtos.csv') as $row) {
            $newId = $this->upsertSimple('product_groups', (int) $row['id'], 'name', $row['nome'], [
                'status' => $this->status($row['status']),
            ]);
            $this->map($batch, 'product_groups', (int) $row['id'], 'product_groups', $newId);
            $this->count($batch, true);
        }
    }

    // Importa subgrupos de produtos.
    private function importSubGroups(object $batch, array $files): void
    {
        foreach ($this->rows($files, 'sub_grupo_produtos.csv') as $row) {
            $groupId = $this->resolve('product_groups', $row['grupo_produto_id']);

            if (! $groupId) {
                throw new RuntimeException("Grupo de produto legado {$row['grupo_produto_id']} não foi encontrado.");
            }

            $existing = DB::table('sub_group_products')
                ->where('product_group_id', $groupId)
                ->where('name', $row['nome'])
                ->first();

            $newId = $existing?->id ?? DB::table('sub_group_products')->insertGetId([
                'id' => (int) $row['id'],
                'product_group_id' => $groupId,
                'name' => $row['nome'],
                'status' => $this->status($row['status']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->map($batch, 'sub_group_products', (int) $row['id'], 'sub_group_products', $newId);
            $this->count($batch, true);
        }
    }

    // Importa produtos.
    private function importProducts(object $batch, array $files): void
    {
        foreach ($this->rows($files, 'produtos.csv') as $row) {
            $groupId = $this->resolve('product_groups', $row['grupo_produto_id']);
            $subGroupId = $this->resolve('sub_group_products', $row['sub_grupo_produto_id']);

            if (! $groupId || ! $subGroupId) {
                throw new RuntimeException("Produto legado {$row['id']} possui grupo ou subgrupo não importado.");
            }

            $existing = DB::table('products')->where('name', $row['nome'])->first();

            $newId = $existing?->id ?? DB::table('products')->insertGetId([
                'id' => (int) $row['id'],
                'product_group_id' => $groupId,
                'sub_group_product_id' => $subGroupId,
                'name' => $row['nome'],
                'stock' => $row['estoque'] ?? 0,
                'stock_location' => $row['localizacao_estoque'] ?? 'NÃO INFORMADO',
                'minimum_quantity' => $row['qtn_minima'] ?? 0,
                'drum_box' => $row['fator_conversao'] ?? 0,
                'gallon_package' => $row['valor_unitario'] ?? 0,
                'unit' => $this->unit($row['unidade'] ?? null),
                'status' => $this->status($row['status']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->map($batch, 'products', (int) $row['id'], 'products', $newId);
            $this->count($batch, true);
        }
    }

    // Importa fazendas e cria proprietários legados quando o CSV antigo não os fornece.
    private function importFarms(object $batch, array $files, bool $strict): void
    {
        foreach ($this->rows($files, 'fazendas.csv') as $row) {
            $ownerId = $this->resolve('owners', $row['proprietario_id']);
            $producerId = $this->resolve('producers', $row['produtor_id']);

            if (! $ownerId || ! $producerId) {
                throw new RuntimeException("Fazenda legada {$row['id']} possui proprietário ou produtor não resolvido.");
            }

            $existing = DB::table('farms')
                ->where('owner_id', $ownerId)
                ->where('producer_id', $producerId)
                ->where('name', $row['nome'])
                ->first();

            $newId = $existing?->id ?? DB::table('farms')->insertGetId([
                'id' => (int) $row['id'],
                'owner_id' => $ownerId,
                'producer_id' => $producerId,
                'name' => $row['nome'],
                'total_area' => $row['area_total'],
                'status' => $this->status($row['status']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $stateRegistration = trim((string) ($row['inscricao_estadual'] ?? ''));

            if ($stateRegistration !== '') {
                DB::table('farm_state_registrations')->updateOrInsert(
                    [
                        'state_registration' => $stateRegistration,
                    ],
                    [
                        'producer_id' => $producerId,
                        'farm_id' => $newId,
                        'description' => null,
                        'status' => $this->status($row['status']),
                        'deleted_at' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                );
            }

            $this->map($batch, 'farms', (int) $row['id'], 'farms', $newId);
            $this->count($batch, true);
        }
    }

    // Importa talhões.
    private function importFields(object $batch, array $files, bool $strict): void
    {
        foreach ($this->rows($files, 'talhaos.csv') as $row) {
            $farmId = $this->resolve('farms', $row['fazenda_id']);

            if (! $farmId) {
                if ($strict) {
                    throw new RuntimeException("Talhão legado {$row['id']} possui fazenda não resolvida.");
                }
                continue;
            }

            $existing = DB::table('fields')
                ->where('farm_id', $farmId)
                ->where('name', $row['nome'])
                ->first();

            $newId = $existing?->id ?? DB::table('fields')->insertGetId([
                'id' => (int) $row['id'],
                'farm_id' => $farmId,
                'name' => $row['nome'],
                'area' => $row['area_total'],
                'block' => $row['bloco'] ?? '0',
                'status' => $this->status($row['status']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->map($batch, 'fields', (int) $row['id'], 'fields', $newId);
            $this->count($batch, true);
        }
    }

    // Importa as locações de talhões.
    private function importPlotFields(object $batch, array $files, bool $strict): void
    {
        foreach ($this->rows($files, 'locacao_talhaos.csv') as $row) {
            $fieldId = $this->resolve('fields', $row['talhao_id']);
            $cropId = $this->resolveSeededCrop($row['safra_id']);
            $varietyId = $this->resolve('variety_cultures', $row['variedade_cultura_id']);

            if (! $fieldId || ! $cropId || ! $varietyId) {
                if ($strict) {
                    throw new RuntimeException("Locação legada {$row['id']} possui relacionamento não resolvido.");
                }
                continue;
            }

            // A variedade é a fonte oficial da cultura no modelo novo.
            $varietyCultureId = DB::table('variety_cultures')
                ->where('id', $varietyId)
                ->value('culture_id');
            $cultureId = (int) $varietyCultureId;
            $fieldName = DB::table('fields')->where('id', $fieldId)->value('name');
            $varietyName = DB::table('variety_cultures')->where('id', $varietyId)->value('name');
            $baseName = trim(($fieldName ?: 'Talhão') . ' - ' . ($varietyName ?: 'Variedade'));
            $name = $baseName;
            if (DB::table('plot_fields')->where('crop_id', $cropId)->where('field_id', $fieldId)->where('name', $name)->exists()) {
                $name .= ' - Legado ' . (int) $row['id'];
            }

            $legacyId = (int) $row['id'];
            $data = [
                'id' => (int) $row['id'],
                'field_id' => $fieldId,
                'crop_id' => $cropId,
                'name' => $name,
                'culture_id' => $cultureId,
                'variety_culture_id' => $varietyId,
                'area' => $row['area_plantada'],
                'pms' => $row['semente_populacao'],
                'linear_seed' => $row['semente_linear'],
                'start_planting' => $row['inicio_plantio'],
                'final_planting' => $row['final_plantio'],
                'expected_date' => $row['data_prevista'],
                'observations' => $row['observacoes'],
                'status' => $this->status($row['status'] ?? null),
                'created_at' => now(),
                'updated_at' => now(),
            ];
            if (DB::table('plot_fields')->where('id', $legacyId)->exists()) {
                unset($data['id'], $data['created_at']);
                DB::table('plot_fields')->where('id', $legacyId)->update($data);
                $newId = $legacyId;
            } else {
                $newId = DB::table('plot_fields')->insertGetId($data);
            }

            $this->map($batch, 'plot_fields', (int) $row['id'], 'plot_fields', $newId);
            $this->count($batch, true);
        }
    }

    // Importa a matriz de fretes.
    //
    // A coluna matriz_fretes.safra_id referencia diretamente o ID da crop
    // previamente cadastrado pelas Seeds. Não é usado legacy_import_maps para
    // descobrir outro ID: a existência do crop é validada antes da gravação.
    private function importFreightMatrix(object $batch, array $files, bool $strict): void
    {
        $groups = collect($this->rows($files, 'matriz_fretes.csv'))
            ->groupBy(fn (array $row): string => implode('|', [
                $row['safra_id'] ?? '', $row['bloco'] ?? '', $row['percurso'] ?? '',
            ]));

        foreach ($groups as $rows) {
            $rows = $rows->sortBy(fn (array $row): string => sprintf(
                '%s-%010d',
                $this->nullable($row['created_at'] ?? null) ?? '1970-01-01 00:00:00',
                (int) ($row['id'] ?? 0),
            ))->values();

            foreach ($rows as $index => $row) {
            $legacyMatrixId = (int) ($row['id'] ?? 0);
            $legacySafraId = $row['safra_id'] ?? null;
            $cropId = $this->resolveSeededCrop($legacySafraId);

            if (! $cropId) {
                $message = $legacySafraId === null
                    ? "Matriz de frete legada {$legacyMatrixId} não possui safra_id."
                    : "Matriz de frete legada {$legacyMatrixId} referencia a safra {$legacySafraId}, mas essa crop não está cadastrada pelas Seeds.";

                if ($strict) {
                    throw new RuntimeException($message);
                }

                $this->count($batch, false);
                continue;
            }

            $effectiveFrom = $this->nullable($row['created_at'] ?? null)
                ?? $this->nullable($row['updated_at'] ?? null)
                ?? now()->toDateTimeString();
            $next = $rows->get($index + 1);
            $effectiveTo = $next
                ? date('Y-m-d H:i:s', strtotime(
                    ($this->nullable($next['created_at'] ?? null) ?? $effectiveFrom) . ' -1 second'
                ))
                : null;
            if (!$next && $this->status($row['status'] ?? null) !== 'A') {
                $effectiveTo = $this->nullable($row['updated_at'] ?? null) ?? $effectiveFrom;
            }

            $data = [
                'crop_id' => $cropId,
                'block' => mb_substr(trim((string) ($row['bloco'] ?? '0')), 0, 1),
                'route' => mb_substr(trim((string) ($row['percurso'] ?? '0')), 0, 1),
                'price' => $this->decimal($row['frete'] ?? 0),
                'effective_from' => $effectiveFrom,
                'effective_to' => $effectiveTo,
                'status' => $this->status($row['status'] ?? null),
                'updated_at' => $this->nullable($row['updated_at'] ?? null) ?? now(),
            ];

            // Reaproveita a linha já importada quando o mesmo CSV for reenviado.
            if (DB::table('matrix_freights')->where('id', $legacyMatrixId)->exists()) {
                DB::table('matrix_freights')
                    ->where('id', $legacyMatrixId)
                    ->update($data);
                $newId = $legacyMatrixId;
            } else {
                $newId = DB::table('matrix_freights')->insertGetId(array_merge($data, [
                    'id' => $legacyMatrixId,
                    'created_at' => $this->nullable($row['created_at'] ?? null) ?? now(),
                ]));
            }

            $this->map($batch, 'matrix_freights', $legacyMatrixId, 'matrix_freights', $newId);
            $this->count($batch, true);
            }
        }
    }

    // Importa armazéns.
    private function importWarehouses(object $batch, array $files, bool $strict): void
    {
        foreach ($this->rows($files, 'armazems.csv') as $row) {
            $supplierId = $this->resolve('suppliers', $row['fornecedor_id']);

            if (! $supplierId) {
                if ($strict) {
                    throw new RuntimeException("Armazém legado {$row['id']} possui fornecedor não resolvido.");
                }
                continue;
            }

            $existing = DB::table('warehouses')->where('name', $row['nome'])->first();
            $newId = $existing?->id ?? DB::table('warehouses')->insertGetId([
                'id' => (int) $row['id'],
                'supplier_id' => $supplierId,
                'name' => $row['nome'],
                'city' => $row['cidade'] ?? 'NÃO INFORMADO',
                'type' => $this->warehouseType($row['tipo'] ?? null),
                'route' => $row['percurso'] ?? '0',
                'status' => $this->status($row['status']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->attachSupplierType($supplierId, 'ARMAZÉNS GERAIS');

            $this->map($batch, 'warehouses', (int) $row['id'], 'warehouses', $newId);
            $this->count($batch, true);
        }
    }

    // Importa motoristas.
    private function importDrivers(object $batch, array $files, bool $strict): void
    {
        foreach ($this->rows($files, 'motoristas.csv') as $row) {
            $legacyId = (int) ($row['id'] ?? 0);
            $supplierId = $this->resolve('suppliers', $row['fornecedor_id']);

            if (! $supplierId) {
                if ($strict) {
                    throw new RuntimeException("Motorista legado {$legacyId} possui fornecedor não resolvido.");
                }

                $this->warnings[] = "Motorista legado {$legacyId}: registro ignorado porque o fornecedor não foi importado.";
                $this->count($batch, false);
                continue;
            }

            $name = $this->nullable($row['nome'] ?? null) ?? "MOTORISTA LEGADO {$legacyId}";
            $code = $this->nullable($row['codigo'] ?? null) ?? "LEG-MOT-{$legacyId}";
            $plate = $this->nullable($row['placa'] ?? null) ?? "SEM-PLACA-{$legacyId}";

            if (! $this->nullable($row['codigo'] ?? null)) {
                $this->warnings[] = "Motorista legado {$legacyId}: código ausente substituído por {$code}.";
            }

            if (! $this->nullable($row['placa'] ?? null)) {
                $this->warnings[] = "Motorista legado {$legacyId}: placa ausente substituída por {$plate}.";
            }

            $existing = DB::table('drivers')->where('code', $code)->first();

            if (! $existing && DB::table('drivers')->where('name', $name)->exists()) {
                $name .= " (LEGADO {$legacyId})";
                $this->warnings[] = "Motorista legado {$legacyId}: nome repetido recebeu complemento para preservar o registro.";
            }

            if (! $existing && DB::table('drivers')->where('plate', $plate)->exists()) {
                $plate .= "-L{$legacyId}";
                $this->warnings[] = "Motorista legado {$legacyId}: placa repetida recebeu complemento para preservar o registro.";
            }

            $newId = $existing?->id ?? DB::table('drivers')->insertGetId([
                'id' => $legacyId,
                'supplier_id' => $supplierId,
                'name' => $name,
                'code' => $code,
                'plate' => $plate,
                'status' => $this->status($row['status']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->attachSupplierType($supplierId, 'TRANSPORTADOR');

            $this->map($batch, 'drivers', $legacyId, 'drivers', $newId);
            $this->count($batch, true);
        }
    }

    // Importa colhedores.
    private function importLanyards(object $batch, array $files, bool $strict): void
    {
        foreach ($this->rows($files, 'colhedors.csv') as $row) {
            $supplierId = $this->resolve('suppliers', $row['fornecedor_id']);

            if (! $supplierId) {
                if ($strict) {
                    throw new RuntimeException("Colhedor legado {$row['id']} possui fornecedor não resolvido.");
                }
                continue;
            }

            $existing = DB::table('lanyards')->where('front', $row['nome'])->first();
            $newId = $existing?->id ?? DB::table('lanyards')->insertGetId([
                'id' => (int) $row['id'],
                'supplier_id' => $supplierId,
                'front' => $row['nome'],
                'machine_quantity' => $row['qnt_linha'] ?? '0',
                'number_feet' => 0,
                'status' => $this->status($row['status']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->attachSupplierType($supplierId, 'COLHEDOR');

            $this->map($batch, 'lanyards', (int) $row['id'], 'lanyards', $newId);
            $this->count($batch, true);
        }
    }

    // Garante que o fornecedor possua o tipo correspondente ao cadastro importado.
    private function attachSupplierType(int $supplierId, string $typeName): void
    {
        // Os tipos de fornecedor são dados de domínio e devem existir previamente
        // via seeder. A importação nunca cria novos tipos.
        $typeId = DB::table('type_suppliers')
            ->where('name', $typeName)
            ->value('id');

        if (! $typeId) {
            throw new RuntimeException(
                "Tipo de fornecedor '{$typeName}' não encontrado. Execute os seeders oficiais antes da importação."
            );
        }

        DB::table('supplier_type_supplier')->updateOrInsert(
            [
                'supplier_id' => $supplierId,
                'type_supplier_id' => $typeId,
            ],
            [
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    // Importa centros administrativos.
    private function importAdministrativeCenters(object $batch, array $files, bool $strict): void
    {
        foreach ($this->rows($files, 'centro_administrativos.csv') as $row) {
            $producerId = $this->resolve('producers', $row['produtor_id']);
            $farmId = $this->resolve('farms', $row['fazenda_id']);

            if (! $producerId || ! $farmId) {
                if ($strict) {
                    throw new RuntimeException("Centro administrativo legado {$row['id']} possui relacionamento não resolvido.");
                }
                continue;
            }

            $existing = DB::table('administrative_centers')
                ->where('producer_id', $producerId)
                ->where('farm_id', $farmId)
                ->first();

            $newId = $existing?->id ?? DB::table('administrative_centers')->insertGetId([
                'id' => (int) $row['id'],
                'producer_id' => $producerId,
                'farm_id' => $farmId,
                'cei' => null,
                'state_registration' => null,
                'status' => 'A',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->map($batch, 'administrative_centers', (int) $row['id'], 'administrative_centers', $newId);
            $this->count($batch, true);
        }
    }

    // Importa centros de custo.
    private function importCostCenters(object $batch, array $files): void
    {
        foreach ($this->rows($files, 'centro_custos.csv') as $row) {
            $newId = $this->upsertSimple('cost_centers', (int) $row['id'], 'name', $row['nome'], [
                'status' => $this->status($row['status']),
            ]);
            $this->map($batch, 'cost_centers', (int) $row['id'], 'cost_centers', $newId);
            $this->count($batch, true);
        }
    }

    // Importa os romaneios preservando pesos, fretes e a versão histórica da matriz.
    private function importHarvestReleases(object $batch, array $files, bool $strict): void
    {
        foreach ($this->rows($files, 'lancamento_safras.csv') as $row) {
            $legacyId = (int) $row['id'];
            $cropId = $this->resolveSeededCrop($row['safra_id'] ?? null);
            $ownerId = $this->resolve('owners', $row['proprietario_id'] ?? null);
            $farmId = $this->resolve('farms', $row['fazenda_id'] ?? null);
            $stateRegistrationId = $this->resolveHarvestStateRegistration($farmId);
            $relations = [
                'driver_id' => $this->resolve('drivers', $row['motorista_id'] ?? null),
                'owner_id' => $ownerId,
                'farm_state_registration_id' => $stateRegistrationId,
                'plot_field_id' => $this->resolve('plot_fields', $row['locacao_talhao_id'] ?? null),
                'warehouse_id' => $this->resolve('warehouses', $row['armazem_id'] ?? null),
                'lanyard_id' => $this->resolve('lanyards', $row['colhedor_id'] ?? null),
                'matrix_freight_id' => $this->resolve('matrix_freights', $row['matriz_frete_id'] ?? null),
            ];
            if (!$cropId || in_array(null, $relations, true)) {
                $unresolvedRelations = array_keys(array_filter(
                    array_merge(['crop_id' => $cropId], $relations),
                    static fn ($id): bool => $id === null,
                ));

                if ($strict) {
                    throw new RuntimeException(
                        "Lançamento de safra legado {$legacyId} possui relacionamentos não resolvidos: "
                        .implode(', ', $unresolvedRelations).'.',
                    );
                }
                $this->warnings[] = "Lançamento de safra legado {$legacyId}: registro ignorado por relacionamentos não resolvidos: "
                    .implode(', ', $unresolvedRelations).'.';
                $this->count($batch, false);
                continue;
            }
            $mapped = $this->resolve('harvest_releases', (string) $legacyId);
            $shipping = $this->uniqueLegacyNumber('shipping_number', (string) $row['num_romaneio'], $cropId, $legacyId, $mapped);
            $control = $this->uniqueLegacyNumber('control_number', (string) $row['num_controle'], $cropId, $legacyId, $mapped);
            $data = array_merge($relations, [
                'crop_id' => $cropId,
                'release_date' => $row['data_colhido'],
                'shipping_number' => $shipping,
                'control_number' => $control,
                'gross_weight' => $this->decimalScale($row['peso_bruto'] ?? 0, 3),
                'discount_weight' => $this->decimalScale($row['peso_desconto'] ?? 0, 3),
                'discount' => $this->decimalScale($row['desconto'] ?? 0, 4),
                'net_weight' => $this->decimalScale($row['peso_liquido'] ?? 0, 3),
                'liquid_bags' => $this->decimalScale($row['saco_liquido'] ?? 0, 3),
                'gross_bags' => $this->decimalScale($row['saco_bruto'] ?? 0, 2),
                'shipping_value' => $this->decimalScale($row['valor_frete'] ?? 0, 2),
                'status' => $this->nullable($row['deleted_at'] ?? null) ? 'I' : 'A',
                'deleted_at' => $this->nullable($row['deleted_at'] ?? null),
                'created_at' => $this->nullable($row['created_at'] ?? null) ?? now(),
                'updated_at' => $this->nullable($row['updated_at'] ?? null) ?? now(),
            ]);
            if ($mapped) {
                DB::table('harvest_releases')->where('id', $mapped)->update($data);
                $newId = $mapped;
            } else {
                $newId = DB::table('harvest_releases')->insertGetId(array_merge(['id' => $legacyId], $data));
            }
            $this->map($batch, 'harvest_releases', $legacyId, 'harvest_releases', $newId);
            $this->count($batch, true);
        }
    }

    private function resolveHarvestStateRegistration(?int $farmId): ?int
    {
        if (! $farmId) {
            return null;
        }

        $ids = DB::table('farm_state_registrations as fsr')
            ->join('farms as f', 'f.id', '=', 'fsr.farm_id')
            ->whereColumn('fsr.producer_id', 'f.producer_id')
            ->where('fsr.farm_id', $farmId)
            ->where('fsr.status', 'A')
            ->whereNull('fsr.deleted_at')
            ->whereNull('f.deleted_at')
            ->pluck('fsr.id');

        return $ids->count() === 1 ? (int) $ids->first() : null;
    }

    // Importa o livro financeiro antigo diretamente para PayAccount.
    private function importPayAccounts(object $batch, array $files, bool $strict): void
    {
        foreach ($this->rows($files, 'lancamento_conta_apagars.csv') as $row) {
            $legacyId = (int) $row['id'];
            $supplierId = $this->resolve('suppliers', $row['fornecedor_id'] ?? null);
            $producerId = $this->resolve('producers', $row['produtor_id'] ?? null);
            $costCenterId = $this->resolve('cost_centers', $row['centro_custo_id'] ?? null);
            $date = $this->nullable($row['data_documento'] ?? null);
            $cropId = $this->cropForDate($date);
            $centerId = $producerId ? $this->defaultAdministrativeCenter($producerId) : null;
            if (!$supplierId || !$producerId || !$costCenterId || !$cropId || !$centerId || !$date) {
                if ($strict) {
                    throw new RuntimeException("Conta a pagar legada {$legacyId} possui relacionamento obrigatório não resolvido.");
                }
                $this->count($batch, false);
                continue;
            }
            $data = [
                'administrative_center_id' => $centerId, 'cost_center_id' => $costCenterId,
                'supplier_id' => $supplierId, 'producer_id' => $producerId,
                'type_pay_account_id' => $this->ensurePaymentType($row['tipo'] ?? null), 'crop_id' => $cropId,
                'document_number' => $this->nullable($row['numero_documento'] ?? null) ?? 'LEG-CONTA-'.$legacyId,
                'document_date' => $date, 'due_date' => $this->nullable($row['data_vencimento'] ?? null) ?? $date,
                'description' => $this->nullable($row['descricao'] ?? null) ?? 'Conta importada do sistema antigo',
                'value' => $this->decimalScale($row['valor'] ?? 0, 2),
                'accounted_for' => mb_strtoupper((string)($row['contabilizado'] ?? '')) === 'SIM' ? 'S' : 'N',
                'status' => $this->financialStatus($row['status'] ?? null), 'entry_type' => 'ACCOUNT',
                'source_type' => 'LEGACY_PAY_ACCOUNT', 'source_id' => $legacyId,
                'deleted_at' => $this->nullable($row['deleted_at'] ?? null),
                'created_at' => $this->nullable($row['created_at'] ?? null) ?? now(),
                'updated_at' => $this->nullable($row['updated_at'] ?? null) ?? now(),
            ];
            $mapped = DB::table('pay_accounts')
                ->where('source_type', 'LEGACY_PAY_ACCOUNT')
                ->where('source_id', $legacyId)
                ->value('id');
            if ($mapped) { DB::table('pay_accounts')->where('id',$mapped)->update($data); $newId=$mapped; }
            else { $newId=DB::table('pay_accounts')->insertGetId($data); }
            $this->map($batch, 'pay_accounts', $legacyId, 'pay_accounts', $newId);
            $this->count($batch, true);
        }
    }

    private function importPayroll(object $batch, array $files, bool $strict): void
    {
        $supplierId = null;
        foreach ($this->rows($files, 'folhas.csv') as $row) {
            $legacyId=(int)$row['id']; $date=$this->nullable($row['data_lancamento'] ?? null);
            $producerId=$this->resolve('producers',$row['produtor_id'] ?? null);
            $centerId=$this->resolve('administrative_centers',$row['centro_administrativo_id'] ?? null);
            $cropId=$this->cropForDate($date);
            $supplierId ??= $this->technicalPayrollSupplier();
            if(!$producerId||!$centerId||!$cropId||!$date){if($strict)throw new RuntimeException("Folha legada {$legacyId} possui relacionamento não resolvido.");$this->count($batch,false);continue;}
            $data=['administrative_center_id'=>$centerId,'cost_center_id'=>1,'supplier_id'=>$supplierId,'producer_id'=>$producerId,
                'type_pay_account_id'=>$this->ensurePaymentType('OUTROS'),'crop_id'=>$cropId,'document_number'=>'LEG-FOLHA-'.$legacyId,
                'document_date'=>$date,'due_date'=>$date,'description'=>$this->nullable($row['descricao_lancamento']??null)??'Folha de pagamento importada',
                'value'=>$this->decimalScale($row['valor_lancamento']??0,2),'accounted_for'=>'N','status'=>'RI','entry_type'=>'PAYROLL',
                'source_type'=>'LEGACY_PAYROLL','source_id'=>$legacyId,'deleted_at'=>$this->nullable($row['deleted_at']??null),
                'created_at'=>$this->nullable($row['created_at']??null)??now(),'updated_at'=>$this->nullable($row['updated_at']??null)??now()];
            $mapped=DB::table('pay_accounts')->where('source_type','LEGACY_PAYROLL')->where('source_id',$legacyId)->value('id');
            if($mapped){DB::table('pay_accounts')->where('id',$mapped)->update($data);$newId=$mapped;}else{$newId=DB::table('pay_accounts')->insertGetId($data);}
            $this->map($batch,'payroll',$legacyId,'pay_accounts',$newId);$this->count($batch,true);
        }
    }

    // Reclassifica a conta correspondente; cria PayAccount somente quando ela não existe.
    private function importAdvances(object $batch,array $files,string $file,string $entryType,string $costName,bool $strict):void
    {
        foreach($this->rows($files,$file) as $row){$legacyId=(int)$row['id'];$supplierId=$this->resolve('suppliers',$row['fornecedor_id']??null);
            $legacyProducer=(int)($row['produtor_id']??0);$producerId=$this->resolve('producers',(string)($legacyProducer===0?1:$legacyProducer));
            $cropId=$this->resolveSeededCrop($row['safra_id']??null);$date=$this->nullable($row['data_pagamento']??null);$centerId=$producerId?$this->defaultAdministrativeCenter($producerId):null;
            $costId=$this->costCenterByName($costName);$value=$this->decimalScale($row['valor_pagamento']??0,2);
            if(!$supplierId||!$producerId||!$cropId||!$date||!$centerId||!$costId){if($strict)throw new RuntimeException("Adiantamento legado {$legacyId} possui relacionamento não resolvido.");$this->count($batch,false);continue;}
            $payId=DB::table('pay_accounts')->where('source_type','LEGACY_ADVANCE')->where('source_id',$legacyId)
                ->where('entry_type',$entryType)->value('id');
            $data=['crop_id'=>$cropId,'producer_id'=>$producerId,'administrative_center_id'=>$centerId,'cost_center_id'=>$costId,
                'supplier_id'=>$supplierId,'type_pay_account_id'=>$this->ensurePaymentType($row['tipo_adiantamento']??null),
                'document_number'=>$this->nullable($row['num_cheque']??null)??('LEG-ADI-'.$legacyId),'document_date'=>$date,'due_date'=>$date,
                'description'=>$entryType==='HARVESTER_ADVANCE'?'Adiantamento de colheita importado':'Adiantamento de transportador importado',
                'value'=>$value,'accounted_for'=>'N','status'=>'RI','entry_type'=>$entryType,'source_type'=>'LEGACY_ADVANCE','source_id'=>$legacyId,
                'deleted_at'=>$this->nullable($row['deleted_at']??null),'updated_at'=>$this->nullable($row['updated_at']??null)??now()];
            if($payId){DB::table('pay_accounts')->where('id',$payId)->update($data);$newId=(int)$payId;}
            else{$data['created_at']=$this->nullable($row['created_at']??null)??now();$newId=DB::table('pay_accounts')->insertGetId($data);}
            $this->map($batch,$entryType,$legacyId,'pay_accounts',$newId);$this->count($batch,true);
        }
    }

    private function uniqueLegacyNumber(string $field,string $number,int $cropId,int $legacyId,?int $ignoreId=null):string
    { $number=trim($number)?:('LEG-'.$legacyId);$exists=DB::table('harvest_releases')->where('crop_id',$cropId)->where($field,$number)->when($ignoreId,fn($q)=>$q->where('id','<>',$ignoreId))->exists();return $exists?mb_substr($number.'-L'.$legacyId,0,100):$number; }
    private function defaultAdministrativeCenter(int $producerId):?int
    { return DB::table('administrative_centers')->where('producer_id',$producerId)->orderByDesc('status')->orderBy('id')->value('id'); }
    private function cropForDate(?string $date):?int
    { if(!$date)return null;return DB::table('crops')->whereNull('deleted_at')->where(fn($q)=>$q->whereNull('opening_date')->orWhereDate('opening_date','<=',$date))->where(fn($q)=>$q->whereNull('closing_date')->orWhereDate('closing_date','>=',$date))->orderByDesc('opening_date')->value('id')??DB::table('crops')->whereNull('deleted_at')->orderByDesc('status')->orderByDesc('opening_date')->value('id'); }
    private function costCenterByName(string $name):int
    { $id=DB::table('cost_centers')->whereRaw('UPPER(name) = ?',[mb_strtoupper($name)])->value('id');return (int)($id??DB::table('cost_centers')->insertGetId(['name'=>$name,'status'=>'A','created_at'=>now(),'updated_at'=>now()])); }
    private function ensurePaymentType(?string $value):int
    { $upper=mb_strtoupper((string)$value);[$abbr,$name]=match(true){str_contains($upper,'TRANSFER'),str_contains($upper,'DEPOS')=>['TR','TRANSFERÊNCIA'],str_contains($upper,'BOLETO')=>['BO','BOLETO'],str_contains($upper,'DINHEIRO')=>['DI','DINHEIRO'],str_contains($upper,'CHEQUE')=>['CH','CHEQUE'],default=>['LG','OUTROS PAGAMENTOS IMPORTADOS']};$id=DB::table('type_pay_accounts')->where('abbreviation',$abbr)->value('id');return (int)($id??DB::table('type_pay_accounts')->insertGetId(['name'=>$name,'abbreviation'=>$abbr,'status'=>$abbr==='LG'?'I':'A','created_at'=>now(),'updated_at'=>now()])); }
    private function technicalPayrollSupplier():int
    { $id=DB::table('suppliers')->where('corporate_reason','FOLHA DE PAGAMENTO')->value('id');return (int)($id??DB::table('suppliers')->insertGetId(['corporate_reason'=>'FOLHA DE PAGAMENTO','fantasy_name'=>'FOLHA DE PAGAMENTO','type'=>'J','cpf_cnpj'=>null,'rg_ie'=>null,'status'=>'I','created_at'=>now(),'updated_at'=>now()])); }
    private function financialStatus(?string $value):string
    { return match(mb_strtoupper(trim((string)$value))){'CAIXA'=>'CA','COMÉRCIO','COMERCIO'=>'CO','FAZENDA'=>'FA',default=>'RI'}; }
    private function decimalScale(mixed $value,int $scale):float
    { if(is_string($value)){$value=trim($value);if(str_contains($value,',')){$value=str_replace('.','',$value);$value=str_replace(',','.',$value);}}return round((float)$value,$scale); }
    private function validLegacyDocument(mixed $value):?string
    { $value=$this->nullable($value);if(!$value)return null;$digits=preg_replace('/\D+/','',$value);return in_array(strlen($digits),[11,14],true)?$digits:null; }

    // Retorna as linhas de um arquivo específico.
    private function rows(array $files, string $name): array
    {
        foreach ($files as $path) {
            if ($this->canonicalFileName($path) === $name) {
                return $this->readCsv($path);
            }
        }

        return [];
    }

    // Remove sufixos adicionados pelo navegador, como fornecedors(1).csv.
    private function canonicalFileName(string $name): string
    {
        $name = strtolower(basename($name));

        return preg_replace('/\s*\(\d+\)(?=\.(?:csv|txt)$)/i', '', $name) ?: $name;
    }

    // Faz upsert simples por um campo único.
    private function upsertSimple(string $table, int $legacyId, string $uniqueField, ?string $value, array $data): int
    {
        $existing = DB::table($table)->where($uniqueField, $value)->first();

        if ($existing) {
            return (int) $existing->id;
        }

        return (int) DB::table($table)->insertGetId(array_merge($data, [
            'id' => $legacyId,
            $uniqueField => $value,
            'created_at' => now(),
            'updated_at' => now(),
        ]));
    }

    // Atualiza as contagens do lote.
    private function count(object $batch, bool $success): void
    {
        $batch->processed_rows++;

        if ($success) {
            $batch->imported_rows++;
        } else {
            $batch->failed_rows++;
        }
    }

    // Extrai o ano agrícola do nome/data da safra.
    private function extractAgriculturalYear(?string $name, ?string $openingDate = null): ?string
    {
        if (! $name) {
            return null;
        }

        // Formatos explícitos: 20/21 ou 20-21.
        if (preg_match('/(\d{2})\s*[-\/]\s*(\d{2})/', $name, $matches)) {
            return $matches[1] . '/' . $matches[2];
        }

        // Algumas safras antigas usam apenas o ano final, por exemplo
        // "SAFRINHA MILHO 21". Quando há data de início, ela é a melhor
        // referência para reconstruir o ano agrícola.
        if (preg_match('/(\d{2})\s*$/', trim($name), $matches)) {
            $year = (int) $matches[1];
            $isSafrinha = str_contains(mb_strtoupper($name), 'SAFRINHA');

            if ($openingDate && preg_match('/^(\d{4})-/', $openingDate, $dateMatches)) {
                $fullYear = (int) $dateMatches[1];
                $current = $fullYear % 100;

                if ($isSafrinha) {
                    return sprintf('%02d/%02d', ($current + 99) % 100, $current);
                }

                return sprintf('%02d/%02d', $year, ($year + 1) % 100);
            }

            // Para "SAFRINHA 24", por exemplo, o ano agrícola é 23/24.
            if ($isSafrinha) {
                return sprintf('%02d/%02d', ($year + 99) % 100, $year);
            }

            return sprintf('%02d/%02d', $year, ($year + 1) % 100);
        }

        return null;
    }

    // Normaliza números decimais vindos de CSVs com ponto ou vírgula.
    private function decimal(mixed $value): float
    {
        if (is_string($value)) {
            $value = trim($value);
            if (str_contains($value, ',')) {
                $value = str_replace('.', '', $value);
                $value = str_replace(',', '.', $value);
            } else {
                $value = str_replace(',', '.', $value);
            }
        }

        return round((float) $value, 2);
    }

    // Converte marcadores textuais de ausência usados pelo sistema antigo em null.
    private function nullable(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $value = trim((string) $value);

        return $value === '' || in_array(mb_strtoupper($value), ['NULL', 'N/A'], true)
            ? null
            : $value;
    }

    // Converte o tipo de pagamento legado.
    private function paymentType(?string $value): string
    {
        return str_contains(mb_strtoupper((string) $value), 'TRANSFER') ? 'T' : 'D';
    }

    // Converte pessoa física/jurídica para F/J.
    private function supplierType(?string $value): string
    {
        return str_contains(mb_strtoupper((string) $value), 'JUR') ? 'J' : 'F';
    }

    // Converte conta corrente/poupança para C/P.
    private function accountType(?string $value): string
    {
        return str_contains(mb_strtoupper((string) $value), 'POUP') ? 'P' : 'C';
    }

    // Converte unidade para K/L.
    private function unit(?string $value): string
    {
        return str_contains(mb_strtoupper((string) $value), 'KG') ? 'K' : 'L';
    }

    // Converte tipo de armazém.
    private function warehouseType(?string $value): string
    {
        return str_contains(mb_strtoupper((string) $value), 'TERCE') ? 'T' : 'P';
    }

    // Retorna avisos conhecidos do conjunto de arquivos.
    private function knownWarnings(array $files): array
    {
        // Obtém os nomes dos arquivos disponíveis.
        $names = array_map(fn ($path) => $this->canonicalFileName($path), $files);

        // Inicializa a lista de avisos.
        $warnings = [];

        // Verifica se os arquivos necessários para os relacionamentos existem.
        if (! in_array('proprietarios.csv', $names, true)) {
            $warnings[] = $this->previewWarning('O conjunto não possui proprietarios.csv. Proprietários sem correspondência não serão inventados no modo estrito.', 'proprietarios.csv');
        }

        // Verifica se o arquivo real de variedades está presente.
        if (! in_array('variedade_culturas.csv', $names, true)) {
            $warnings[] = $this->previewWarning('O conjunto não possui variedade_culturas.csv. As locações de talhões que dependem de variedade não poderão ser importadas no modo estrito.', 'variedade_culturas.csv');
        }

        // Informa a ausência do vínculo explícito do ano agrícola no legado.
        $warnings[] = $this->previewWarning('O CSV de safras não possui agricultural_year_id. O módulo tenta inferir o ano agrícola pelo nome da safra.', 'safras.csv');

        // Informa a normalização de status.
        $warnings[] = $this->previewWarning('Valores de status como ATIVO, Ativa, DESATIVADO e Desativada são normalizados para A/I.');

        // Informa que UUIDs legados não são persistidos.
        $warnings[] = $this->previewWarning('Os UUIDs do sistema antigo são ignorados e não são gravados no banco novo.');

        // Retorna os avisos encontrados.
        return $warnings;
    }

    private function previewWarning(string $message, ?string $file = null): array
    {
        return [
            'message' => $message,
            'file' => $file,
            'record' => null,
            'severity' => 'warning',
        ];
    }

    // Remove um diretório temporário recursivamente.
    private function removeDirectory(string $directory): void
    {
        if (! is_dir($directory)) {
            return;
        }

        foreach (glob($directory . '/*') ?: [] as $path) {
            is_dir($path) ? $this->removeDirectory($path) : @unlink($path);
        }

        @rmdir($directory);
    }
}
