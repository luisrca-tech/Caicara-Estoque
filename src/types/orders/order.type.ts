import type { RouterOutputs } from "~/trpc/react";

export type Order = RouterOutputs["orders"]["list"]["items"][number];
export type OrderWithItems = RouterOutputs["orders"]["getById"];
export type OrderItem = OrderWithItems["items"][number];


