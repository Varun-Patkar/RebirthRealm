"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { NebulaBackground } from "@/components/ui/nebula-background";

export default function HomePage() {
	const router = useRouter();
	const { data: session, status } = useSession();

	useEffect(() => {
		// Handle navigation based on auth status
		if (status === "loading") return;

		if (session) {
			router.push("/dashboard");
		} else {
			router.push("/login");
		}
	}, [session, status, router]);

	return (
		<div className="min-h-screen flex items-center justify-center">
			<NebulaBackground />
			<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
		</div>
	);
}
