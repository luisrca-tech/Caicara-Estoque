"use client";

import { useRouter } from "next/navigation";
import { useOrders } from "~/hooks/orders/useOrders";
import { OrdersList } from "./OrdersList";

export const OrdersSection = () => {
  const router = useRouter();
  const { createOrder } = useOrders();

  const handleCreateNew = async () => {
    try {
      const newOrder = await createOrder.mutateAsync({
        orderDate: new Date(),
        status: "pending",
        items: [],
      });
      router.push(`/pedidos/${newOrder.id}`);
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  return <OrdersList onCreateNew={handleCreateNew} />;
};
