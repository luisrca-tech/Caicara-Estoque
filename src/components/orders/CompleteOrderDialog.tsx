"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { OrderWithItems } from "~/types/orders/order.type";
import { priceFormatter } from "~/utils/priceFormatter";

interface CompleteOrderDialogProps {
  order: OrderWithItems | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isCompleting?: boolean;
}

export const CompleteOrderDialog = ({
  order,
  onOpenChange,
  onConfirm,
  isCompleting,
}: CompleteOrderDialogProps) => {
  const open = Boolean(order);

  if (!order) return null;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="size-5" />
            Completar Pedido
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja completar o pedido #{order.id}?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-[2px] size-4 text-emerald-700" />
              <div className="space-y-1">
                <p className="font-medium text-emerald-900">
                  Esta ação irá adicionar os produtos ao estoque:
                </p>
                <ul className="list-inside list-disc space-y-1 text-emerald-800">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.product.name}: +{item.quantity} unidades
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Total do pedido:
              </span>
              <span className="font-bold text-primary text-xl">
                {priceFormatter.format(Number(order.totalPrice))}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={isCompleting}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Cancelar
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={isCompleting}
            onClick={onConfirm}
          >
            {isCompleting ? "Completando..." : "Completar Pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
