import type { Product } from "./product.type";

export interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onRestore?: (product: Product) => void;
  onAdjustQuantity?: (productId: number, delta: number) => void;
  isDeleting?: boolean;
  isRestoring?: boolean;
  isAdjustingQuantity?: boolean;
  showRestore?: boolean;
}
