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
import type { ProductDeleteDialogProps } from "~/types/products/productDelete.type";

export const ProductDeleteDialog = ({
  product,
  onOpenChange,
  onConfirm,
  isDeleting,
  orderItemsCount = 0,
}: ProductDeleteDialogProps) => {
  const open = Boolean(product);
  const hasOrderItems = orderItemsCount > 0;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-5" />
            Desabilitar produto
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja desabilitar {product?.name}? O produto será
            ocultado das listagens, mas poderá ser habilitado novamente depois.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {hasOrderItems && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-700 dark:text-yellow-400">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-[2px] size-4 text-yellow-600 dark:text-yellow-500" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    Este produto está associado a {orderItemsCount}{" "}
                    {orderItemsCount === 1 ? "pedido" : "pedidos"}.
                  </p>
                  <p>
                    Ao desabilitar este produto, ele será removido
                    automaticamente apenas de pedidos pendentes ou cancelados.
                    Pedidos já completados manterão a referência ao produto para
                    preservar o histórico.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-muted-foreground text-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-[2px] size-4 text-destructive" />
              <p>
                Desabilitar este produto o ocultará das listagens e relatórios
                de inventário. Você poderá habilitá-lo novamente a qualquer
                momento através da seção "Itens Desabilitados".
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
            {isDeleting ? "Desabilitando..." : "Desabilitar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
