"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { productFormSchema } from "~/schema/productForm.schema";
import type {
  ProductFormSchema,
  ProductFormValues,
} from "~/types/products/productForm.type";
import type { ProductFormDialogProps } from "~/types/products/productFormDialog.type";

export const ProductFormDialog = ({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValues,
  onSubmit,
  isSubmitting,
}: ProductFormDialogProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: initialValues.name,
      description: initialValues.description || "",
      price: initialValues.price,
      quantity: initialValues.quantity,
      id: initialValues.id,
    },
    values: open
      ? {
          name: initialValues.name,
          description: initialValues.description || "",
          price: initialValues.price,
          quantity: initialValues.quantity,
          id: initialValues.id,
        }
      : undefined,
  });

  const handleFormSubmit = (data: ProductFormSchema) => {
    const values: ProductFormValues = {
      id: data.id,
      name: data.name.trim(),
      description: data.description.trim() || "",
      price: data.price.trim(),
      quantity: data.quantity.trim(),
    };
    onSubmit(values);

    if (data.id === undefined) {
      reset({
        id: undefined,
        name: "",
        description: "",
        price: "",
        quantity: "",
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset({
        name: initialValues.name,
        description: initialValues.description || "",
        price: initialValues.price,
        quantity: initialValues.quantity,
        id: initialValues.id,
      });
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="mx-2 max-h-[90dvh] overflow-y-auto lg:mx-0">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name" isRequired>
                Nome
              </Label>
              <Input
                id="name"
                placeholder="Ex: Produto XYZ 500g"
                {...register("name")}
                maxLength={256}
              />
              {errors.name ? (
                <p className="text-destructive text-xs">
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Conte aos clientes o que torna este produto especial."
                {...register("description")}
                maxLength={256}
              />
              {errors.description ? (
                <p className="text-destructive text-xs">
                  {errors.description.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price" isRequired>
                  Preço
                </Label>
                <Input
                  id="price"
                  inputMode="decimal"
                  placeholder="0,00"
                  {...register("price")}
                />
                {errors.price ? (
                  <p className="text-destructive text-xs">
                    {errors.price.message}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Use vírgula ou ponto para decimais, ex: 9,90
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" isRequired>
                  Quantidade
                </Label>
                <Input
                  id="quantity"
                  inputMode="numeric"
                  placeholder="0"
                  {...register("quantity")}
                />
                {errors.quantity ? (
                  <p className="text-destructive text-xs">
                    {errors.quantity.message}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Salvando..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
