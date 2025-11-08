"use client"

import { AlertTriangle, Trash2 } from "lucide-react"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import type { ProductDeleteDialogProps } from "~/types/products/productDelete.type"

export const ProductDeleteDialog = ({
  product,
  onOpenChange,
  onConfirm,
  isDeleting,
}: ProductDeleteDialogProps) => {
  const open = Boolean(product)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-5" />
            Excluir produto
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover {product?.name}? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-[2px] size-4 text-destructive" />
            <p>
              Excluir este produto o removerá das listagens e relatórios de inventário. Considere
              definir a quantidade como zero se preferir manter o registro.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

