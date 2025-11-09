"use client"

import Image from "next/image"
import { useState, useDeferredValue } from "react"
import { useQueryState } from "nuqs"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Skeleton } from "~/components/ui/skeleton"
import { ProductDeleteDialog } from "~/components/products/ProductDeleteDialog"
import { ProductFormDialog } from "~/components/products/ProductFormDialog"
import { ProductCard } from "~/components/products/ProductCard"
import { InfiniteScrollObserver } from "~/components/products/InfiniteScrollObserver"
import { useProducts } from "~/hooks/useProducts"
import { useBreakpoint } from "~/hooks/useBreakpoint"
import { useProductsPagination } from "~/hooks/useProductsPagination"
import { useProductsInfinite } from "~/hooks/useProductsInfinite"
import type { Product } from "~/types/products/product.type"
import type { ProductFormValues } from "~/types/products/productForm.type"

const defaultFormValues: ProductFormValues = {
  name: "",
  description: "",
  price: "",
  quantity: "",
}

export const ProductsSection = () => {
  const [searchTerm, setSearchTerm] = useQueryState("search", {
    defaultValue: "",
    clearOnDefault: true,
  })
  const [page, setPage] = useQueryState("page", {
    parse: (value) => {
      const parsed = Number.parseInt(value, 10)
      return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed
    },
    serialize: (value) => (value === 1 ? "" : String(value)),
    defaultValue: 1,
  })
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const deferredSearchTerm = useDeferredValue(searchTerm ?? "")

  const handleSearchChange = (value: string) => {
    setSearchTerm(value || null)
    setPage(1)
  }

  const isMobile = useBreakpoint()
  const pagination = useProductsPagination(deferredSearchTerm, isMobile, page, 9)
  const infinite = useProductsInfinite(deferredSearchTerm, isMobile)

  const products = isMobile ? infinite.products : pagination.products
  const isLoading = isMobile ? infinite.isLoading : pagination.isLoading
  const isError = isMobile ? infinite.isError : pagination.isError

  const { createProduct, updateProduct, deleteProduct, adjustQuantity } = useProducts()

  const handleCreateClick = () => {
    setFormMode("create")
    setEditingProduct(null)
    setIsFormOpen(true)
  }

  const handleEditClick = (product: Product) => {
    setFormMode("edit")
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (product: Product) => {
    setDeleteTarget(product)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingProduct(null)
  }

  const closeDeleteDialog = () => {
    setDeleteTarget(null)
  }

  const formInitialValues: ProductFormValues = editingProduct
    ? {
        id: editingProduct.id,
        name: editingProduct.name,
        description: editingProduct.description ?? "",
        price: String(editingProduct.price ?? ""),
        quantity: String(editingProduct.quantity ?? ""),
      }
    : defaultFormValues

  const handleFormSubmit = (values: ProductFormValues) => {
    const payload = {
      name: values.name.trim(),
      description: values.description.trim() ? values.description.trim() : null,
      price: values.price.trim(),
      quantity: values.quantity.trim(),
    }

    if (formMode === "create") {
      createProduct.mutate(payload, {
        onSuccess: () => {
          closeForm()
        },
      })
    } else if (values.id !== undefined) {
      updateProduct.mutate(
        {
          id: values.id,
          ...payload,
        },
        {
          onSuccess: () => {
            closeForm()
          },
        },
      )
    }
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return

    deleteProduct.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          closeDeleteDialog()
        },
      },
    )
  }

  const isSubmitting = formMode === "create" ? createProduct.isPending : updateProduct.isPending
  const isDeleting = deleteProduct.isPending
  const isAdjustingQuantity = adjustQuantity.isPending

  const handleAdjustQuantity = (productId: number, delta: number) => {
    adjustQuantity.mutate({ id: productId, delta })
  }

  const totalProducts = products.length
  const lowStockCount = products.filter((product) => product.quantity < 5).length
  const soldOutCount = products.filter((product) => product.quantity === 0).length

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
  ]

  return (
    <section className="flex w-full flex-col gap-8 py-10">
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card shadow-lg">
        <div className="absolute inset-0">
          <Image
            src="/images/caicara-beer.png"
            alt="Banner Caicara Beer"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-br from-background/90 via-background/70 to-background" />
        </div>
        <div className="relative z-10 flex flex-col gap-10 p-10 sm:p-12">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Caiçara Estoque
            </span>
            <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              Gerencie seu estoque com eficiência e precisão.
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Acompanhe todos os seus produtos em um só lugar, monitore os níveis de estoque e mantenha seu negócio funcionando.
              Adicione novos produtos, atualize preços rapidamente e mantenha seu inventário sempre atualizado.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border/40 bg-background/80 px-4 py-3 backdrop-blur"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/40 bg-card/80 p-6 shadow-sm backdrop-blur md:flex-row md:items-center">
        <div className="relative w-full md:w-96">
          <Input
            value={searchTerm ?? ""}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Buscar produtos por nome, descrição ou preço..."
            className="pl-4"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleCreateClick}>Novo Produto</Button>
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
              <Skeleton key={index} className="h-65 rounded-2xl border border-border/60" />
            ))
          : products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onAdjustQuantity={handleAdjustQuantity}
                isDeleting={isDeleting && deleteTarget?.id === product.id}
                isAdjustingQuantity={isAdjustingQuantity}
              />
            ))}
      </div>

      {/* Desktop Pagination Controls */}
      {!isMobile && (
        <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-card/80 p-4">
          <div className="text-sm text-muted-foreground">
            Página {page} de {pagination.totalPages || 1}
            {pagination.total > 0 && ` • ${products.length} produtos encontrados`}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || pagination.isLoading}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasMore || pagination.isLoading}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Infinite Scroll Observer */}
      {isMobile && (
        <InfiniteScrollObserver
          onIntersect={() => infinite.fetchNextPage()}
          hasMore={infinite.hasNextPage}
          isLoading={infinite.isFetchingNextPage}
        />
      )}

      {!isLoading && products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 bg-card/60 p-12 text-center">
          <p className="text-lg font-semibold">
            {deferredSearchTerm ? "Nenhum produto encontrado" : "Nenhum produto ainda"}
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            {deferredSearchTerm
              ? "Tente ajustar sua busca ou adicione um novo produto."
              : "Comece adicionando seus produtos principais ou novos itens ao catálogo. Eles aparecerão aqui prontos para serem gerenciados."}
          </p>
          <Button onClick={handleCreateClick}>
            {deferredSearchTerm ? "Adicionar novo produto" : "Adicionar seu primeiro produto"}
          </Button>
        </div>
      ) : null}

      <ProductFormDialog
        open={isFormOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            closeForm()
          } else {
            setIsFormOpen(open)
          }
        }}
        title={formMode === "create" ? "Criar produto" : "Atualizar produto"}
        description={
          formMode === "create"
            ? "Adicione um novo produto ao seu catálogo."
            : "Ajuste os detalhes para manter seu estoque atualizado e preciso."
        }
        submitLabel={formMode === "create" ? "Criar produto" : "Salvar alterações"}
        initialValues={formInitialValues}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <ProductDeleteDialog
        product={deleteTarget}
        onOpenChange={(open: boolean) => {
          if (!open) {
            closeDeleteDialog()
          }
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </section>
  )
}

