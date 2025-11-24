import type { Order } from "./order.type";

export interface OrderDeleteDialogProps {
  order: Order | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}
