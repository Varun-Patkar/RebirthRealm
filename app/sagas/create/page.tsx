"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { NebulaBackground } from "@/components/ui/nebula-background";
import { GlassCard } from "@/components/ui/glass-card";
import { MysticalButton } from "@/components/ui/mystical-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	ArrowLeft,
	Sparkles,
	Scroll,
	Wand2,
	BookOpen,
	LibraryBig,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const sagaSchema = z.object({
	title: z
		.string()
		.min(1, "Title is required")
		.max(100, "Title must be less than 100 characters"),
	worldName: z
		.string()
		.min(1, "Fandom/World Name is required")
		.max(50, "Name must be less than 50 characters"),
	worldDescription: z
		.string()
		.min(20, "Description must be at least 20 characters")
		.max(4000, "Description must be less than 4000 characters"),
	moodAndTropes: z
		.string()
		.min(5, "Mood/Tropes must be at least 5 characters")
		.max(600, "Mood/Tropes must be less than 600 characters"),
	premise: z
		.string()
		.min(20, "Premise must be at least 20 characters")
		.max(6000, "Premise must be less than 6000 characters"),
	advancedOptions: z
		.string()
		.max(500, "Advanced options must be less than 500 characters")
		.optional(),
});

type SagaFormData = z.infer<typeof sagaSchema>;

export default function CreateSagaPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SagaFormData>({
		resolver: zodResolver(sagaSchema),
	});

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		}
	}, [status, router]);

	const onSubmit = async (data: SagaFormData) => {
		setIsLoading(true);

		try {
			const response = await fetch("/api/sagas", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (response.ok) {
				const saga = await response.json();
				toast.success("Saga created successfully!");
				router.push(`/sagas/${saga._id}`);
			} else {
				const error = await response.json();
				toast.error(error.message || "Failed to create saga");
			}
		} catch (error) {
			console.error("Error creating saga:", error);
			toast.error("Failed to create saga");
		} finally {
			setIsLoading(false);
		}
	};

	if (status === "loading") {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<NebulaBackground />
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
			</div>
		);
	}

	if (!session) {
		return null;
	}

	return (
		<div className="min-h-screen p-4 md:p-8">
			<NebulaBackground />

			<div className="max-w-4xl md:max-w-6xl lg:max-w-7xl mx-auto">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-teal-400 to-yellow-400 bg-clip-text text-transparent mb-2">
							Create New Saga
						</h1>
						<p className="text-gray-300 text-lg">
							Weave your tale into the mystical fabric of RebirthRealm
						</p>
					</div>

					<Link href="/dashboard">
						<Button variant="ghost" className="text-gray-300 hover:text-white">
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back to Dashboard
						</Button>
					</Link>
				</div>

				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="space-y-6">
						{/* Basic Information */}
						<GlassCard className="p-6" glow>
							<div className="flex items-center mb-6">
								<Scroll className="w-6 h-6 text-purple-400 mr-2" />
								<h2 className="text-2xl font-bold text-white">
									Basic Information
								</h2>
							</div>

							<div className="space-y-4">
								<div>
									<Label htmlFor="title" className="text-white">
										Saga Title
									</Label>
									<Input
										id="title"
										{...register("title")}
										placeholder="Enter your saga's title..."
										className="mt-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
									/>
									{errors.title && (
										<p className="text-red-400 text-sm mt-1">
											{errors.title.message}
										</p>
									)}
								</div>
							</div>
						</GlassCard>

						{/* World/Fandom Details */}
						<GlassCard className="p-6">
							<div className="flex items-center mb-6">
								<LibraryBig className="w-6 h-6 text-teal-400 mr-2" />
								<h2 className="text-2xl font-bold text-white">
									World/Fandom Details
								</h2>
							</div>

							<div className="space-y-4">
								<div>
									<Label htmlFor="worldName" className="text-white">
										Fandom/World Name
									</Label>
									<Input
										id="worldName"
										{...register("worldName")}
										placeholder="Enter the fandom name or your custom world name..."
										className="mt-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
									/>
									<p className="text-gray-400 text-xs mt-1">
										Example: "Harry Potter", "Marvel Universe", or your own
										custom world name
									</p>
									{errors.worldName && (
										<p className="text-red-400 text-sm mt-1">
											{errors.worldName.message}
										</p>
									)}
								</div>

								<div>
									<Label htmlFor="worldDescription" className="text-white">
										World/Fandom Description
									</Label>
									<Textarea
										id="worldDescription"
										{...register("worldDescription")}
										placeholder="Describe the world state, key characters, magic systems, technology level, etc..."
										className="mt-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
										rows={5}
									/>
									<p className="text-gray-400 text-xs mt-1">
										For existing fandoms: describe the world state and key
										characters. For original worlds: describe the setting
										(medieval/magic/futuristic), key locations, and important
										figures.
									</p>
									{errors.worldDescription && (
										<p className="text-red-400 text-sm mt-1">
											{errors.worldDescription.message}
										</p>
									)}
								</div>
							</div>
						</GlassCard>

						{/* Story Details */}
						<GlassCard className="p-6">
							<div className="flex items-center mb-6">
								<Wand2 className="w-6 h-6 text-yellow-400 mr-2" />
								<h2 className="text-2xl font-bold text-white">Story Details</h2>
							</div>

							<div className="space-y-4">
								<div>
									<Label htmlFor="moodAndTropes" className="text-white">
										Mood & Tropes
									</Label>
									<Textarea
										id="moodAndTropes"
										{...register("moodAndTropes")}
										placeholder="Describe the mood and key tropes you want in your story..."
										className="mt-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
										rows={3}
									/>
									<p className="text-gray-400 text-xs mt-1">
										Examples: gritty, redemption arc, chosen one, power fantasy,
										coming of age, enemies to lovers, etc.
									</p>
									{errors.moodAndTropes && (
										<p className="text-red-400 text-sm mt-1">
											{errors.moodAndTropes.message}
										</p>
									)}
								</div>

								<div>
									<Label htmlFor="premise" className="text-white">
										Premise
									</Label>
									<Textarea
										id="premise"
										{...register("premise")}
										placeholder="Describe the main character and story premise..."
										className="mt-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
										rows={5}
									/>
									<p className="text-gray-400 text-xs mt-1">
										Describe what you want the main character to be like and
										their journey. Examples: a fluffy story where the MC never
										faces problems, a power fantasy where the MC starts weak and
										grows stronger, etc.
									</p>
									{errors.premise && (
										<p className="text-red-400 text-sm mt-1">
											{errors.premise.message}
										</p>
									)}
								</div>

								<div>
									<Label htmlFor="advancedOptions" className="text-white">
										Advanced Options (Optional)
									</Label>
									<Textarea
										id="advancedOptions"
										{...register("advancedOptions")}
										placeholder="Add any special notes, tags, or advanced settings..."
										className="mt-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
										rows={3}
									/>
								</div>
							</div>
						</GlassCard>

						{/* Submit Button */}
						<div className="flex justify-end space-x-4">
							<Link href="/dashboard">
								<Button
									variant="ghost"
									className="text-gray-300 hover:text-white"
								>
									Cancel
								</Button>
							</Link>
							<MysticalButton type="submit" disabled={isLoading} size="lg" glow>
								<Sparkles className="w-5 h-5 mr-2" />
								{isLoading ? "Creating Saga..." : "Create Saga"}
							</MysticalButton>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
