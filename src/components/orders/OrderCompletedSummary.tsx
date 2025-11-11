import { statusLabels } from "~/constants/statusLabel";
import type { OrderWithItems } from "~/types/orders/order.type";
import { priceFormatter } from "~/utils/priceFormatter";

export const OrderCompletedSummary = ({ order }: { order: OrderWithItems }) => {
  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-card p-6">
      <h2 className="font-semibold text-xl">Resumo do Pedido Completo</h2>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span>Status atual</span>
          <span className="font-semibold">
            {statusLabels[order.status as keyof typeof statusLabels] ??
              order.status}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Data do pedido</span>
          <span className="font-semibold">{order.orderDate}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Quantidade de itens</span>
          <span className="font-semibold">{order.items.length}</span>
        </div>
        <div className="flex items-center justify-between text-base">
          <span>Total</span>
          <span className="font-bold text-primary">
            {priceFormatter.format(Number(order.totalPrice))}
          </span>
        </div>
      </div>
      <div className="rounded-md bg-muted/50 p-4 text-muted-foreground text-sm">
        {order.status === "completed"
          ? "Este pedido foi completado e não pode receber novos produtos."
          : "Este pedido foi cancelado e não pode receber novos produtos."}
      </div>
    </div>
  );
};
