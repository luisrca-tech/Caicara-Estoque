import { z } from "zod"
import { productFormSchema } from "~/schema/productForm.schema"

export interface ProductFormValues {
  id?: number
  name: string
  description: string
  price: string
  quantity: string
}

export type ProductFormSchema = z.infer<typeof productFormSchema>