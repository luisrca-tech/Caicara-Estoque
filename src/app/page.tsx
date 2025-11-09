
import { HydrateClient } from "~/trpc/server"
import { ProductsSection } from "~/components/products"

export default async function Home() {
  return (
    <HydrateClient>
      <main className="min-h-screen bg-linear-to-br from-background via-background to-muted/40 px-4 py-12 text-foreground sm:px-6 lg:px-12">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-12">
          <ProductsSection />
        </div>
      </main>
    </HydrateClient>
  )
}