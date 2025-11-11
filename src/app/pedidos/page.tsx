import { OrdersSection } from "~/components/orders";
import { HydrateClient } from "~/trpc/server";

export default async function PedidosPage() {
  return (
    <HydrateClient>
      <main className="min-h-screen overflow-x-hidden bg-linear-to-br from-background via-background to-muted/40 px-4 py-8 text-foreground sm:px-6 sm:py-12 lg:px-12">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 sm:gap-12">
          <OrdersSection />
        </div>
      </main>
    </HydrateClient>
  );
}
