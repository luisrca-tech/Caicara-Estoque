"use client";

import { AlertTriangle, Trash2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { OrderDeleteDialogProps } from "~/types/orders/orderDelete.type";

export const OrderDeleteDialog = ({
  order,
  onOpenChange,
  onConfirm,
  isDeleting,
}: OrderDeleteDialogProps) => {
  const open = Boolean(order);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-5" />
            Excluir pedido
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o pedido #{order?.id}? Esta ação não
            pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-muted-foreground text-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-[2px] size-4 text-destructive" />
              <p>
                Excluir este pedido o removerá permanentemente do sistema. Todos
                os itens associados também serão removidos.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Cancelar
          </Button>
          <Button
            disabled={isDeleting}
            onClick={onConfirm}
            variant="destructive"
          >
            {isDeleting ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
