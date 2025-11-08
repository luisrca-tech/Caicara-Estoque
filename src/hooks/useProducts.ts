import { toast } from "sonner";
import { api } from "~/trpc/react";

export const useProducts = () => {
  const trpcUtils = api.useUtils();
  
  const createProduct = api.products.create.useMutation({
    onSuccess: () => {
      toast.success(`Product created successfully`);
      trpcUtils.products.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateProduct = api.products.update.useMutation({
    onSuccess: () => {
      toast.success(`Product updated successfully`);
      trpcUtils.products.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteProduct = api.products.delete.useMutation({
    onSuccess: () => {
      toast.success(`Product deleted successfully`);
      trpcUtils.products.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return { createProduct, updateProduct, deleteProduct };
};