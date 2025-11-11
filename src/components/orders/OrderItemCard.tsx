"use client";

import { Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { OrderItem } from "~/types/orders/order.type";
import { priceFormatter } from "~/utils/priceFormatter";

interface OrderItemCardProps {
  item: OrderItem;
  onRemove: (itemId: number) => void;
  isRemoving?: boolean;
  canRemove?: boolean;
}

export const OrderItemCard = ({
  item,
  onRemove,
  isRemoving,
  canRemove = true,
}: OrderItemCardProps) => {
  const subtotal = Number(item.price) * item.quantity;

  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="font-semibold text-lg">
              {item.product.name}
            </CardTitle>
            {item.product.description && (
              <p className="mt-1 text-muted-foreground text-sm">
                {item.product.description}
              </p>
            )}
          </div>
          {canRemove && (
            <Button
              className="h-8 w-8 text-destructive hover:text-destructive"
              disabled={isRemoving}
              onClick={() => onRemove(item.id)}
              size="icon"
              variant="ghost"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Preço unitário:</span>
          <span className="font-medium">
            {priceFormatter.format(Number(item.price))}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Quantidade:</span>
          <span className="font-medium">{item.quantity}</span>
        </div>
        <div className="flex items-center justify-between border-t pt-2 font-bold text-lg">
          <span>Subtotal:</span>
          <span className="text-primary">
            {priceFormatter.format(subtotal)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
