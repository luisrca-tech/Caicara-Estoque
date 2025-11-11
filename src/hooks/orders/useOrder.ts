"use client";

import { api } from "~/trpc/react";

export const useOrder = (orderId: number) => {
  const { data, isLoading, isError, error } = api.orders.getById.useQuery(
    { id: orderId },
    {
      enabled: orderId > 0,
    },
  );

  return {
    data,
    isLoading,
    isError,
    error,
  };
};


