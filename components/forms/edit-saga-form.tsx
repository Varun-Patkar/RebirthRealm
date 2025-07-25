"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Saga } from "@/lib/types";

interface EditSagaFormProps {
	saga: Saga;
}

const formSchema = z.object({
	title: z.string().min(3, {
		message: "Title must be at least 3 characters.",
	}),
	worldName: z.string().min(3, {
		message: "World name must be at least 3 characters.",
	}),
	worldDescription: z.string().min(10, {
		message: "World description must be at least 10 characters.",
	}),
	moodAndTropes: z.string().min(5, {
		message: "Mood and tropes must be at least 5 characters.",
	}),
	premise: z.string().min(20, {
		message: "Premise must be at least 20 characters.",
	}),
	advancedOptions: z.string().optional(),
	totalChapters: z.number().min(1).max(1000).default(100),
});

export function EditSagaForm({ saga }: EditSagaFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();

	// Ensure the totalChapters field is properly initialized
	const defaultValues = {
		...saga,
		totalChapters: saga.totalChapters || 100,
		advancedOptions: saga.advancedOptions || "",
	};

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues,
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsSubmitting(true);
		try {
			console.log("Submitting saga update:", values);
			console.log("Saga ID:", saga._id);

			const response = await fetch(`/api/sagas/${saga._id}`, {
				method: "PATCH", // Changed from PUT to PATCH to match API endpoint
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(values),
			});

			const data = await response.json();

			if (response.ok) {
				toast.success("Saga updated successfully");
				router.push(`/sagas/${saga._id}`);
				router.refresh();
			} else {
				console.error("Failed to update saga:", data);
				toast.error(data.error || "Failed to update saga");
			}
		} catch (error) {
			console.error("Error updating saga:", error);
			toast.error("An error occurred while updating the saga");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-gray-200">Title</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter a title for your saga"
									{...field}
									className="bg-white/10 border-white/20 text-white"
								/>
							</FormControl>
							<FormDescription className="text-gray-400">
								The main title for your interactive story.
							</FormDescription>
							<FormMessage className="text-red-400" />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="worldName"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-gray-200">
								World/Setting Name
							</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter world name"
									{...field}
									className="bg-white/10 border-white/20 text-white"
								/>
							</FormControl>
							<FormDescription className="text-gray-400">
								Name of the world or setting
							</FormDescription>
							<FormMessage className="text-red-400" />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="worldDescription"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-gray-200">World Description</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Describe your world/setting in detail"
									{...field}
									className="bg-white/10 border-white/20 text-white min-h-[100px]"
								/>
							</FormControl>
							<FormDescription className="text-gray-400">
								Provide details about the world, setting, and background.
							</FormDescription>
							<FormMessage className="text-red-400" />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="moodAndTropes"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-gray-200">Mood & Tropes</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Describe the mood and key tropes"
									{...field}
									className="bg-white/10 border-white/20 text-white min-h-[80px]"
								/>
							</FormControl>
							<FormDescription className="text-gray-400">
								Describe the mood, tone, and key tropes for your story.
							</FormDescription>
							<FormMessage className="text-red-400" />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="premise"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-gray-200">Story Premise</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Describe the premise of your story"
									{...field}
									className="bg-white/10 border-white/20 text-white min-h-[150px]"
								/>
							</FormControl>
							<FormDescription className="text-gray-400">
								Outline the core premise and plot of your story.
							</FormDescription>
							<FormMessage className="text-red-400" />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="totalChapters"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-gray-200">Total Chapters</FormLabel>
							<FormControl>
								<Input
									type="number"
									min="1"
									max="1000"
									placeholder="100"
									{...field}
									onChange={(e) =>
										field.onChange(parseInt(e.target.value) || 100)
									}
									className="bg-white/10 border-white/20 text-white"
								/>
							</FormControl>
							<FormDescription className="text-gray-400">
								Approximate number of chapters for the complete story (affects
								pacing)
							</FormDescription>
							<FormMessage className="text-red-400" />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="advancedOptions"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-gray-200">
								Advanced Options (Optional)
							</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Additional options or requirements"
									{...field}
									className="bg-white/10 border-white/20 text-white min-h-[80px]"
								/>
							</FormControl>
							<FormDescription className="text-gray-400">
								Optional advanced settings for the saga
							</FormDescription>
							<FormMessage className="text-red-400" />
						</FormItem>
					)}
				/>

				<Button
					type="submit"
					className="w-full bg-purple-600 hover:bg-purple-700"
					disabled={isSubmitting}
				>
					{isSubmitting ? (
						<>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							Saving...
						</>
					) : (
						<>
							<Save className="w-4 h-4 mr-2" />
							Save Changes
						</>
					)}
				</Button>
			</form>
		</Form>
	);
}
