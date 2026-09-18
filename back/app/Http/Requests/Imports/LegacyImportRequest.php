<?php

// Define o namespace do request de importação.
namespace App\Http\Requests\Imports;

// Importa o request base do Laravel.
use Illuminate\Foundation\Http\FormRequest;

// Valida o arquivo recebido pelo módulo de importação.
class LegacyImportRequest extends FormRequest
{
    // Autoriza o usuário autenticado a executar a operação.
    public function authorize(): bool
    {
        // A rota já exige autenticação e o papel administrativo.
        return true;
    }

    // Define as regras de validação do arquivo.
    public function rules(): array
    {
        return [
            // Aceita ZIP ou CSV com limite de 50 MB.
            'file' => [
                'nullable',
                'required_without:files',
                'file',
                'max:51200',
                'mimes:zip,csv,txt',
            ],
            'files' => ['nullable', 'required_without:file', 'array', 'min:1', 'max:30'],
            'files.*' => ['required', 'file', 'max:51200', 'mimes:csv,txt'],

            // Define se a importação deve interromper em referências inválidas.
            'strict' => [
                'sometimes',
                'boolean',
            ],
        ];
    }

    // Retorna mensagens de validação em português brasileiro.
    public function messages(): array
    {
        return [
            'file.required' => 'O arquivo é obrigatório.',
            'file.required_without' => 'Selecione um arquivo ZIP/CSV ou vários arquivos CSV.',
            'file.file' => 'O arquivo enviado é inválido.',
            'file.max' => 'O arquivo não pode ultrapassar 50 MB.',
            'file.mimes' => 'O arquivo deve estar no formato ZIP ou CSV.',
            'files.required_without' => 'Selecione ao menos um arquivo para importação.',
            'files.array' => 'A lista de arquivos enviada é inválida.',
            'files.min' => 'Selecione ao menos um arquivo para importação.',
            'files.max' => 'Envie no máximo 30 arquivos por importação.',
            'files.*.file' => 'Um dos arquivos enviados é inválido.',
            'files.*.max' => 'Cada arquivo não pode ultrapassar 50 MB.',
            'files.*.mimes' => 'Ao selecionar vários arquivos, envie somente CSV ou TXT.',
            'strict.boolean' => 'O campo modo estrito deve ser verdadeiro ou falso.',
        ];
    }

    // Define nomes amigáveis para os atributos.
    public function attributes(): array
    {
        return [
            'file' => 'arquivo',
            'files' => 'arquivos',
            'strict' => 'modo estrito',
        ];
    }
}
