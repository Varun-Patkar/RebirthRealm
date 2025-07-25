"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NebulaBackground } from "@/components/ui/nebula-background";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Home } from "lucide-react";
import Link from "next/link";
import { Saga } from "@/lib/types";
import { toast } from "sonner";
import { FullscreenStoryExperience } from "@/components/fullscreen-story-experience";

interface StoryPageProps {
	params: {
		id: string;
	};
}

export default function StoryPage({ params }: StoryPageProps) {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [saga, setSaga] = useState<Saga | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		}
	}, [status, router]);

	useEffect(() => {
		const fetchSaga = async () => {
			try {
				const response = await fetch(`/api/sagas/${params.id}`);
				if (response.ok) {
					const data = await response.json();
					setSaga(data);
				} else if (response.status === 404) {
					toast.error("Saga not found");
					router.push("/sagas/browse");
				}
			} catch (error) {
				console.error("Error fetching saga:", error);
				toast.error("Failed to load saga");
			} finally {
				setIsLoading(false);
			}
		};

		if (session && params.id) {
			fetchSaga();
		}
	}, [session, params.id, router]);

	if (status === "loading" || isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<NebulaBackground />
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
			</div>
		);
	}

	if (!session || !saga) {
		return null;
	}

	return (
		<div className="min-h-screen">
			<NebulaBackground />

			{/* Header */}
			<header className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-md z-10 p-4">
				<div className="max-w-[90%] w-full mx-auto flex justify-between items-center">
					<div className="flex items-center space-x-4">
						<Link href={`/sagas/${saga._id}`}>
							<Button
								variant="ghost"
								size="sm"
								className="text-gray-300 hover:text-white"
							>
								<ArrowLeft className="w-4 h-4 mr-2" />
								Back to Saga
							</Button>
						</Link>
						<h1 className="text-xl font-bold text-white hidden md:block">
							{saga.title}
						</h1>
					</div>

					<Link href="/dashboard">
						<Button
							variant="ghost"
							size="sm"
							className="text-gray-300 hover:text-white"
						>
							<Home className="w-4 h-4 mr-2" />
							Dashboard
						</Button>
					</Link>
				</div>
			</header>

			{/* Main Content */}
			<main className="pt-16 pb-8 px-4 w-full mx-auto">
				<FullscreenStoryExperience saga={saga} />
			</main>
		</div>
	);
}
