"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NebulaBackground } from "@/components/ui/nebula-background";
import { GlassCard } from "@/components/ui/glass-card";
import { MysticalButton } from "@/components/ui/mystical-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	ArrowLeft,
	Calendar,
	User,
	Edit,
	Trash2,
	Sparkles,
	BookOpen,
	Share,
	LibraryBig,
	Wand2,
	Bookmark, // Add this import for the chapters icon
} from "lucide-react";
import Link from "next/link";
import { Saga } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { StoryGenerator } from "@/components/story-generator";

interface SagaPageProps {
	params: {
		id: string;
	};
}

export default function SagaPage({ params }: SagaPageProps) {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [saga, setSaga] = useState<Saga | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isDeleting, setIsDeleting] = useState(false);

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

	const handleDelete = async () => {
		if (
			!saga ||
			!confirm(
				"Are you sure you want to delete this saga? This action cannot be undone."
			)
		) {
			return;
		}

		setIsDeleting(true);
		try {
			const response = await fetch(`/api/sagas/${saga._id}`, {
				method: "DELETE",
			});

			if (response.ok) {
				toast.success("Saga deleted successfully");
				router.push("/dashboard");
			} else {
				toast.error("Failed to delete saga");
			}
		} catch (error) {
			console.error("Error deleting saga:", error);
			toast.error("Failed to delete saga");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: saga?.title,
					text: saga?.premise,
					url: window.location.href,
				});
			} catch (error) {
				// User cancelled share
			}
		} else {
			// Fallback to copying URL
			navigator.clipboard.writeText(window.location.href);
			toast.success("Link copied to clipboard!");
		}
	};

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

	const isOwner = saga.userId === session.user?.id;

	return (
		<div className="min-h-screen p-4 md:p-8">
			<NebulaBackground />

			<div className="max-w-4xl md:max-w-6xl lg:max-w-7xl mx-auto">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<Link href="/sagas/browse">
						<Button variant="ghost" className="text-gray-300 hover:text-white">
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back to Browse
						</Button>
					</Link>

					<div className="flex items-center space-x-2">
						<Button
							variant="ghost"
							onClick={handleShare}
							className="text-gray-300 hover:text-white"
						>
							<Share className="w-4 h-4 mr-2" />
							Share
						</Button>

						{isOwner && (
							<>
								<Link href={`/sagas/${saga._id}/edit`}>
									<Button
										variant="ghost"
										className="text-gray-300 hover:text-white"
									>
										<Edit className="w-4 h-4 mr-2" />
										Edit
									</Button>
								</Link>
								<Button
									variant="ghost"
									onClick={handleDelete}
									disabled={isDeleting}
									className="text-red-400 hover:text-red-300"
								>
									<Trash2 className="w-4 h-4 mr-2" />
									{isDeleting ? "Deleting..." : "Delete"}
								</Button>
							</>
						)}
					</div>
				</div>

				{/* Saga Content */}
				<div className="space-y-6">
					{/* Title and Metadata */}
					<GlassCard className="p-8" glow>
						<div className="flex flex-col md:flex-row justify-between items-start mb-6">
							<div className="flex-1">
								<Badge
									variant="secondary"
									className="bg-purple-500/20 text-purple-300 border-purple-500/30 mb-4"
								>
									{saga.worldName}
								</Badge>
								<h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-teal-400 to-yellow-400 bg-clip-text text-transparent mb-4">
									{saga.title}
								</h1>
							</div>
						</div>

						<div className="flex flex-wrap gap-4 text-sm text-gray-400">
							<div className="flex items-center">
								<User className="w-4 h-4 mr-1" />
								{isOwner ? "You" : "Anonymous"}
							</div>
							<div className="flex items-center">
								<Calendar className="w-4 h-4 mr-1" />
								Created{" "}
								{formatDistanceToNow(new Date(saga.createdAt), {
									addSuffix: true,
								})}
							</div>
							{saga.updatedAt !== saga.createdAt && (
								<div className="flex items-center">
									<Edit className="w-4 h-4 mr-1" />
									Updated{" "}
									{formatDistanceToNow(new Date(saga.updatedAt), {
										addSuffix: true,
									})}
								</div>
							)}
							<div className="flex items-center">
								<Bookmark className="w-4 h-4 mr-1" />
								{saga.totalChapters || 100} Chapters
							</div>
						</div>
					</GlassCard>

					{/* World Description */}
					<GlassCard className="p-6">
						<h2 className="text-xl font-bold text-white mb-4 flex items-center">
							<LibraryBig className="w-5 h-5 mr-2 text-purple-400" />
							World Description
						</h2>
						<p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
							{saga.worldDescription}
						</p>
					</GlassCard>

					{/* Mood & Tropes */}
					<GlassCard className="p-6">
						<h2 className="text-xl font-bold text-white mb-4 flex items-center">
							<Wand2 className="w-5 h-5 mr-2 text-teal-400" />
							Mood & Tropes
						</h2>
						<p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
							{saga.moodAndTropes}
						</p>
					</GlassCard>

					{/* Premise */}
					<GlassCard className="p-6">
						<h2 className="text-xl font-bold text-white mb-4 flex items-center">
							<BookOpen className="w-5 h-5 mr-2 text-yellow-400" />
							Premise
						</h2>
						<div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
							{saga.premise}
						</div>
						<div className="mt-4 text-sm text-gray-400 flex items-center">
							<Bookmark className="w-4 h-4 mr-1 text-yellow-400" />
							Planned Length:{" "}
							<span className="font-semibold ml-1">
								{saga.totalChapters || 100} Chapters
							</span>
						</div>
					</GlassCard>

					{/* Advanced Options */}
					{saga.advancedOptions && (
						<GlassCard className="p-6">
							<h2 className="text-xl font-bold text-white mb-4 flex items-center">
								<Sparkles className="w-5 h-5 mr-2 text-purple-400" />
								Advanced Options
							</h2>
							<div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
								{saga.advancedOptions}
							</div>
						</GlassCard>
					)}

					{/* Story Generator */}
					<GlassCard className="p-6">
						<h2 className="text-xl font-bold text-white mb-4 flex items-center">
							<Sparkles className="w-5 h-5 mr-2 text-purple-400" />
							Interactive Story
						</h2>
						<div className="text-gray-300 mb-6">
							Immerse yourself in an interactive story set in the world of{" "}
							{saga.title}. Make choices that affect the narrative and create
							your own unique adventure.
						</div>

						<div className="flex justify-center">
							<Link href={`/sagas/${saga._id}/story`}>
								<MysticalButton size="lg" glow>
									<BookOpen className="w-5 h-5 mr-2" />
									Enter Fullscreen Story
								</MysticalButton>
							</Link>
						</div>
					</GlassCard>
				</div>
			</div>
		</div>
	);
}
