"use client"

import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import type { ProductCardProps } from "~/types/products/productCard.type" 

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
})

export const ProductCard = ({ product, onEdit, onDelete, isDeleting }: ProductCardProps) => {
  const createdLabel =
    product.createdAt instanceof Date ? dateFormatter.format(product.createdAt) : ""
  const quantityStatus =
    product.quantity === 0
      ? {
          label: "Out of stock",
          className: "bg-destructive/10 text-destructive border border-destructive/20",
        }
      : product.quantity < 5
        ? {
            label: "Low stock",
            className: "bg-amber-500/10 text-amber-700 border border-amber-500/20",
          }
        : {
            label: "In stock",
            className: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
          }

  return (
    <Card className="h-full border-border/80 bg-card/95 backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">{product.name}</CardTitle>
            <CardDescription className="mt-1 text-xs text-muted-foreground">
              added {createdLabel}
            </CardDescription>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${quantityStatus.className}`}
          >
            {quantityStatus.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-3xl font-bold text-primary">
            {priceFormatter.format(Number(product.price))}
          </p>
          <p className="text-sm text-muted-foreground">
            {product.quantity} {product.quantity === 1 ? "unit" : "units"} available
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {product.description?.trim() ? product.description : "No description yet."}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        <Button size="sm" variant="outline" onClick={() => onEdit(product)}>
          Edit
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onDelete(product)} disabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </CardFooter>
    </Card>
  )
}

