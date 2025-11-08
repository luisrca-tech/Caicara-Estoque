import type { ProductFormValues } from "./productForm.type" 

export interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  submitLabel: string
  initialValues: ProductFormValues
  onSubmit: (values: ProductFormValues) => void
  isSubmitting?: boolean
}