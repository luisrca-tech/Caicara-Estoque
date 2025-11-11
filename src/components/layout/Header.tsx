"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";

export const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isOrdersPage = pathname?.startsWith("/pedidos");

  return (
    <header className="border-border/40 border-b">
      <div className="sticky top-0 z-50 mx-auto w-full max-w-7xl bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 lg:px-0">
          <div className="flex items-center gap-4">
            {pathname !== "/" && (
              <Button
                className="gap-2"
                onClick={() => router.back()}
                size="sm"
                variant="ghost"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            )}
          </div>
          <div className="flex items-center gap-4">
            {!isOrdersPage && (
              <Button size="sm" variant="outline">
                <Link href="/pedidos">Página de Pedidos</Link>
              </Button>
            )}
            {isOrdersPage && (
              <Button size="sm" variant="outline">
                <Link href="/">Página de Produtos</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
