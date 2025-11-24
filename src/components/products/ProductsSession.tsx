"use client";

import Image from "next/image";
import { useQueryState } from "nuqs";
import { useDeferredValue, useState } from "react";
import { InfiniteScrollObserver } from "~/components/products/InfiniteScrollObserver";
import { ProductCard } from "~/components/products/ProductCard";
import { ProductDeleteDialog } from "~/components/products/ProductDeleteDialog";
import { ProductFormDialog } from "~/components/products/ProductFormDialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { useProducts } from "~/hooks/products/useProducts";
import { useProductsDisabledInfinite } from "~/hooks/products/useProductsDisabledInfinite";
import { useProductsDisabledPagination } from "~/hooks/products/useProductsDisabledPagination";
import { useProductsInfinite } from "~/hooks/products/useProductsInfinite";
import { useProductsPagination } from "~/hooks/products/useProductsPagination";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import { api } from "~/trpc/react";
import type { Product } from "~/types/products/product.type";
import type { ProductFormValues } from "~/types/products/productForm.type";

const defaultFormValues: ProductFormValues = {
  name: "",
  description: "",
  price: "",
  quantity: "",
};

export const ProductsSection = () => {
  const [searchTerm, setSearchTerm] = useQueryState("search", {
    defaultValue: "",
    clearOnDefault: true,
  });
  const [page, setPage] = useQueryState("page", {
    parse: (value) => {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
    },
    serialize: (value) => (value === 1 ? "" : String(value)),
    defaultValue: 1,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [showDisabled, setShowDisabled] = useState(false);

  const deferredSearchTerm = useDeferredValue(searchTerm ?? "");

  const handleSearchChange = (value: string) => {
    setSearchTerm(value || null);
    setPage(1);
  };

  const isMobile = useBreakpoint();
  const pagination = useProductsPagination(
    deferredSearchTerm,
    isMobile,
    page,
    9
  );
  const infinite = useProductsInfinite(deferredSearchTerm, isMobile);
  const disabledPagination = useProductsDisabledPagination(
    deferredSearchTerm,
    isMobile,
    page,
    9
  );
  const disabledInfinite = useProductsDisabledInfinite(
    deferredSearchTerm,
    isMobile
  );
  const { data: allProductsData } = api.products.listAll.useQuery();

  const activeProducts = isMobile ? infinite.products : pagination.products;
  const disabledProducts = isMobile
    ? disabledInfinite.products
    : disabledPagination.products;

  const products = showDisabled ? disabledProducts : activeProducts;
  const isLoading = showDisabled
    ? isMobile
      ? disabledInfinite.isLoading
      : disabledPagination.isLoading
    : isMobile
    ? infinite.isLoading
    : pagination.isLoading;
  const isError = showDisabled
    ? isMobile
      ? disabledInfinite.isError
      : disabledPagination.isError
    : isMobile
    ? infinite.isError
    : pagination.isError;

  const {
    createProduct,
    updateProduct,
    deleteProduct,
    restoreProduct,
    adjustQuantity,
  } = useProducts();

  const { data: orderItemsCountData } =
    api.products.getOrderItemsCount.useQuery(
      { id: deleteTarget?.id ?? 0 },
      { enabled: Boolean(deleteTarget?.id) }
    );

  const orderItemsCount = orderItemsCountData?.count ?? 0;

  const handleCreateClick = () => {
    setFormMode("create");
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setFormMode("edit");
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setDeleteTarget(product);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
  };

  const formInitialValues: ProductFormValues = editingProduct
    ? {
        id: editingProduct.id,
        name: editingProduct.name,
        description: editingProduct.description ?? "",
        price: String(editingProduct.price ?? ""),
        quantity: String(editingProduct.quantity ?? ""),
      }
    : defaultFormValues;

  const handleFormSubmit = (values: ProductFormValues) => {
    const payload = {
      name: values.name.trim(),
      description: values.description.trim() ? values.description.trim() : null,
      price: values.price.trim(),
      quantity: values.quantity.trim(),
    };

    if (formMode === "create") {
      createProduct.mutate(payload, {
        onSuccess: () => {
          closeForm();
        },
      });
    } else if (values.id !== undefined) {
      updateProduct.mutate(
        {
          id: values.id,
          ...payload,
        },
        {
          onSuccess: () => {
            closeForm();
          },
        }
      );
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    deleteProduct.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          closeDeleteDialog();
        },
      }
    );
  };

  const isSubmitting =
    formMode === "create" ? createProduct.isPending : updateProduct.isPending;
  const isDeleting = deleteProduct.isPending;
  const isRestoring = restoreProduct.isPending;
  const isAdjustingQuantity = adjustQuantity.isPending;

  const handleAdjustQuantity = (productId: number, delta: number) => {
    adjustQuantity.mutate({ id: productId, delta });
  };

  const handleRestoreClick = (product: Product) => {
    restoreProduct.mutate(
      { id: product.id },
      {
        onSuccess: () => {
          if (products.length === 1 && page > 1) {
            setPage(page - 1);
          }
        },
      }
    );
  };

  const statsSource = allProductsData ?? [];
  const totalProducts = statsSource.length;
  const lowStockCount = statsSource.filter(
    (product) => product.quantity < 5
  ).length;
  const soldOutCount = statsSource.filter(
    (product) => product.quantity === 0
  ).length;

  const heroStats = [
    {
      label: "Produtos",
      value: totalProducts,
    },
    {
      label: "Estoque baixo",
      value: lowStockCount,
    },
    {
      label: "Esgotado",
      value: soldOutCount,
    },
  ];

  return (
    <section className="flex w-full flex-col gap-8 py-10">
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card shadow-lg">
        <div className="absolute inset-0">
          <Image
            alt="Banner Caicara Beer"
            className="object-cover"
            fill
            priority
            src="/images/caicara-beer.png"
          />
          <div className="absolute inset-0 bg-linear-to-br from-background/90 via-background/70 to-background" />
        </div>
        <div className="relative z-10 flex flex-col gap-10 p-10 sm:p-12">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-semibold text-primary text-xs uppercase tracking-wide">
              Caiçara Estoque
            </span>
            <h1 className="font-bold text-3xl sm:text-4xl lg:text-5xl">
              Gerencie seu estoque com eficiência e precisão.
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Acompanhe todos os seus produtos em um só lugar, monitore os
              níveis de estoque e mantenha seu negócio funcionando. Adicione
              novos produtos, atualize preços rapidamente e mantenha seu
              inventário sempre atualizado.
            </p>
            <div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
              {heroStats.map((stat) => (
                <div
                  className="rounded-2xl border border-border/40 bg-background/80 px-4 py-3 backdrop-blur"
                  key={stat.label}
                >
                  <p className="text-muted-foreground/80 text-xs uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="font-semibold text-2xl text-foreground">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/40 bg-card/80 p-6 shadow-sm backdrop-blur md:flex-row md:items-center">
        <div className="relative w-full md:w-96">
          <Input
            className="pl-4"
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Buscar produtos por nome, descrição ou preço..."
            value={searchTerm ?? ""}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowDisabled(!showDisabled)}
            variant={showDisabled ? "default" : "outline"}
          >
            {showDisabled ? "Ver produtos ativos" : "Itens Desabilitados"}
          </Button>
          {!showDisabled && (
            <Button onClick={handleCreateClick}>Novo Produto</Button>
          )}
        </div>
      </div>

      {isError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-destructive">
          Algo deu errado ao carregar os produtos. Por favor, tente novamente.
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading && products.length === 0
          ? Array.from({ length: 6 }).map((_, index) => (
              <Skeleton
                className="h-65 rounded-2xl border border-border/60"
                key={`skeleton-product-${index + 1}`}
              />
            ))
          : products.map((product) => (
              <ProductCard
                isAdjustingQuantity={isAdjustingQuantity}
                isDeleting={isDeleting && deleteTarget?.id === product.id}
                isRestoring={isRestoring}
                key={product.id}
                onAdjustQuantity={
                  showDisabled ? undefined : handleAdjustQuantity
                }
                onDelete={showDisabled ? undefined : handleDeleteClick}
                onEdit={showDisabled ? undefined : handleEditClick}
                onRestore={showDisabled ? handleRestoreClick : undefined}
                product={product}
                showRestore={showDisabled}
              />
            ))}
      </div>

      {/* Desktop Pagination Controls */}
      {!isMobile && (
        <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-card/80 p-4">
          <div className="text-muted-foreground text-sm">
            Página {page} de{" "}
            {showDisabled
              ? disabledPagination.totalPages || 1
              : pagination.totalPages || 1}
            {(showDisabled ? disabledPagination.total : pagination.total) > 0 &&
              ` • ${products.length} produtos encontrados`}
          </div>
          <div className="flex gap-2">
            <Button
              disabled={
                page === 1 ||
                (showDisabled
                  ? disabledPagination.isLoading
                  : pagination.isLoading)
              }
              onClick={() => setPage(Math.max(1, page - 1))}
              variant="outline"
            >
              Anterior
            </Button>
            <Button
              disabled={
                (showDisabled
                  ? !disabledPagination.hasMore
                  : !pagination.hasMore) ||
                (showDisabled
                  ? disabledPagination.isLoading
                  : pagination.isLoading)
              }
              onClick={() => setPage(page + 1)}
              variant="outline"
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Infinite Scroll Observer */}
      {isMobile && (
        <InfiniteScrollObserver
          hasMore={
            showDisabled ? disabledInfinite.hasNextPage : infinite.hasNextPage
          }
          isLoading={
            showDisabled
              ? disabledInfinite.isFetchingNextPage
              : infinite.isFetchingNextPage
          }
          onIntersect={() => {
            if (showDisabled) {
              disabledInfinite.fetchNextPage();
            } else {
              infinite.fetchNextPage();
            }
          }}
        />
      )}

      {!isLoading && products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/50 border-dashed bg-card/60 p-12 text-center">
          <p className="font-semibold text-lg">
            {showDisabled
              ? deferredSearchTerm
                ? "Nenhum produto desabilitado encontrado"
                : "Nenhum produto desabilitado"
              : deferredSearchTerm
              ? "Nenhum produto encontrado"
              : "Nenhum produto ainda"}
          </p>
          <p className="max-w-md text-muted-foreground text-sm">
            {showDisabled
              ? deferredSearchTerm
                ? "Tente ajustar sua busca."
                : "Não há produtos desabilitados no momento."
              : deferredSearchTerm
              ? "Tente ajustar sua busca ou adicione um novo produto."
              : "Comece adicionando seus produtos principais ou novos itens ao catálogo. Eles aparecerão aqui prontos para serem gerenciados."}
          </p>
          {!showDisabled && (
            <Button onClick={handleCreateClick}>
              {deferredSearchTerm
                ? "Adicionar novo produto"
                : "Adicionar seu primeiro produto"}
            </Button>
          )}
        </div>
      ) : null}

      <ProductFormDialog
        description={
          formMode === "create"
            ? "Adicione um novo produto ao seu catálogo."
            : "Ajuste os detalhes para manter seu estoque atualizado e preciso."
        }
        initialValues={formInitialValues}
        isSubmitting={isSubmitting}
        onOpenChange={(open: boolean) => {
          if (!open) {
            closeForm();
          } else {
            setIsFormOpen(open);
          }
        }}
        onSubmit={handleFormSubmit}
        open={isFormOpen}
        submitLabel={
          formMode === "create" ? "Criar produto" : "Salvar alterações"
        }
        title={formMode === "create" ? "Criar produto" : "Atualizar produto"}
      />

      <ProductDeleteDialog
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onOpenChange={(open: boolean) => {
          if (!open) {
            closeDeleteDialog();
          }
        }}
        orderItemsCount={orderItemsCount}
        product={deleteTarget}
      />
    </section>
  );
};
