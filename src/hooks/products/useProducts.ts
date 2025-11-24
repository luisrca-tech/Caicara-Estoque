import { toast } from "sonner";
import { api } from "~/trpc/react";

export const useProducts = () => {
  const trpcUtils = api.useUtils();

  const createProduct = api.products.create.useMutation({
    onSuccess: () => {
      toast.success(`Produto criado com sucesso`);
      trpcUtils.products.list.invalidate();
      trpcUtils.products.listAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar produto");
    },
  });

  const updateProduct = api.products.update.useMutation({
    onSuccess: () => {
      toast.success(`Produto atualizado com sucesso`);
      trpcUtils.products.list.invalidate();
      trpcUtils.products.listAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar produto");
    },
  });

  const deleteProduct = api.products.delete.useMutation({
    onSuccess: () => {
      toast.success(`Produto desabilitado com sucesso`);
      trpcUtils.products.list.invalidate();
      trpcUtils.products.listAll.invalidate();
      trpcUtils.products.listDisabled.invalidate();
      trpcUtils.orders.list.invalidate();
      trpcUtils.orders.getById.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desabilitar produto");
    },
  });

  const restoreProduct = api.products.restore.useMutation({
    onSuccess: () => {
      toast.success(`Produto habilitado com sucesso`);
      trpcUtils.products.list.invalidate();
      trpcUtils.products.listAll.invalidate();
      trpcUtils.products.listDisabled.invalidate();
      trpcUtils.orders.list.invalidate();
      trpcUtils.orders.getById.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao habilitar produto");
    },
  });

  const adjustQuantity = api.products.adjustQuantity.useMutation({
    onSuccess: (data) => {
      trpcUtils.products.list.invalidate();
      trpcUtils.products.listAll.setData(undefined, (prev) => {
        if (!prev || !data) {
          return prev;
        }

        const { id, quantity } = data;

        return prev.map((product) =>
          product.id === id ? { ...product, quantity } : product
        );
      });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao ajustar quantidade");
    },
  });

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    restoreProduct,
    adjustQuantity,
  };
};
