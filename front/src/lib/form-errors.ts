import { toast } from 'sonner';
import type { UseFormSetError, FieldValues, Path } from 'react-hook-form';

/**
 * Formato de erro retornado pela API (Laravel):
 * {
 *   message: "The given data was invalid.",
 *   errors: {
 *     "name": ["O campo nome é obrigatório."],
 *     "products.0.dose": ["A dose deve ser maior que zero."]
 *   }
 * }
 */
export interface ApiValidationErrors {
  [field: string]: string | string[];
}

interface ApiErrorLike {
  response?: {
    data?: {
      message?: string;
      errors?: ApiValidationErrors;
    };
  };
  message?: string;
}

export interface ApplyApiErrorsOptions {
  /** Mensagem exibida quando a API não devolve o array `errors`. */
  fallbackMessage?: string;
  /** Mapeia nomes de campo da API para nomes usados no formulário. */
  fieldMap?: Record<string, string>;
  /** Quando false, não exibe o toast (apenas marca os campos). */
  showToast?: boolean;
}

/** Extrai o objeto `errors` da resposta, se existir. */
export function getApiValidationErrors(error: unknown): ApiValidationErrors | undefined {
  const errs = (error as ApiErrorLike)?.response?.data?.errors;
  if (errs && typeof errs === 'object' && !Array.isArray(errs)) return errs;
  return undefined;
}

/** Normaliza o valor da mensagem (string ou array) para uma única string. */
const toMessage = (value: string | string[]): string =>
  Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value ?? '');

/**
 * Aplica os erros de validação da API nos campos do formulário e exibe
 * um toast resumido. Retorna a lista de campos que receberam erro.
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError?: UseFormSetError<T>,
  options: ApplyApiErrorsOptions = {}
): string[] {
  const {
    fallbackMessage = 'Erro ao salvar registro.',
    fieldMap = {},
    showToast = true,
  } = options;

  const errors = getApiValidationErrors(error);

  // Sem array `errors`: erro genérico / rede / 500.
  if (!errors || Object.keys(errors).length === 0) {
    if (showToast) {
      const apiMessage = (error as ApiErrorLike)?.response?.data?.message;
      toast.error(apiMessage || fallbackMessage);
    }
    return [];
  }

  const applied: string[] = [];
  const messages: string[] = [];
  let firstFocusField: string | undefined;

  Object.entries(errors).forEach(([apiField, value]) => {
    const message = toMessage(value);
    if (!message) return;
    const field = fieldMap[apiField] ?? apiField;
    messages.push(message);

    if (setError) {
      setError(field as Path<T>, { type: 'server', message }, {
        shouldFocus: firstFocusField === undefined,
      });
      if (firstFocusField === undefined) firstFocusField = field;
      applied.push(field);
    }
  });

  if (showToast && messages.length > 0) {
    const resumo =
      messages.length === 1
        ? messages[0]
        : `Não foi possível salvar. Verifique os ${messages.length} campos destacados.`;
    toast.error(resumo, {
      description: messages.length > 1 ? messages.join(' • ') : undefined,
    });
  } else if (showToast) {
    toast.error(fallbackMessage);
  }

  return applied;
}
