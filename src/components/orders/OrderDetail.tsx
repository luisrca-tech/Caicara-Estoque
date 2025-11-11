"use client";

import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { useOrder } from "~/hooks/orders/useOrder";
import { useOrders } from "~/hooks/orders/useOrders";
import { priceFormatter } from "~/utils/priceFormatter";
import { CompleteOrderDialog } from "./CompleteOrderDialog";
import { OrderAddProducts } from "./OrderAddProducts";
import { OrderCompletedSummary } from "./OrderCompletedSummary";
import { OrderItemCard } from "./OrderItemCard";

interface OrderDetailProps {
  orderId: number;
}

export const OrderDetail = ({ orderId }: OrderDetailProps) => {
  const router = useRouter();
  const { data: order, isLoading: isLoadingOrder } = useOrder(orderId);
  const { addItem, removeItem, completeOrder, updateOrder } = useOrders();
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  const [orderDate, setOrderDate] = useQueryState("date", {
    defaultValue: "",
    clearOnDefault: true,
  });

  const [orderStatus, setOrderStatus] = useQueryState("status", {
    defaultValue: "",
  });

  const parsedOrderDate = useMemo(() => {
    if (orderDate) return orderDate;
    if (order) {
      const parts = order.orderDate.split("/");
      if (parts.length === 3) {
        const [day, month, yearShort] = parts;
        const year =
          yearShort && yearShort.length === 2
            ? `20${yearShort}`
            : yearShort ?? "2024";
        return `${year}-${month?.padStart(2, "0") ?? "01"}-${
          day?.padStart(2, "0") ?? "01"
        }`;
      }
    }
    return "";
  }, [orderDate, order]);

  const currentStatus = useMemo(() => {
    if (!order) {
      return orderStatus || "pending";
    }

    if (order.status !== "pending") {
      return order.status;
    }

    return orderStatus || order.status || "pending";
  }, [orderStatus, order]);

  const calculatedTotal = useMemo(() => {
    if (!order?.items) return 0;
    return order.items.reduce(
      (acc, item) => acc + Number(item.price) * item.quantity,
      0
    );
  }, [order?.items]);

  const handleRemoveItem = (itemId: number) => {
    removeItem.mutate({ orderId, itemId });
  };

  const handleUpdateOrder = () => {
    const date = parsedOrderDate ? new Date(parsedOrderDate) : undefined;
    updateOrder.mutate({
      id: orderId,
      orderDate: date,
      status: currentStatus as "pending" | "completed" | "cancelled",
    });
  };

  const handleCompleteOrder = () => {
    completeOrder.mutate({ orderId });
    setShowCompleteDialog(false);
  };

  if (isLoadingOrder) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Pedido não encontrado</p>
        <Button
          className="mt-4"
          onClick={() => router.push("/pedidos")}
          variant="outline"
        >
          Voltar para pedidos
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Pedido #{order.id}</h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie os produtos deste pedido
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col space-y-6">
          <div className="shrink-0 space-y-4 rounded-lg border border-border/60 bg-card p-6">
            <h2 className="font-semibold text-xl">Informações do Pedido</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="order-date">Data do Pedido</Label>
                <Input
                  disabled={order.status !== "pending"}
                  id="order-date"
                  onChange={(e) => setOrderDate(e.target.value || null)}
                  type="date"
                  value={parsedOrderDate}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-status">Status</Label>
                <Select
                  disabled={order.status !== "pending"}
                  onValueChange={(value) => setOrderStatus(value || null)}
                  value={currentStatus}
                >
                  <SelectTrigger id="order-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="completed">Completo</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {order.status === "pending" && (
                <Button
                  className="w-full"
                  disabled={updateOrder.isPending}
                  onClick={handleUpdateOrder}
                >
                  {updateOrder.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-col space-y-4 rounded-lg border border-border/60 bg-card p-6">
            <h2 className="shrink-0 font-semibold text-xl">
              Produtos no Pedido
            </h2>
            {order.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum produto adicionado ainda
              </p>
            ) : (
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 py-1">
                {order.items.map((item) => (
                  <OrderItemCard
                    canRemove={order.status === "pending"}
                    isRemoving={removeItem.isPending}
                    item={item}
                    key={item.id}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>
            )}
            <div className="shrink-0 border-t pt-4">
              <div className="flex items-center justify-between font-bold text-xl">
                <span>Total:</span>
                <span className="text-primary">
                  {priceFormatter.format(calculatedTotal)}
                </span>
              </div>
            </div>
            {order.status === "pending" && order.items.length > 0 && (
              <Button
                className="w-full shrink-0 bg-emerald-600 hover:bg-emerald-700"
                disabled={completeOrder.isPending}
                onClick={() => setShowCompleteDialog(true)}
              >
                {completeOrder.isPending
                  ? "Completando..."
                  : "Completar Pedido"}
              </Button>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          {order.status === "pending" ? (
            <OrderAddProducts addItem={addItem} orderId={order.id} />
          ) : (
            <OrderCompletedSummary order={order} />
          )}
        </div>
      </div>

      <CompleteOrderDialog
        isCompleting={completeOrder.isPending}
        onConfirm={handleCompleteOrder}
        onOpenChange={setShowCompleteDialog}
        order={showCompleteDialog ? order : null}
      />
    </div>
  );
};
