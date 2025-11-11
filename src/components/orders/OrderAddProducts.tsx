"use client";

import { useQueryState } from "nuqs";
import { useDeferredValue, useMemo, useState } from "react";
import { InfiniteScrollObserver } from "~/components/products/InfiniteScrollObserver";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
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

interface OrderAddProductsProps {
  orderId: number;
  addItem: AddItemMutation;
}

export const OrderAddProducts = ({
  orderId,
  addItem,
}: OrderAddProductsProps) => {
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

  const [selectedProducts, setSelectedProducts] = useState<Map<number, number>>(
    new Map()
  );

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
    setSelectedProducts((prev) => {
      const next = new Map(prev);
      if (selected) {
        next.set(productId, 1);
      } else {
        next.delete(productId);
      }
      return next;
    });
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    setSelectedProducts((prev) => {
      const next = new Map(prev);
      next.set(productId, quantity);
      return next;
    });
  };

  const handleAddProducts = () => {
    if (selectedProducts.size === 0) return;

    const promises = Array.from(selectedProducts.entries()).map(
      ([productId, quantity]) =>
        addItem.mutateAsync({
          orderId,
          productId,
          quantity,
        })
    );

    Promise.all(promises).then(() => {
      setSelectedProducts(new Map());
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4 rounded-lg border border-border/60 bg-card p-6">
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
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 py-1">
            {products.map((product) => (
              <ProductSelectionCard
                isSelected={selectedProducts.has(product.id)}
                key={product.id}
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
                disabled={addItem.isPending}
                onClick={handleAddProducts}
              >
                {addItem.isPending
                  ? "Adicionando..."
                  : `Adicionar ${selectedProducts.size} produto(s)`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
