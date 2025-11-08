import { z } from "zod"

export const productFormSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z
    .string()
    .min(1, { message: "Nome é obrigatório" })
    .max(256, { message: "Nome deve ter menos de 256 caracteres" }),
  description: z.string().max(256, { message: "Descrição deve ter menos de 256 caracteres" }),
  price: z
    .string()
    .min(1, { message: "Preço é obrigatório" })
    .refine(
      (value) => {
        const normalized = value.replace(",", ".")
        const num = Number.parseFloat(normalized)
        return Number.isFinite(num) && num >= 0
      },
      { message: "Preço deve ser um número válido não negativo" },
    ),
  quantity: z
    .string()
    .min(1, { message: "Quantidade é obrigatória" })
    .refine(
      (value) => {
        const num = Number.parseInt(value, 10)
        return Number.isInteger(num) && num >= 0
      },
      { message: "Quantidade deve ser um número inteiro válido não negativo" },
    ),
})