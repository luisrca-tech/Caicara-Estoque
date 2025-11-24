import { toast } from "sonner";
import { api } from "~/trpc/react";

export const useOrders = () => {
  const trpcUtils = api.useUtils();

  const createOrder = api.orders.create.useMutation({
    onSuccess: () => {
      toast.success("Pedido criado com sucesso");
      trpcUtils.orders.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar pedido");
    },
  });

  const updateOrder = api.orders.update.useMutation({
    onSuccess: () => {
      toast.success("Pedido atualizado com sucesso");
      trpcUtils.orders.list.invalidate();
      trpcUtils.orders.getById.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar pedido");
    },
  });

  const deleteOrder = api.orders.delete.useMutation({
    onSuccess: () => {
      toast.success("Pedido excluído com sucesso");
      trpcUtils.orders.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir pedido");
    },
  });

  const addItem = api.orders.addItem.useMutation({
    onSuccess: () => {
      toast.success("Produto adicionado ao pedido");
      trpcUtils.orders.getById.invalidate();
      trpcUtils.orders.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao adicionar produto");
    },
  });

  const removeItem = api.orders.removeItem.useMutation({
    onSuccess: () => {
      toast.success("Produto removido do pedido");
      trpcUtils.orders.getById.invalidate();
      trpcUtils.orders.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover produto");
    },
  });

  const updateItem = api.orders.updateItem.useMutation({
    onSuccess: () => {
      toast.success("Produto atualizado no pedido");
      trpcUtils.orders.getById.invalidate();
      trpcUtils.orders.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar produto");
    },
  });

  const completeOrder = api.orders.completeOrder.useMutation({
    onSuccess: () => {
      toast.success(
        "Pedido completado com sucesso! Produtos adicionados ao estoque."
      );
      trpcUtils.orders.getById.invalidate();
      trpcUtils.orders.list.invalidate();
      trpcUtils.products.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao completar pedido");
    },
  });

  return {
    createOrder,
    updateOrder,
    deleteOrder,
    addItem,
    removeItem,
    updateItem,
    completeOrder,
  };
};
