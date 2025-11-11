"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import type { Product } from "~/types/products/product.type";
import { priceFormatter } from "~/utils/priceFormatter";

interface ProductSelectionCardProps {
  product: Product;
  isSelected: boolean;
  quantity: number;
  onSelect: (productId: number, selected: boolean) => void;
  onQuantityChange: (productId: number, quantity: number) => void;
}

export const ProductSelectionCard = ({
  product,
  isSelected,
  quantity,
  onSelect,
  onQuantityChange,
}: ProductSelectionCardProps) => {
  const [localQuantity, setLocalQuantity] = useState(quantity || 1);

  const handleQuantityChange = (value: string) => {
    const numValue = Number.parseInt(value, 10) || 1;
    setLocalQuantity(numValue);
    onQuantityChange(product.id, numValue);
  };

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
    <Card
      className={cn(
        "border-border/80 bg-card/95",
        isSelected && "ring-2 ring-primary"
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-1 items-start gap-3">
            <Checkbox
              checked={isSelected}
              className="mt-1"
              onCheckedChange={(checked) =>
                onSelect(product.id, checked === true)
              }
            />
            <div className="flex-1">
              <CardTitle className="font-semibold text-lg">
                {product.name}
              </CardTitle>
              <CardDescription className="mt-1 text-muted-foreground text-xs">
                {product.description || "Sem descrição"}
              </CardDescription>
            </div>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-1 font-semibold text-xs",
              quantityStatus.className
            )}
          >
            {quantityStatus.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-bold text-2xl text-primary">
            {priceFormatter.format(Number(product.price))}
          </p>
          <p className="mt-1 text-muted-foreground text-sm">
            {product.quantity}{" "}
            {product.quantity === 1
              ? "unidade disponível"
              : "unidades disponíveis"}
          </p>
        </div>
        {isSelected && (
          <div className="space-y-2">
            <Label htmlFor={`quantity-${product.id}`}>Quantidade</Label>
            <Input
              className="w-full"
              id={`quantity-${product.id}`}
              min="1"
              onChange={(e) => handleQuantityChange(e.target.value)}
              type="number"
              value={localQuantity}
            />
            <p className="text-muted-foreground text-sm">
              Subtotal:{" "}
              {priceFormatter.format(Number(product.price) * localQuantity)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
