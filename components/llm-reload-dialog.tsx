"use client";

import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { MysticalButton } from "@/components/mystical-button";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Cpu, Loader2 } from "lucide-react";
import WebLLMService from "@/lib/webllm-service";
import { toast } from "sonner";

interface ProgressInfo {
	progress: number;
	text: string;
}

interface LLMReloadDialogProps {
	onClose: () => void;
	mode?: "initial" | "reload"; // Add mode to determine text content
}

export function LLMReloadDialog({
	onClose,
	mode = "reload",
}: LLMReloadDialogProps) {
	const [isOpen, setIsOpen] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [progressInfo, setProgressInfo] = useState<ProgressInfo>({
		progress: 0,
		text: "",
	});
	const webLLM = WebLLMService.getInstance();
	const loadingCompleteRef = useRef(false);
	const initializationFinishedRef = useRef(false);

	// Determine content based on mode
	const isInitialMode = mode === "initial";
	const title = isInitialMode ? "AI Model Required" : "Reload AI Model";
	const description = isInitialMode
		? "RebirthRealm uses your device's hardware to run a local AI model for generating stories. This requires a capable GPU and approximately 2GB of downloaded data."
		: "Are you sure you want to reload the AI model? This will reset the current model state.";
	const additionalText = isInitialMode
		? 'By clicking "Load AI Model", you agree to download and run the Llama-3.2-1B model locally on your device.'
		: "This can help if you're experiencing issues with the AI responses.";
	const buttonText = isInitialMode ? "Load AI Model" : "Reload AI Model";
	const loadingText = isInitialMode ? "Loading Model..." : "Reloading Model...";
	const successMessage = isInitialMode
		? "AI model loaded successfully!"
		: "AI model reloaded successfully!";

	// Use a separate function to safely close the dialog
	const safelyCloseDialog = () => {
		toast.success(successMessage);
		setIsOpen(false);
		onClose();
	};

	// Check for initialization completion
	useEffect(() => {
		// Only run if we're in loading state
		if (!isLoading) return;

		// Check if initialization is finished and engine is initialized
		if (
			initializationFinishedRef.current &&
			webLLM.isInitialized() &&
			!loadingCompleteRef.current
		) {
			loadingCompleteRef.current = true;

			// Add a significant delay before closing to ensure everything is ready
			const timer = setTimeout(() => {
				safelyCloseDialog();
			}, 2000);

			return () => clearTimeout(timer);
		}
	}, [isLoading, onClose, progressInfo.text, successMessage]);

	const handleAction = async () => {
		if (isLoading) return; // Prevent multiple calls

		try {
			setIsLoading(true);
			loadingCompleteRef.current = false;
			initializationFinishedRef.current = false;

			// Choose method based on mode
			const method = isInitialMode
				? webLLM.initialize.bind(webLLM)
				: webLLM.reloadEngine.bind(webLLM);

			// Use a promise-based approach with proper tracking
			method((progress) => {
				// Update progress info
				setProgressInfo({
					progress: progress.progress || 0,
					text: progress.text || "Loading model...",
				});

				// Check for completion signal in the progress text
				if (
					progress.text &&
					progress.text.includes("initialization finished")
				) {
					initializationFinishedRef.current = true;
				}
			}).catch((error) => {
				console.error(
					`Failed to ${isInitialMode ? "initialize" : "reload"} WebLLM:`,
					error
				);
				toast.error(
					`Failed to ${
						isInitialMode ? "initialize" : "reload"
					} the AI model. Please try again later.`
				);
				setIsLoading(false);
			});
		} catch (error) {
			console.error(
				`Failed to ${isInitialMode ? "initialize" : "reload"} WebLLM:`,
				error
			);
			toast.error(
				`Failed to ${
					isInitialMode ? "initialize" : "reload"
				} the AI model. Please try again later.`
			);
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		// Only allow closing if not currently loading
		if (!isLoading) {
			setIsOpen(false);
			onClose();
		}
	};

	if (!isOpen) return null;

	// Extract loading stage from text if available
	let loadingStage = "";
	const stageMatcher = /\[(\d+)\/(\d+)\]/;
	if (progressInfo.text) {
		const match = progressInfo.text.match(stageMatcher);
		if (match) {
			loadingStage = ` (Stage ${match[1]}/${match[2]})`;
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<GlassCard className="max-w-lg p-6 mx-4">
				<div className="flex items-start mb-4">
					<AlertTriangle className="w-6 h-6 text-yellow-400 mr-3 flex-shrink-0 mt-1" />
					<div>
						<h2 className="text-xl font-bold text-white mb-2">{title}</h2>
						<p className="text-gray-300 mb-4">{description}</p>
						<p className="text-gray-300 mb-4">{additionalText}</p>

						{isLoading && (
							<div className="mb-4">
								<div className="flex items-center justify-between mb-2">
									<span className="text-sm text-gray-300">
										{progressInfo.text || "Preparing to load model..."}
									</span>
									<span className="text-sm text-gray-300">
										{Math.round(progressInfo.progress * 100)}%{loadingStage}
									</span>
								</div>
								<div className="w-full bg-gray-700 rounded-full h-2">
									<div
										className="bg-gradient-to-r from-purple-500 to-teal-500 h-2 rounded-full"
										style={{ width: `${progressInfo.progress * 100}%` }}
									></div>
								</div>
								<p className="text-xs text-gray-400 mt-2">
									This may take several minutes. Please don't close this window
									during loading.
								</p>
							</div>
						)}
					</div>
				</div>

				<div className="flex justify-end space-x-3 mt-6">
					{!isLoading && (
						<Button
							variant="ghost"
							className="text-gray-300 hover:text-white"
							onClick={handleCancel}
						>
							Cancel
						</Button>
					)}
					<MysticalButton onClick={handleAction} disabled={isLoading} glow>
						{isLoading ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								{loadingText}
							</>
						) : (
							<>
								<Cpu className="w-4 h-4 mr-2" />
								{buttonText}
							</>
						)}
					</MysticalButton>
				</div>
			</GlassCard>
		</div>
	);
}
