"use client";

import { useQueryState } from "nuqs";
import { useDeferredValue, useMemo, useState } from "react";
import { InfiniteScrollObserver } from "~/components/products/InfiniteScrollObserver";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { useOrder } from "~/hooks/orders/useOrder";
import type { useOrders } from "~/hooks/orders/useOrders";
import { useProductsInfinite } from "~/hooks/products/useProductsInfinite";
import { useProductsPagination } from "~/hooks/products/useProductsPagination";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import { ProductSelectionCard } from "./ProductSelectionCard";

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type AddItemMutation = ReturnType<typeof useOrders>["addItem"];
type UpdateItemMutation = ReturnType<typeof useOrders>["updateItem"];
type RemoveItemMutation = ReturnType<typeof useOrders>["removeItem"];

interface OrderAddProductsProps {
  orderId: number;
  addItem: AddItemMutation;
  updateItem: UpdateItemMutation;
  removeItem: RemoveItemMutation;
}

export const OrderAddProducts = ({
  orderId,
  addItem,
  updateItem,
  removeItem,
}: OrderAddProductsProps) => {
  const { data: order } = useOrder(orderId);
  const [searchTerm, setSearchTerm] = useQueryState("order-product-search", {
    defaultValue: "",
    clearOnDefault: true,
  });

  const deferredSearchTerm = useDeferredValue(searchTerm ?? "");
  const isMobile = useBreakpoint();
  const pagination = useProductsPagination(deferredSearchTerm, isMobile, 1, 9);
  const infinite = useProductsInfinite(deferredSearchTerm, isMobile);

  const products = isMobile ? infinite.products : pagination.products;
  const isLoadingProducts = isMobile
    ? infinite.isLoading
    : pagination.isLoading;

  const existingItemsMap = useMemo(() => {
    const map = new Map<number, { quantity: number; itemId: number }>();
    if (order?.items) {
      order.items.forEach((item) => {
        map.set(item.productId, { quantity: item.quantity, itemId: item.id });
      });
    }
    return map;
  }, [order?.items]);

  const [userModifications, setUserModifications] = useState<
    Map<number, number>
  >(new Map());

  const cleanedUserModifications = useMemo(() => {
    const cleaned = new Map<number, number>();
    userModifications.forEach((quantity, productId) => {
      if (
        existingItemsMap.has(productId) ||
        products.some((p) => p.id === productId)
      ) {
        cleaned.set(productId, quantity);
      }
    });
    return cleaned;
  }, [userModifications, existingItemsMap, products]);

  const selectedProducts = useMemo(() => {
    const merged = new Map<number, number>();
    existingItemsMap.forEach((value, productId) => {
      merged.set(productId, value.quantity);
    });
    cleanedUserModifications.forEach((quantity, productId) => {
      merged.set(productId, quantity);
    });
    return merged;
  }, [existingItemsMap, cleanedUserModifications]);

  const selectedProductsTotal = useMemo(() => {
    return Array.from(selectedProducts.entries()).reduce(
      (acc, [productId, quantity]) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return acc;
        return acc + Number(product.price) * quantity;
      },
      0
    );
  }, [products, selectedProducts]);

  const handleProductSelect = (productId: number, selected: boolean) => {
    setUserModifications((prev) => {
      const next = new Map(prev);
      if (selected) {
        const existingQuantity = existingItemsMap.get(productId)?.quantity ?? 1;
        next.set(productId, existingQuantity);
      } else {
        next.delete(productId);
      }
      return next;
    });
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    setUserModifications((prev) => {
      const next = new Map(prev);
      next.set(productId, quantity);
      return next;
    });
  };

  const handleAddProducts = () => {
    const promises: Promise<unknown>[] = [];

    selectedProducts.forEach((quantity, productId) => {
      if (!existingItemsMap.has(productId)) {
        promises.push(
          addItem.mutateAsync({
            orderId,
            productId,
            quantity,
          })
        );
      }
    });

    selectedProducts.forEach((quantity, productId) => {
      const existingItem = existingItemsMap.get(productId);
      if (existingItem && existingItem.quantity !== quantity) {
        promises.push(
          updateItem.mutateAsync({
            orderId,
            itemId: existingItem.itemId,
            quantity,
          })
        );
      }
    });

    existingItemsMap.forEach(({ itemId }, productId) => {
      if (!selectedProducts.has(productId)) {
        promises.push(
          removeItem.mutateAsync({
            orderId,
            itemId,
          })
        );
      }
    });

    if (promises.length === 0) return;

    Promise.all(promises).then(() => {
      setUserModifications(new Map());
    });
  };

  return (
    <div className="flex flex-col space-y-4 rounded-lg border border-border/60 bg-card p-6 md:h-full md:min-h-0">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-semibold text-xl">Adicionar Produtos</h2>
        <div className="w-full sm:w-80">
          <Input
            onChange={(event) => setSearchTerm(event.target.value || null)}
            placeholder="Buscar produtos por nome, descrição ou preço..."
            value={searchTerm ?? ""}
          />
        </div>
      </div>

      {isLoadingProducts ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              className="h-32 w-full"
              key={`skeleton-product-${index + 1}`}
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nenhum produto encontrado
        </p>
      ) : (
        <div className="flex flex-col md:min-h-0 md:flex-1">
          <div className="space-y-4 px-2 py-1 md:min-h-0 md:flex-1 md:overflow-y-auto">
            {products.map((product) => (
              <ProductSelectionCard
                isSelected={selectedProducts.has(product.id)}
                key={`${product.id}-${selectedProducts.get(product.id) ?? 0}`}
                onQuantityChange={handleQuantityChange}
                onSelect={handleProductSelect}
                product={product}
                quantity={selectedProducts.get(product.id) || 1}
              />
            ))}
          </div>
          {isMobile && (
            <div className="shrink-0">
              <InfiniteScrollObserver
                hasMore={infinite.hasNextPage}
                isLoading={infinite.isFetchingNextPage}
                onIntersect={() => infinite.fetchNextPage()}
              />
            </div>
          )}
          {selectedProducts.size > 0 && (
            <div className="shrink-0 space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Total selecionado:
                </span>
                <span className="font-bold text-lg text-primary">
                  {priceFormatter.format(selectedProductsTotal)}
                </span>
              </div>
              <Button
                className="w-full"
                disabled={
                  addItem.isPending ||
                  updateItem.isPending ||
                  removeItem.isPending
                }
                onClick={handleAddProducts}
              >
                {addItem.isPending ||
                updateItem.isPending ||
                removeItem.isPending
                  ? "Salvando..."
                  : "Salvar alterações"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
