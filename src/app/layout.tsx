import "~/styles/globals.css";

import type { Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import { inter } from "~/assets/fonts/inter";
import { Toaster } from "sonner";

export const metadata: Metadata = {
	title: "Caicara Stock",
	description: "Caicara Stock Management System",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html className={`${inter.variable}`} lang="en">
			<body>
				<TRPCReactProvider>
					{children}
					<Toaster richColors />
				</TRPCReactProvider>
			</body>
		</html>
	);
}
