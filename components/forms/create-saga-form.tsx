"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Saga } from "@/lib/types";
import { SagaService } from "@/lib/saga-service";
import { useRouter } from "next/navigation";

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

type CreateSagaFormValues = z.infer<typeof formSchema>;

export function CreateSagaForm() {
	const form = useForm<CreateSagaFormValues>({
		// No 'schema' property; validation should be handled via resolver if needed
	});
	const router = useRouter();

	const onSubmit = async (data: CreateSagaFormValues) => {
		try {
			const sagaData: Omit<Saga, "_id" | "userId" | "createdAt" | "updatedAt"> =
				{
					...data,
				};

			const result = await SagaService.createSaga(sagaData, "");

			toast.success("Saga created successfully!");
			router.push(`/sagas/${result._id}`);
		} catch (error) {
			console.error("Error creating saga:", error);
			toast.error("Failed to create saga. Please try again.");
		}
	};

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
									placeholder="Enter saga title"
									{...field}
									className="bg-white/10 border-white/20 text-white"
								/>
							</FormControl>
							<FormDescription className="text-gray-400">
								A short, descriptive title for your saga
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
							<FormLabel className="text-gray-200">World Name</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter world name"
									{...field}
									className="bg-white/10 border-white/20 text-white"
								/>
							</FormControl>
							<FormDescription className="text-gray-400">
								The name of the world where your saga takes place
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
								<Input
									placeholder="Enter a brief description of the world"
									{...field}
									className="bg-white/10 border-white/20 text-white"
								/>
							</FormControl>
							<FormDescription className="text-gray-400">
								A short description of the world, its setting, and key features
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
							<FormLabel className="text-gray-200">Mood and Tropes</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter the mood and tropes"
									{...field}
									className="bg-white/10 border-white/20 text-white"
								/>
							</FormControl>
							<FormDescription className="text-gray-400">
								The overall mood and any specific tropes you want to include
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
							<FormLabel className="text-gray-200">Premise</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter the premise of the saga"
									{...field}
									className="bg-white/10 border-white/20 text-white"
								/>
							</FormControl>
							<FormDescription className="text-gray-400">
								The main premise or concept of your saga
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
							<FormLabel className="text-gray-200">Advanced Options</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter any advanced options"
									{...field}
									className="bg-white/10 border-white/20 text-white"
								/>
							</FormControl>
							<FormDescription className="text-gray-400">
								Any advanced options or settings for the saga (optional)
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

				<Button
					type="submit"
					className="w-full bg-purple-600 hover:bg-purple-700"
					disabled={form.formState.isSubmitting}
				>
					{form.formState.isSubmitting ? (
						<>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							Creating...
						</>
					) : (
						<>
							<Sparkles className="w-4 h-4 mr-2" />
							Create Saga
						</>
					)}
				</Button>
			</form>
		</Form>
	);
}
