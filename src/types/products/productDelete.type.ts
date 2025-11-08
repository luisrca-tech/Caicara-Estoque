import type { Product } from "./product.type"

export interface ProductDeleteDialogProps {
  product: Product | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isDeleting?: boolean
}
