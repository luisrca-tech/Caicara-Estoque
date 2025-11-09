import { keepPreviousData } from "@tanstack/react-query";
import { api } from "~/trpc/react";
import type { DateFilter } from "~/types/dateFilter.type";

export const useOrdersPagination = (isMobile: boolean, page: number = 1, pageSize: number = 10, dateFilter?: DateFilter) => {
  const { data, isLoading, isError, error } = api.orders.list.useQuery({
    page,
    limit: pageSize,
    order: "desc",
    dateFrom: dateFilter?.from ?? undefined,
    dateTo: dateFilter?.to ?? undefined,
  }, {
    enabled: !isMobile,
    placeholderData: keepPreviousData,
  });

  return {
    orders: data?.items ?? [],
    isLoading,
    isError,
    error,
    totalPages: data?.pagination.totalPages ?? 0,
    hasMore: data?.pagination.hasMore ?? false,
    total: data?.pagination.total ?? 0,
  };
}