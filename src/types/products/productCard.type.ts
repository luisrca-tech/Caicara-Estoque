import type { Product } from "./product.type"

export interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  isDeleting?: boolean
}