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

const formatOrderDate = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  let isoLike = "";

  if (trimmed.includes("/")) {
    const [day, month, year] = trimmed.split("/");
    if (day && month && year) {
      const fullYear = year.length === 2 ? `20${year}` : year.padStart(4, "0");
      isoLike = `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  } else if (trimmed.includes("-")) {
    isoLike = trimmed;
  }

  const parsed = isoLike ? new Date(isoLike) : new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  return parsed.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const OrderCard = ({ order, onDelete, isDeleting }: OrderCardProps) => {
  const router = useRouter();
  const status =
    statusConfig[order.status as keyof typeof statusConfig] ??
    statusConfig.pending;

  const formattedOrderDate = formatOrderDate(order.orderDate);

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
            <CardTitle className="truncate font-semibold text-xl">
              Pedido #{order.id}
            </CardTitle>
            <CardDescription className="mt-1 text-muted-foreground text-xs">
              {formattedOrderDate}
            </CardDescription>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 font-semibold text-xs",
              status.className
            )}
          >
            {status.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="wrap-break-word font-bold text-2xl text-primary sm:text-3xl">
            {priceFormatter.format(Number(order.totalPrice))}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        <Button
          className="flex-1 sm:flex-initial"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          size="sm"
          variant="outline"
        >
          Ver detalhes
        </Button>
        <Button
          className="shrink-0"
          disabled={isDeleting}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(order);
          }}
          size="sm"
          variant="destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
