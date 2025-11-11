"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";
import type { ProductCardProps } from "~/types/products/productCard.type";
import { dateFormatter } from "~/utils/dateFormatter";
import { priceFormatter } from "~/utils/priceFormatter";

export const ProductCard = ({
  product,
  onEdit,
  onDelete,
  onAdjustQuantity,
  isDeleting,
  isAdjustingQuantity,
}: ProductCardProps) => {
  const createdLabel =
    product.createdAt instanceof Date
      ? dateFormatter.format(product.createdAt)
      : "";

  const quantityStatus =
    product.quantity === 0
      ? {
          label: "Esgotado",
          className:
            "bg-destructive/10 text-destructive border border-destructive/20",
        }
      : product.quantity < 5
      ? {
          label: "Estoque baixo",
          className:
            "bg-amber-500/10 text-amber-700 border border-amber-500/20",
        }
      : {
          label: "Em estoque",
          className:
            "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
        };

  return (
    <Card className="h-full border-border/80 bg-card/95 backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="font-semibold text-xl">
              {product.name}
            </CardTitle>
            <CardDescription className="mt-1 text-muted-foreground text-xs">
              adicionado {createdLabel}
            </CardDescription>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 font-semibold text-xs",
              quantityStatus.className
            )}
          >
            {quantityStatus.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-bold text-3xl text-primary">
            {priceFormatter.format(Number(product.price))}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-muted-foreground text-sm">
              {product.quantity}{" "}
              {product.quantity === 1 ? "unidade" : "unidades"}{" "}
              {product.quantity === 1 ? "disponível" : "disponíveis"}
            </p>
            {onAdjustQuantity && (
              <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/50 p-1">
                <Button
                  className="h-7 w-7"
                  disabled={isAdjustingQuantity || product.quantity === 0}
                  onClick={() => onAdjustQuantity(product.id, -1)}
                  size="icon"
                  title="Reduzir quantidade"
                  variant="ghost"
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  className="h-7 w-7"
                  disabled={isAdjustingQuantity}
                  onClick={() => onAdjustQuantity(product.id, 1)}
                  size="icon"
                  title="Aumentar quantidade"
                  variant="ghost"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          {product.description?.trim()
            ? product.description
            : "Sem descrição ainda."}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        <Button onClick={() => onEdit(product)} size="sm" variant="outline">
          Editar
        </Button>
        <Button
          disabled={isDeleting}
          onClick={() => onDelete(product)}
          size="sm"
          variant="destructive"
        >
          {isDeleting ? "Excluindo..." : "Excluir"}
        </Button>
      </CardFooter>
    </Card>
  );
};
