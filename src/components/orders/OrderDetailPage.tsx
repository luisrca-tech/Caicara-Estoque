"use client";

import { OrderDetail } from "./OrderDetail";

interface OrderDetailPageProps {
  orderId: number;
}

export const OrderDetailPage = ({ orderId }: OrderDetailPageProps) => {
  return <OrderDetail orderId={orderId} />;
};


