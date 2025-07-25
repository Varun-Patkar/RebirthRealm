import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { LLMStatusProvider } from "@/components/llm-status-provider";
import { LLMReloadButton } from "@/components/llm-reload-button";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "RebirthRealm - Mystical Saga Creator",
	description:
		"Enter the mystical realm of infinite sagas. Create, explore, and share your epic tales.",
	icons: {
		icon: [
			{ url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
		],
		apple: [
			{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
		],
	},
	manifest: "/site.webmanifest",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="overflow-x-hidden">
			<head>
				<link
					rel="apple-touch-icon"
					sizes="180x180"
					href="/apple-touch-icon.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="32x32"
					href="/favicon-32x32.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="16x16"
					href="/favicon-16x16.png"
				/>
				<link rel="manifest" href="/site.webmanifest" />
			</head>
			<body className={`${inter.className} overflow-x-hidden`}>
				<Providers>
					<LLMStatusProvider>
						{/* Reload Button */}
						<div className="fixed top-4 right-4 z-40">
							<LLMReloadButton />
						</div>

						<div className="w-full max-w-[95%] mx-auto">{children}</div>
						<Toaster
							theme="dark"
							position="top-right"
							toastOptions={{
								style: {
									background: "rgba(255, 255, 255, 0.1)",
									backdropFilter: "blur(10px)",
									border: "1px solid rgba(255, 255, 255, 0.2)",
									color: "white",
								},
							}}
						/>
					</LLMStatusProvider>
				</Providers>
			</body>
		</html>
	);
}
