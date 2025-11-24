import { redirect } from "next/navigation";
import { OrderDetailPage } from "~/components/orders/OrderDetailPage";
import { api, HydrateClient } from "~/trpc/server";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  if (id === "new") {
    const newOrder = await api.orders.create({
      orderDate: new Date(),
      status: "pending",
      items: [],
    });
    redirect(`/pedidos/${newOrder.id}`);
  }

  const orderId = Number.parseInt(id, 10);

  if (Number.isNaN(orderId)) {
    return (
      <HydrateClient>
        <main className="flex h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] flex-col overflow-y-auto bg-linear-to-br from-background via-background to-muted/40 text-foreground md:overflow-hidden">
          <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-8 md:h-full md:min-h-0 lg:px-0">
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Pedido inválido</p>
            </div>
          </div>
        </main>
      </HydrateClient>
    );
  }

  return (
    <HydrateClient>
      <main className="flex h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] flex-col overflow-y-auto bg-linear-to-br from-background via-background to-muted/40 text-foreground md:overflow-hidden">
        <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-8 md:h-full md:min-h-0 lg:px-0">
          <OrderDetailPage orderId={orderId} />
        </div>
      </main>
    </HydrateClient>
  );
}
