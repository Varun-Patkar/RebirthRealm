"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NebulaBackground } from "@/components/ui/nebula-background";
import { GlassCard } from "@/components/ui/glass-card";
import { EditSagaForm } from "@/components/forms/edit-saga-form"; // Changed from default to named import
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Saga } from "@/lib/types";
import { toast } from "sonner";

interface EditSagaPageProps {
	params: {
		id: string;
	};
}

export default function EditSagaPage({ params }: EditSagaPageProps) {
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
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-8 w-8 animate-spin text-purple-500" />
					<p className="text-white">Loading saga details...</p>
				</div>
			</div>
		);
	}

	if (!session || !saga) {
		return null;
	}

	return (
		<div className="min-h-screen py-12 px-4">
			<NebulaBackground />

			<div className="max-w-4xl mx-auto">
				<div className="mb-6 flex items-center">
					<Link href={`/sagas/${params.id}`}>
						<Button
							variant="ghost"
							size="sm"
							className="text-gray-300 hover:text-white"
						>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back to Saga
						</Button>
					</Link>
				</div>

				<GlassCard className="p-6 md:p-8">
					<h1 className="text-2xl font-bold text-white mb-6">Edit Saga</h1>
					<EditSagaForm saga={saga} />
				</GlassCard>
			</div>
		</div>
	);
}
