import { z } from 'zod';

export const AgriculturalDefensiveOrderClosingSchema = z.object({
  order_id: z.coerce.number().int().positive('Ordem de serviço obrigatória'),
  operator_tank_id: z.coerce.number().int().positive('Tanque do operador obrigatório'),
  closing_bomb: z.coerce.number().min(0, 'Bombas devem ser maior ou igual a zero'),
  closing_type: z.string().min(1, 'Tipo de fechamento obrigatório'),
});

export type AgriculturalDefensiveOrderClosingFormData = z.infer<
  typeof AgriculturalDefensiveOrderClosingSchema
>;
