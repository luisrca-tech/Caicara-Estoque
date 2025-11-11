/** biome-ignore-all lint/suspicious/noExplicitAny: any is used to avoid type errors */
"use client";

import { api } from "~/trpc/react";

export const useProductsInfinite = (searchTerm: string, isMobile: boolean) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = api.products.list.useInfiniteQuery(
    (({ pageParam }: { pageParam: number | undefined }) => ({
      cursor: pageParam,
      limit: 9,
      search: searchTerm.trim() || undefined,
    })) as any,
    {
      enabled: isMobile,
      getNextPageParam: (lastPage) => {
        if (lastPage.pagination.hasMore && lastPage.pagination.nextCursor) {
          return lastPage.pagination.nextCursor;
        }
        return undefined;
      },
    }
  );

  const products = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages?.[0]?.pagination?.total ?? 0;

  return {
    products,
    total,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  };
};
