"use client";

import { useQueryState } from "nuqs";
import { useState } from "react";
import { InfiniteScrollObserver } from "~/components/products/InfiniteScrollObserver";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useOrders } from "~/hooks/orders/useOrders";
import { useOrdersInfinite } from "~/hooks/orders/useOrdersInfinite";
import { useOrdersPagination } from "~/hooks/orders/useOrdersPagination";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import type { DateFilter } from "~/types/dateFilter.type";
import type { Order } from "~/types/orders/order.type";
import { DateRangePicker } from "./DateRangePicker";
import { OrderCard } from "./OrderCard";

interface OrdersListProps {
  onCreateNew?: () => void;
}

export const OrdersList = ({ onCreateNew }: OrdersListProps) => {
  const [page, setPage] = useQueryState("page", {
    parse: (value) => {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
    },
    serialize: (value) => (value === 1 ? "" : String(value)),
    defaultValue: 1,
  });

  const [dateFilter, setDateFilter] = useState<DateFilter | undefined>();

  const isMobile = useBreakpoint();
  const pagination = useOrdersPagination(isMobile, page, 10, dateFilter);
  const infinite = useOrdersInfinite(isMobile, dateFilter);

  const orders = isMobile ? infinite.orders : pagination.orders;
  const isLoading = isMobile ? infinite.isLoading : pagination.isLoading;
  const { deleteOrder } = useOrders();

  const handleDelete = (order: Order) => {
    if (confirm(`Tem certeza que deseja excluir o pedido #${order.id}?`)) {
      deleteOrder.mutate({ id: order.id });
    }
  };

  const handleDateUpdate = (values: { dateFrom?: Date; dateTo?: Date }) => {
    setDateFilter({
      from: values.dateFrom,
      to: values.dateTo,
    });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-bold text-2xl">Pedidos</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DateRangePicker onUpdate={handleDateUpdate} />
          {onCreateNew && (
            <Button onClick={onCreateNew} className="w-full sm:w-auto">
              Novo Pedido
            </Button>
          )}
        </div>
      </div>

      {isLoading && orders.length === 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              className="h-65 rounded-2xl border border-border/60"
              key={`skeleton-order-${index + 1}`}
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {orders.map((order) => (
              <OrderCard
                isDeleting={deleteOrder.isPending}
                key={order.id}
                onDelete={handleDelete}
                order={order}
              />
            ))}
          </div>

          {isMobile ? (
            <InfiniteScrollObserver
              hasMore={infinite.hasNextPage}
              isLoading={infinite.isFetchingNextPage}
              onIntersect={() => infinite.fetchNextPage()}
            />
          ) : (
            <div className="flex items-center justify-center gap-4">
              <Button
                disabled={page === 1 || isLoading}
                onClick={() => setPage(Math.max(1, page - 1))}
                variant="outline"
              >
                Anterior
              </Button>
              <span className="text-muted-foreground text-sm">
                Página {page} de {pagination.totalPages || 1}
              </span>
              <Button
                disabled={!pagination.hasMore || isLoading}
                onClick={() => setPage(page + 1)}
                variant="outline"
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
