import { z } from 'zod';

export const AgriculturalDefensiveOrderProductSchema = z.object({
  product_id: z.coerce.number().int().positive('Produto obrigatório'),
  dose: z.coerce.number().min(0).optional(),
  pump: z.coerce.number().min(0, 'Bomba deve ser maior ou igual a zero'),
});

export const AgriculturalDefensiveOrderOperatorSchema = z.object({
  operator_id: z.coerce.number().int().positive('Operador obrigatório'),
  function: z.string().min(1, 'Função obrigatória'),
});

export const AgriculturalDefensiveOrderSchema = z.object({
  field_id: z.coerce.number().int().positive('Talhão obrigatório'),
  area: z.coerce.number().gt(0, 'Área deve ser maior que zero'),
  crop_id: z.coerce.number().int().positive('Safra obrigatória'),
  culture_id: z.coerce.number().int().positive('Cultura obrigatória'),
  type_operation_id: z.coerce.number().int().positive('Tipo de operação obrigatório'),
  application_date: z.string().min(1, 'Data obrigatória'),
  pump_volume: z.coerce.number().min(0).optional(),
  recommended_pump: z.coerce.number().min(0).optional(),
  flow: z.coerce.number().min(0).optional(),
  pump_capacity: z.coerce.number().min(0).optional(),
  operators: z
    .array(AgriculturalDefensiveOrderOperatorSchema)
    .min(1, 'Adicione pelo menos um operador')
    .refine((ops) => ops.some((o) => o.function === 'T'), {
      message: 'Adicione pelo menos um operador com função Tanqueiro.',
    }),
  products: z.array(AgriculturalDefensiveOrderProductSchema).min(1, 'Adicione pelo menos um produto'),
});

export type AgriculturalDefensiveOrderFormData = z.infer<typeof AgriculturalDefensiveOrderSchema>;
