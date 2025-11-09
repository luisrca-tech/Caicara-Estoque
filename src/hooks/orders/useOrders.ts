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

  return { createOrder, updateOrder, deleteOrder };
}