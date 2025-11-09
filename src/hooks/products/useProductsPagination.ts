"use client"

import { keepPreviousData } from "@tanstack/react-query"
import { api } from "~/trpc/react"

export const useProductsPagination = (
  searchTerm: string,
  isMobile: boolean,
  page: number,
  pageSize: number = 9
) => {
  const { data, isLoading, isError, error } = api.products.list.useQuery(
    {
      page,
      limit: pageSize,
      search: searchTerm.trim() || undefined,
    },
    {
      enabled: !isMobile,
      placeholderData: keepPreviousData,
    }
  )

  return {
    products: data?.items ?? [],
    isLoading,
    isError,
    error,
    totalPages: data?.pagination.totalPages ?? 0,
    hasMore: data?.pagination.hasMore ?? false,
    total: data?.pagination.total ?? 0,
  }
}

