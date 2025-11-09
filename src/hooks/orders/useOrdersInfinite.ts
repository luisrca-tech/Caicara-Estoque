"use client";

import { api } from "~/trpc/react";
import type { DateFilter } from "~/types/dateFilter.type";


export const useOrdersInfinite = (isMobile: boolean, dateFilter?: DateFilter) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = api.orders.list.useInfiniteQuery(
    (({ pageParam }: { pageParam: number | undefined }) => ({
      cursor: pageParam,
      limit: 10,
      dateFrom: dateFilter?.from ?? undefined,
      dateTo: dateFilter?.to ?? undefined,
    })) as any,
    {
      enabled: isMobile,
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined,
    },
  );

  const orders = data?.pages.flatMap((page) => page.items) ?? [];

  return {
    orders,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  };
};