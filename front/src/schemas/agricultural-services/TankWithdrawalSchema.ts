import { z } from 'zod';

export const TankWithdrawalProductSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().min(0, 'Quantidade deve ser maior ou igual a zero'),
});

export const TankWithdrawalSchema = z.object({
  crop_id: z.coerce.number().int().positive('Safra obrigatória'),
  operator_id: z.coerce.number().int().positive('Operador obrigatório'),
  date: z.string().min(1, 'Data obrigatória'),
  products: z.array(TankWithdrawalProductSchema).min(1, 'Informe pelo menos um produto'),
  observation: z.string().optional(),
});

export type TankWithdrawalFormData = z.infer<typeof TankWithdrawalSchema>;
