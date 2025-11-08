import { toast } from "sonner";
import { api } from "~/trpc/react";

export const useProducts = () => {
  const trpcUtils = api.useUtils();
  
  const createProduct = api.products.create.useMutation({
    onSuccess: () => {
      toast.success(`Produto criado com sucesso`);
      trpcUtils.products.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar produto");
    },
  });

  const updateProduct = api.products.update.useMutation({
    onSuccess: () => {
      toast.success(`Produto atualizado com sucesso`);
      trpcUtils.products.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar produto");
    },
  });

  const deleteProduct = api.products.delete.useMutation({
    onSuccess: () => {
      toast.success(`Produto excluído com sucesso`);
      trpcUtils.products.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir produto");
    },
  });

  return { createProduct, updateProduct, deleteProduct };
};