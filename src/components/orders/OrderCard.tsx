"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
import type { Order } from "~/types/orders/order.type";
import { priceFormatter } from "~/utils/priceFormatter";

interface OrderCardProps {
  order: Order;
  onDelete: (order: Order) => void;
  isDeleting?: boolean;
}

const statusConfig = {
  pending: {
    label: "Pendente",
    className: "bg-amber-500/10 text-amber-700 border border-amber-500/20",
  },
  completed: {
    label: "Completo",
    className:
      "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
  },
  cancelled: {
    label: "Cancelado",
    className:
      "bg-destructive/10 text-destructive border border-destructive/20",
  },
} as const;

export const OrderCard = ({ order, onDelete, isDeleting }: OrderCardProps) => {
  const router = useRouter();
  const status =
    statusConfig[order.status as keyof typeof statusConfig] ??
    statusConfig.pending;

  const handleClick = () => {
    router.push(`/pedidos/${order.id}`);
  };

  return (
    <Card
      className="h-full cursor-pointer border-border/80 bg-card/95 backdrop-blur transition-shadow hover:shadow-md"
      onClick={handleClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="font-semibold text-xl truncate">
              Pedido #{order.id}
            </CardTitle>
            <CardDescription className="mt-1 text-muted-foreground text-xs">
              {order.orderDate}
            </CardDescription>
          </div>
          <span
            className={cn(
              "shrink-0 inline-flex items-center rounded-full px-2.5 py-1 font-semibold text-xs whitespace-nowrap",
              status.className
            )}
          >
            {status.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-bold text-2xl sm:text-3xl text-primary break-words">
            {priceFormatter.format(Number(order.totalPrice))}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          size="sm"
          variant="outline"
          className="flex-1 sm:flex-initial"
        >
          Ver detalhes
        </Button>
        <Button
          disabled={isDeleting}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(order);
          }}
          size="sm"
          variant="destructive"
          className="shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
