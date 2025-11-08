"use client"

import Image from "next/image"
import { useMemo, useState } from "react"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Skeleton } from "~/components/ui/skeleton"
import { ProductDeleteDialog } from "~/components/products/ProductDeleteDialog"
import { ProductFormDialog } from "~/components/products/ProductFormDialog"
import { ProductCard } from "~/components/products/ProductCard"
import { useProducts } from "~/hooks/useProducts"
import { api } from "~/trpc/react"
import type { Product } from "~/types/products/product.type"
import type { ProductFormValues } from "~/types/products/productForm.type"

const defaultFormValues: ProductFormValues = {
  name: "",
  description: "",
  price: "",
  quantity: "",
}

export const ProductsSection = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const { data: products, isLoading, isError, refetch } = api.products.list.useQuery()
  const { createProduct, updateProduct, deleteProduct } = useProducts()

  const filteredProducts = useMemo(() => {
    if (!products) return []
    if (!searchTerm.trim()) return products
    const query = searchTerm.toLowerCase()
    return products.filter((product) => {
      const searchFields = [
        product.name ?? "",
        product.description ?? "",
        String(product.price ?? ""),
      ]
      return searchFields.some((field) => field.toLowerCase().includes(query))
    })
  }, [products, searchTerm])

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

  const totalProducts = products?.length ?? 0
  const lowStockCount = products ? products.filter((product) => product.quantity < 5).length : 0
  const soldOutCount = products ? products.filter((product) => product.quantity === 0).length : 0

  const heroStats = [
    {
      label: "Products",
      value: totalProducts,
    },
    {
      label: "Low stock",
      value: lowStockCount,
    },
    {
      label: "Sold out",
      value: soldOutCount,
    },
  ]

  return (
    <section className="flex w-full flex-col gap-8 py-10">
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card shadow-lg">
        <div className="absolute inset-0">
          <Image
            src="/images/caicara-beer.png"
            alt="Caicara Beer banner"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-br from-background/90 via-background/70 to-background" />
        </div>
        <div className="relative z-10 flex flex-col gap-10 p-10 sm:p-12">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Caiçara Stock
            </span>
            <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              Craft your inventory with flavor and precision.
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Track all your beers in one place, monitor stock levels, and keep your taps flowing.
              Create seasonal releases, update pricing on the fly, and maintain a perfect pour.
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
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search products by name, description, or price..."
            className="pl-4"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
          <Button onClick={handleCreateClick}>New Product</Button>
        </div>
      </div>

      {isError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-destructive">
          Something went wrong while loading products. Please try again.
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-[260px] rounded-2xl border border-border/60" />
            ))
          : filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                isDeleting={isDeleting && deleteTarget?.id === product.id}
              />
            ))}
      </div>

      {!isLoading && filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 bg-card/60 p-12 text-center">
          <p className="text-lg font-semibold">No products yet</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Start by adding your flagship beers or new seasonal creations. They will appear here
            ready to be managed.
          </p>
          <Button onClick={handleCreateClick}>Add your first product</Button>
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
        title={formMode === "create" ? "Create product" : "Update product"}
        description={
          formMode === "create"
            ? "Craft a new brew for the Caicara lineup."
            : "Tweak details to keep your stock fresh and accurate."
        }
        submitLabel={formMode === "create" ? "Create product" : "Save changes"}
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

